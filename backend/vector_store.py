import os
import re
import json
import uuid
import time
from typing import List, Dict, Any, Optional
import pypdf
import chromadb
from chromadb.config import Settings

BACKEND_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
CHROMA_PERSIST_DIR = os.path.join(DATA_DIR, "chroma_db")
DOCUMENTS_STORAGE_DIR = os.path.join(DATA_DIR, "documents")
DOC_METADATA_FILE = os.path.join(DATA_DIR, "documents_meta.json")

os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(DOCUMENTS_STORAGE_DIR, exist_ok=True)


class RecursiveTextSplitter:
    """Smart character text splitter preserving paragraph and sentence boundaries."""
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 80):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = ["\n\n", "\n", ". ", "; ", "? ", "! ", " ", ""]

    def split_text(self, text: str) -> List[str]:
        text = text.strip()
        if not text:
            return []
        
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            if end < text_len:
                split_at = -1
                for sep in self.separators:
                    pos = text.rfind(sep, start, end)
                    if pos != -1 and pos > start + (self.chunk_size // 3):
                        split_at = pos + len(sep)
                        break
                if split_at != -1:
                    end = split_at

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            if end >= text_len:
                break
            start = max(start + 1, end - self.chunk_overlap)

        return chunks


class VectorStoreManager:
    """Manages ChromaDB vector store collection and document lifecycle."""
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False, allow_reset=True)
        )
        self.collection_name = "knowledge_corpus"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Simple RAG Project Knowledge Corpus", "hnsw:space": "cosine"}
        )
        self.splitter = RecursiveTextSplitter(chunk_size=550, chunk_overlap=90)
        self.metadata = self._load_metadata()

    def _load_metadata(self) -> Dict[str, Any]:
        if os.path.exists(DOC_METADATA_FILE):
            try:
                with open(DOC_METADATA_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_metadata(self):
        with open(DOC_METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)

    def extract_text_from_file(self, file_path: str, filename: str) -> List[Dict[str, Any]]:
        """Extract text chunks with page numbers from PDF, TXT, MD, etc."""
        ext = os.path.splitext(filename)[1].lower()
        extracted_pages = []

        if ext == ".pdf":
            try:
                reader = pypdf.PdfReader(file_path)
                for page_num, page in enumerate(reader.pages, start=1):
                    raw_text = page.extract_text() or ""
                    cleaned = re.sub(r"\s+", " ", raw_text).strip()
                    if cleaned:
                        extracted_pages.append({"page": page_num, "text": cleaned})
            except Exception as e:
                print(f"Error reading PDF {filename}: {e}")
        else:
            # Handle TXT, MD, CSV, JSON, etc.
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                cleaned = content.strip()
                if cleaned:
                    extracted_pages.append({"page": 1, "text": cleaned})
            except Exception as e:
                print(f"Error reading text file {filename}: {e}")

        return extracted_pages

    def add_document(self, filename: str, file_bytes: bytes, user_id: str = "global") -> Dict[str, Any]:
        """Saves file to disk, splits into chunks, and embeds into ChromaDB."""
        doc_id = f"doc_{uuid.uuid4().hex[:10]}"
        safe_filename = re.sub(r"[^a-zA-Z0-9_\.-]", "_", filename)
        saved_filename = f"{doc_id}_{safe_filename}"
        file_path = os.path.join(DOCUMENTS_STORAGE_DIR, saved_filename)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        pages = self.extract_text_from_file(file_path, filename)
        if not pages:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise ValueError(f"Could not extract readable text from '{filename}'.")

        all_chunks = []
        ids = []
        metadatas = []

        chunk_idx = 0
        for page_info in pages:
            page_num = page_info["page"]
            text = page_info["text"]
            chunks = self.splitter.split_text(text)

            for c in chunks:
                chunk_id = f"{doc_id}_c{chunk_idx}"
                ids.append(chunk_id)
                all_chunks.append(c)
                metadatas.append({
                    "doc_id": doc_id,
                    "filename": filename,
                    "page": page_num,
                    "chunk_index": chunk_idx,
                    "user_id": user_id
                })
                chunk_idx += 1

        if not all_chunks:
            raise ValueError(f"No valid text chunks generated for '{filename}'.")

        # ChromaDB auto-computes embeddings if none passed using default onnx/sentence-transformer
        self.collection.add(
            ids=ids,
            documents=all_chunks,
            metadatas=metadatas
        )

        doc_record = {
            "doc_id": doc_id,
            "filename": filename,
            "saved_filename": saved_filename,
            "size_bytes": len(file_bytes),
            "total_pages": len(pages),
            "total_chunks": len(all_chunks),
            "user_id": user_id,
            "uploaded_at": time.time(),
            "formatted_time": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        self.metadata[doc_id] = doc_record
        self._save_metadata()
        return doc_record

    def delete_document(self, doc_id: str) -> bool:
        if doc_id not in self.metadata:
            return False

        doc_info = self.metadata[doc_id]
        saved_filename = doc_info.get("saved_filename")
        if saved_filename:
            file_path = os.path.join(DOCUMENTS_STORAGE_DIR, saved_filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

        try:
            self.collection.delete(where={"doc_id": doc_id})
        except Exception as e:
            print(f"Error removing chunks from ChromaDB: {e}")

        del self.metadata[doc_id]
        self._save_metadata()
        return True

    def get_document_chunks(self, doc_id: str) -> List[Dict[str, Any]]:
        """Returns all chunks for a specific document."""
        if doc_id not in self.metadata:
            return []
        try:
            res = self.collection.get(where={"doc_id": doc_id})
            chunks = []
            if res and res.get("documents"):
                for cid, doc, meta in zip(res["ids"], res["documents"], res["metadatas"]):
                    chunks.append({
                        "id": cid,
                        "text": doc,
                        "page": meta.get("page", 1),
                        "chunk_index": meta.get("chunk_index", 0)
                    })
                chunks.sort(key=lambda x: (x["page"], x["chunk_index"]))
            return chunks
        except Exception as e:
            print(f"Error retrieving chunks for {doc_id}: {e}")
            return []

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Searches ChromaDB with semantic similarity and keyword boost."""
        count = self.collection.count()
        if count == 0:
            return []

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=min(top_k, count),
                include=["documents", "metadatas", "distances"]
            )

            hits = []
            if results and results.get("documents") and results["documents"][0]:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else []
                distances = results["distances"][0] if results.get("distances") else []

                for i in range(len(docs)):
                    meta = metas[i] if i < len(metas) else {}
                    dist = distances[i] if i < len(distances) else 1.0

                    # Convert distance to similarity in [0, 1]
                    similarity = max(0.0, min(1.0, 1.0 - (dist / 2.0)))

                    # Term frequency overlap boost
                    q_words = set(re.findall(r"\w+", query.lower()))
                    c_words = set(re.findall(r"\w+", docs[i].lower()))
                    overlap = len(q_words.intersection(c_words)) / max(len(q_words), 1)
                    score = round(0.75 * similarity + 0.25 * overlap, 3)

                    hits.append({
                        "id": results["ids"][0][i] if results.get("ids") else f"c_{i}",
                        "content": docs[i],
                        "doc_id": meta.get("doc_id", "unknown"),
                        "filename": meta.get("filename", "unknown"),
                        "page": meta.get("page", 1),
                        "score": score,
                        "similarity": round(similarity, 3)
                    })

                hits.sort(key=lambda x: x["score"], reverse=True)
                return hits
        except Exception as e:
            print(f"ChromaDB search error: {e}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        return {
            "documents_count": len(self.metadata),
            "total_chunks": self.collection.count(),
            "documents": list(self.metadata.values())
        }


vector_store = VectorStoreManager()
