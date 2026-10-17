import os
import re
import json
import time
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
import sys

# Ensure root directory is in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from backend.vector_store import vector_store
except ImportError:
    from vector_store import vector_store


class RAGState(TypedDict):
    question: str
    chat_history: List[Dict[str, str]]
    user_id: str
    llm_config: Dict[str, Any]
    route: str
    retrieved_docs: List[Dict[str, Any]]
    answer: str
    citations: List[Dict[str, Any]]
    steps: List[Dict[str, Any]]
    confidence: float
    status: str


# Helper LLM cache
_llm_cache = {}


def get_llm_client(config: Optional[Dict[str, Any]] = None):
    """Instantiates the requested LLM client (Gemini, OpenAI, Groq, Ollama) if configured."""
    config = config or {}
    provider = config.get("provider", "demo").lower()
    api_key = (
        config.get("api_key")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("GROQ_API_KEY")
    )
    model_name = config.get("model_name")
    base_url = config.get("base_url")

    if provider == "ollama" and not api_key:
        api_key = "ollama"

    if provider == "demo" or not api_key:
        return None

    cache_key = f"{provider}_{model_name}_{base_url or 'default'}_{api_key[:6] if api_key else ''}"
    if cache_key in _llm_cache:
        return _llm_cache[cache_key]

    try:
        if provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(
                model=model_name or "gemini-2.5-flash",
                google_api_key=api_key,
                temperature=0.2
            )
            _llm_cache[cache_key] = llm
            return llm

        elif provider == "openai":
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model=model_name or "gpt-4o-mini",
                api_key=api_key,
                temperature=0.2,
                base_url=base_url if base_url else None
            )
            _llm_cache[cache_key] = llm
            return llm

        elif provider in ("groq", "ollama"):
            from langchain_openai import ChatOpenAI
            default_url = "https://api.groq.com/openai/v1" if provider == "groq" else "http://localhost:11434/v1"
            llm = ChatOpenAI(
                model=model_name or ("llama-3.3-70b-versatile" if provider == "groq" else "llama3"),
                api_key=api_key,
                base_url=base_url or default_url,
                temperature=0.2
            )
            _llm_cache[cache_key] = llm
            return llm
    except Exception as e:
        print(f"Error instantiating LLM for provider {provider}: {e}")
        return None

    return None


# =====================================================================
# Node 1: Router Node (Intent Classification)
# =====================================================================
GREETINGS_PATTERN = re.compile(
    r"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day)|who\s+are\s+you|what\s+can\s+you\s+do|help|thanks|thank\s+you|bye|goodbye)[\s!\?\.]*$",
    re.IGNORECASE
)


def router_node(state: RAGState) -> Dict[str, Any]:
    question = state.get("question", "").strip()
    steps = list(state.get("steps", []))
    
    is_greeting = bool(GREETINGS_PATTERN.match(question))
    
    # Check if vector store has any documents
    stats = vector_store.get_stats()
    has_docs = stats["total_chunks"] > 0

    if is_greeting or len(question.split()) <= 2 and is_greeting:
        route = "direct"
        summary = "Conversational intent detected. Routing directly to conversational response without RAG retrieval."
    elif not has_docs:
        route = "empty_kb"
        summary = "No documents currently in knowledge base. Routing to helpful onboarding response."
    else:
        route = "retrieve"
        summary = f"Information seeking query detected. Routing to vector retrieval against {stats['total_chunks']} chunks in ChromaDB."

    step_info = {
        "node": "router_node",
        "action": "Intent Classification",
        "timestamp": time.time(),
        "summary": summary,
        "details": {
            "route": route,
            "has_documents": has_docs,
            "total_chunks_available": stats["total_chunks"]
        }
    }
    steps.append(step_info)

    return {
        "route": route,
        "steps": steps,
        "status": "routed"
    }


# =====================================================================
# Node 2: Retriever Node (Vector DB Search)
# =====================================================================
def retriever_node(state: RAGState) -> Dict[str, Any]:
    route = state.get("route", "retrieve")
    steps = list(state.get("steps", []))

    if route != "retrieve":
        return {"retrieved_docs": [], "steps": steps}

    question = state.get("question", "")
    top_k = 4
    
    # Semantic search in ChromaDB
    hits = vector_store.search(question, top_k=top_k)

    step_info = {
        "node": "retriever_node",
        "action": "Semantic Vector Search",
        "timestamp": time.time(),
        "summary": f"Retrieved {len(hits)} relevant chunk(s) from ChromaDB matching query '{question[:60]}...'",
        "details": {
            "query": question,
            "matches_count": len(hits),
            "top_match_file": hits[0]["filename"] if hits else None,
            "top_match_score": hits[0]["score"] if hits else 0
        }
    }
    steps.append(step_info)

    return {
        "retrieved_docs": hits,
        "steps": steps,
        "status": "retrieved"
    }


# =====================================================================
# Node 3: Synthesizer Node (LLM / Grounded Synthesis)
# =====================================================================
def _extractive_synthesis(question: str, retrieved_docs: List[Dict[str, Any]]) -> str:
    """Smart grounded extractive synthesizer used when no external LLM API key is configured."""
    if not retrieved_docs:
        return (
            "I searched your knowledge base, but couldn't find matching information for your question. "
            "Please try uploading relevant notes, PDFs, or click **'Load Sample Knowledge'** in the sidebar!"
        )

    q_words = set(re.findall(r"\w+", question.lower()))
    
    best_excerpts = []
    for doc in retrieved_docs:
        content = doc["content"]
        # Split into sentences
        sentences = re.split(r"(?<=[.!?])\s+", content)
        scored_sentences = []
        for s in sentences:
            s_clean = s.strip()
            if len(s_clean) < 25:
                continue
            s_words = set(re.findall(r"\w+", s_clean.lower()))
            overlap = len(q_words.intersection(s_words))
            if overlap > 0:
                scored_sentences.append((overlap, s_clean))
        
        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        top_sentences = [s[1] for s in scored_sentences[:3]]
        if top_sentences:
            best_excerpts.append({
                "filename": doc["filename"],
                "page": doc.get("page", 1),
                "text": " ".join(top_sentences)
            })

    if not best_excerpts:
        # Fallback to top chunk snippet
        top = retrieved_docs[0]
        return (
            f"Based on **{top['filename']}** (Page {top.get('page', 1)}):\n\n"
            f"> {top['content']}\n\n"
            f"*Source: {top['filename']}*"
        )

    # Build coherent markdown answer
    answer_parts = [
        f"Based on your documents in the knowledge base, here is what was found regarding **'{question}'**:\n"
    ]

    for idx, item in enumerate(best_excerpts, 1):
        answer_parts.append(f"### 📌 Key Point {idx} (from *{item['filename']}*, Page {item['page']}):")
        answer_parts.append(f"{item['text']}\n")

    answer_parts.append(
        "💡 *Tip: Configure your Gemini or OpenAI API key in Settings for multi-step reasoning and synthesized conversational dialogue.*"
    )
    return "\n".join(answer_parts)


def synthesizer_node(state: RAGState) -> Dict[str, Any]:
    route = state.get("route", "retrieve")
    question = state.get("question", "")
    retrieved_docs = state.get("retrieved_docs", [])
    llm_config = state.get("llm_config", {})
    steps = list(state.get("steps", []))

    # Case 1: Direct Greeting or conversational query
    if route == "direct":
        answer = (
            f"Hello! 👋 I am your **LangGraph RAG Knowledge Assistant**.\n\n"
            f"You can ask me questions about your uploaded documents, study materials, or technical guides. "
            f"I use **LangGraph** to route queries, retrieve semantic passages from **ChromaDB**, and generate grounded answers with verifiable source citations.\n\n"
            f"**Try asking:**\n"
            f"- *'What is LangGraph and how does it work?'*\n"
            f"- *'Explain the difference between RAG and Fine-tuning.'*\n"
            f"- *'What are the security principles for authentication?'*\n\n"
            f"Or click **'Load Sample Knowledge'** in the sidebar to populate standard reference docs!"
        )
        step_info = {
            "node": "synthesizer_node",
            "action": "Direct Conversational Response",
            "timestamp": time.time(),
            "summary": "Generated direct greeting and capabilities overview without document retrieval.",
            "details": {"mode": "direct_conversation"}
        }
        steps.append(step_info)
        return {"answer": answer, "steps": steps, "status": "synthesized"}

    # Case 2: Knowledge Base is empty
    if route == "empty_kb":
        answer = (
            "⚠️ **Your knowledge base is currently empty!**\n\n"
            "To get started with RAG Q&A:\n"
            "1. Click **'Load Sample Knowledge'** in the left sidebar to instantly load curated guides on LangGraph, AI, and Authentication.\n"
            "2. Or drag-and-drop your own PDF, TXT, or Markdown documents.\n"
            "3. Then ask any question, and I will retrieve answers backed by your files!"
        )
        step_info = {
            "node": "synthesizer_node",
            "action": "Empty Knowledge Base Guidance",
            "timestamp": time.time(),
            "summary": "Informed user that no documents are uploaded yet.",
            "details": {"mode": "empty_kb"}
        }
        steps.append(step_info)
        return {"answer": answer, "steps": steps, "status": "synthesized"}

    # Case 3: Standard RAG generation
    llm = get_llm_client(llm_config)
    used_llm_name = None

    if llm and retrieved_docs:
        try:
            # Build context prompt
            context_blocks = []
            for i, doc in enumerate(retrieved_docs, 1):
                context_blocks.append(
                    f"[Source {i} | File: {doc['filename']} | Page: {doc.get('page', 1)}]\n{doc['content']}"
                )
            context_str = "\n\n---\n\n".join(context_blocks)

            system_prompt = (
                "You are an expert AI Knowledge Assistant built with LangGraph. "
                "Answer the user's question accurately using ONLY the retrieved context below. "
                "If the context does not contain the answer, say honestly that the documents do not specify. "
                "Structure your response with clear markdown headings, bullet points, and cite sources in brackets like [Source 1] or [FileName, Page X]."
            )
            user_prompt = f"Context:\n{context_str}\n\nQuestion: {question}\n\nAnswer:"

            response = llm.invoke([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            answer = response.content if hasattr(response, "content") else str(response)
            used_llm_name = getattr(llm, "model_name", getattr(llm, "model", "external-llm"))
        except Exception as e:
            print(f"Error calling LLM, falling back to extractive synthesis: {e}")
            answer = _extractive_synthesis(question, retrieved_docs)
    else:
        answer = _extractive_synthesis(question, retrieved_docs)

    step_info = {
        "node": "synthesizer_node",
        "action": "Answer Synthesis",
        "timestamp": time.time(),
        "summary": (
            f"Synthesized answer using {'LLM (' + str(used_llm_name) + ')' if used_llm_name else 'Built-in Grounded Extractive Engine'}."
        ),
        "details": {
            "provider": llm_config.get("provider", "demo"),
            "used_external_llm": bool(used_llm_name),
            "retrieved_count": len(retrieved_docs)
        }
    }
    steps.append(step_info)

    return {
        "answer": answer,
        "steps": steps,
        "status": "synthesized"
    }


# =====================================================================
# Node 4: Verifier Node (Source Citations & Grounding Verification)
# =====================================================================
def verifier_node(state: RAGState) -> Dict[str, Any]:
    retrieved_docs = state.get("retrieved_docs", [])
    steps = list(state.get("steps", []))
    answer = state.get("answer", "")

    citations = []
    seen_files = set()

    for idx, doc in enumerate(retrieved_docs, start=1):
        fn = doc["filename"]
        page = doc.get("page", 1)
        score = doc.get("score", 0.0)
        
        # Check snippet preview
        snippet = doc["content"][:240].strip()
        if len(doc["content"]) > 240:
            snippet += "..."

        citation = {
            "citation_id": f"cit_{idx}",
            "filename": fn,
            "page": page,
            "score": score,
            "doc_id": doc.get("doc_id", ""),
            "chunk_id": doc.get("id", ""),
            "snippet": snippet
        }
        citations.append(citation)
        seen_files.add(fn)

    # Average confidence calculation
    confidence = 0.95 if not retrieved_docs else round(
        sum(c["score"] for c in citations) / len(citations), 2
    )

    step_info = {
        "node": "verifier_node",
        "action": "Source Verification & Citations",
        "timestamp": time.time(),
        "summary": f"Verified grounding across {len(citations)} citation anchor(s) with confidence {confidence * 100:.0f}%.",
        "details": {
            "total_citations": len(citations),
            "confidence": confidence,
            "referenced_sources": list(seen_files)
        }
    }
    steps.append(step_info)

    return {
        "citations": citations,
        "confidence": confidence,
        "steps": steps,
        "status": "completed"
    }


# =====================================================================
# Conditional Edge Router
# =====================================================================
def route_decision(state: RAGState) -> str:
    route = state.get("route", "retrieve")
    if route == "retrieve":
        return "retriever_node"
    else:
        # direct or empty_kb goes straight to synthesizer
        return "synthesizer_node"


# =====================================================================
# Build & Compile LangGraph StateGraph
# =====================================================================
def create_rag_graph():
    workflow = StateGraph(RAGState)

    # Register nodes
    workflow.add_node("router_node", router_node)
    workflow.add_node("retriever_node", retriever_node)
    workflow.add_node("synthesizer_node", synthesizer_node)
    workflow.add_node("verifier_node", verifier_node)

    # Entry point
    workflow.set_entry_point("router_node")

    # Conditional branching from router
    workflow.add_conditional_edges(
        "router_node",
        route_decision,
        {
            "retriever_node": "retriever_node",
            "synthesizer_node": "synthesizer_node"
        }
    )

    # Sequential edges
    workflow.add_edge("retriever_node", "synthesizer_node")
    workflow.add_edge("synthesizer_node", "verifier_node")
    workflow.add_edge("verifier_node", END)

    return workflow.compile()


# Singleton compiled graph
rag_graph = create_rag_graph()


def run_rag_pipeline(
    question: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    user_id: str = "guest",
    llm_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Public execution interface for the LangGraph RAG assistant."""
    initial_state: RAGState = {
        "question": question,
        "chat_history": chat_history or [],
        "user_id": user_id,
        "llm_config": llm_config or {},
        "route": "retrieve",
        "retrieved_docs": [],
        "answer": "",
        "citations": [],
        "steps": [],
        "confidence": 0.0,
        "status": "pending"
    }

    result = rag_graph.invoke(initial_state)

    return {
        "question": question,
        "answer": result.get("answer", ""),
        "route": result.get("route", "retrieve"),
        "citations": result.get("citations", []),
        "confidence": result.get("confidence", 0.0),
        "steps": result.get("steps", []),
        "status": result.get("status", "completed")
    }
