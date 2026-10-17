import os
import sys
import shutil
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add workspace to sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from backend.auth import (
        register_user, authenticate_user, verify_session, destroy_session
    )
    from backend.vector_store import vector_store
    from backend.sample_docs import load_sample_knowledge
    from backend.graph import run_rag_pipeline, get_llm_client
except ImportError:
    from auth import (
        register_user, authenticate_user, verify_session, destroy_session
    )
    from vector_store import vector_store
    from sample_docs import load_sample_knowledge
    from graph import run_rag_pipeline, get_llm_client

app = FastAPI(
    title="Synapse RAG • Personal AI Knowledge Assistant",
    description="Agentic RAG Assistant powered by LangGraph, ChromaDB, and FastAPI with User Authentication",
    version="1.0.0"
)

# Enable CORS for Vite dev server (e.g., http://localhost:5173 or other ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# Auth Helpers and Dependency
# =====================================================================
def get_auth_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return authorization


def require_user(token: Optional[str] = Depends(get_auth_token)) -> Dict[str, Any]:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    user = verify_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")
    return user


# =====================================================================
# Pydantic Request Models
# =====================================================================
class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    avatar: Optional[str] = None


class LLMConfigModel(BaseModel):
    provider: str = "demo"  # "demo", "gemini", "openai", "groq", "ollama"
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    base_url: Optional[str] = None


class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[Dict[str, str]]] = None
    llm_config: Optional[LLMConfigModel] = None


# =====================================================================
# Auth Endpoints
# =====================================================================
@app.post("/api/auth/register")
async def api_register(req: RegisterRequest):
    try:
        data = register_user(
            username=req.username,
            password=req.password,
            full_name=req.full_name,
            avatar=req.avatar
        )
        return {"success": True, "token": data["token"], "user": data["user"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/api/auth/login")
async def api_login(req: LoginRequest):
    try:
        data = authenticate_user(username=req.username, password=req.password)
        return {"success": True, "token": data["token"], "user": data["user"]}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@app.get("/api/auth/me")
async def api_me(user: Dict[str, Any] = Depends(require_user)):
    return {"user": user}


@app.post("/api/auth/logout")
async def api_logout(token: Optional[str] = Depends(get_auth_token)):
    if token:
        destroy_session(token)
    return {"success": True, "message": "Logged out successfully."}


# =====================================================================
# Health & Status Endpoint
# =====================================================================
@app.get("/api/health")
async def api_health():
    stats = vector_store.get_stats()
    return {
        "status": "online",
        "app_name": "Synapse RAG Assistant",
        "version": "1.0.0",
        "documents_count": stats["documents_count"],
        "total_chunks": stats["total_chunks"],
        "timestamp": time.time()
    }


# =====================================================================
# Document Management Endpoints
# =====================================================================
@app.get("/api/documents")
async def list_documents(user: Dict[str, Any] = Depends(require_user)):
    stats = vector_store.get_stats()
    return {
        "documents_count": stats["documents_count"],
        "total_chunks": stats["total_chunks"],
        "documents": stats["documents"]
    }


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(require_user)
):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        doc_record = vector_store.add_document(
            filename=file.filename or "uploaded_document",
            file_bytes=content,
            user_id=user["id"]
        )
        return {
            "success": True,
            "document": doc_record,
            "message": f"Successfully indexed '{file.filename}' into {doc_record['total_chunks']} chunks."
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@app.post("/api/documents/load-sample")
async def api_load_sample(user: Dict[str, Any] = Depends(require_user)):
    try:
        loaded = load_sample_knowledge(vector_store, user_id=user["id"])
        stats = vector_store.get_stats()
        return {
            "success": True,
            "newly_loaded_count": len(loaded),
            "total_documents": stats["documents_count"],
            "total_chunks": stats["total_chunks"],
            "message": f"Loaded {len(loaded)} sample knowledge document(s)."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading sample docs: {str(e)}")


@app.get("/api/documents/{doc_id}/chunks")
async def get_document_chunks(doc_id: str, user: Dict[str, Any] = Depends(require_user)):
    chunks = vector_store.get_document_chunks(doc_id)
    doc_info = vector_store.metadata.get(doc_id)
    if not doc_info:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {
        "document": doc_info,
        "chunks": chunks
    }


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, user: Dict[str, Any] = Depends(require_user)):
    success = vector_store.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"success": True, "message": "Document deleted successfully."}


# =====================================================================
# Chat & LangGraph RAG Pipeline Endpoint
# =====================================================================
@app.post("/api/chat")
async def chat_endpoint(
    req: ChatRequest,
    user: Dict[str, Any] = Depends(require_user)
):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    config_dict = req.llm_config.dict() if req.llm_config else {"provider": "demo"}

    try:
        result = run_rag_pipeline(
            question=req.question.strip(),
            chat_history=req.chat_history or [],
            user_id=user["id"],
            llm_config=config_dict
        )
        return {
            "success": True,
            "user": user["username"],
            "question": result["question"],
            "answer": result["answer"],
            "route": result["route"],
            "citations": result["citations"],
            "confidence": result["confidence"],
            "steps": result["steps"],
            "status": result["status"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Pipeline Error: {str(e)}")


# =====================================================================
# LangGraph Topology & Metadata Endpoint
# =====================================================================
@app.get("/api/graph/info")
async def get_graph_info():
    return {
        "graph_name": "LangGraph RAG Knowledge Pipeline",
        "entry_point": "router_node",
        "end_point": "END",
        "nodes": [
            {
                "id": "router_node",
                "name": "Router Node",
                "description": "Classifies incoming query intent (conversational greeting vs. knowledge retrieval) using pattern matching and state checks.",
                "color": "#6366F1",
                "type": "conditional"
            },
            {
                "id": "retriever_node",
                "name": "Retriever Node",
                "description": "Queries ChromaDB vector collection with cosine similarity and lexical overlap boost to extract top candidate chunks.",
                "color": "#06B6D4",
                "type": "retrieval"
            },
            {
                "id": "synthesizer_node",
                "name": "Synthesizer Node",
                "description": "Synthesizes the answer using configured LLM (Gemini / OpenAI / Groq / Ollama) or built-in offline grounded extractive engine.",
                "color": "#10B981",
                "type": "generation"
            },
            {
                "id": "verifier_node",
                "name": "Verifier Node",
                "description": "Cross-verifies synthesized claims against candidate passages, attaches exact citation badges and computes confidence score.",
                "color": "#8B5CF6",
                "type": "verification"
            }
        ],
        "edges": [
            {"from": "START", "to": "router_node", "label": "incoming question"},
            {"from": "router_node", "to": "retriever_node", "label": "route == 'retrieve'"},
            {"from": "router_node", "to": "synthesizer_node", "label": "route == 'direct' / 'empty_kb'"},
            {"from": "retriever_node", "to": "synthesizer_node", "label": "context chunks"},
            {"from": "synthesizer_node", "to": "verifier_node", "label": "draft response"},
            {"from": "verifier_node", "to": "END", "label": "grounded response with citations"}
        ]
    }


# =====================================================================
# Test LLM Connection
# =====================================================================
@app.post("/api/test-llm")
async def test_llm_connection(req: LLMConfigModel):
    if req.provider == "demo":
        return {
            "valid": True,
            "message": "Demo mode is active! Grounded synthesis works offline without external API keys."
        }
    try:
        llm = get_llm_client({
            "provider": req.provider,
            "api_key": req.api_key,
            "model_name": req.model_name,
            "base_url": req.base_url
        })
        if not llm:
            return {"valid": False, "error": f"Could not initialize provider '{req.provider}'"}
        
        test_res = llm.invoke("Test connection. Please reply 'Connected successfully'.")
        output = test_res.content if hasattr(test_res, "content") else str(test_res)
        return {
            "valid": True,
            "message": "Connection verified successfully!",
            "sample_output": output[:60]
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


# =====================================================================
# Mount Built Frontend (SPA)
# =====================================================================
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from starlette.exceptions import HTTPException as StarletteHTTPException
    from fastapi.responses import FileResponse, JSONResponse

    @app.exception_handler(404)
    @app.exception_handler(StarletteHTTPException)
    async def spa_fallback(request, exc):
        if not request.url.path.startswith("/api"):
            index_path = os.path.join(frontend_dist, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
        detail = getattr(exc, "detail", "Not Found")
        status_code = getattr(exc, "status_code", 404)
        return JSONResponse(status_code=status_code, content={"detail": detail})

    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)
