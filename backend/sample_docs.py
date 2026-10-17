"""Sample high-value knowledge documents to pre-load for instant RAG testing."""

SAMPLE_DOCS = [
    {
        "filename": "LangGraph_and_RAG_Architecture.md",
        "content": """# Agentic RAG and LangGraph 2.0 Comprehensive Architecture

## 1. What is LangGraph?
LangGraph is an open-source library developed by LangChain for orchestrating stateful multi-actor applications with Large Language Models (LLMs). Unlike linear chain pipelines (such as standard LangChain RunnableSequences), LangGraph models workflows as cyclic directed graphs (DAGs and cyclic state graphs).

In LangGraph:
- **State**: A structured schema (typically a Python TypedDict or Pydantic model) that is passed between nodes and updated monotonically or through reducer functions.
- **Nodes**: Regular Python functions or runnables that take the current state, perform computation (such as calling an LLM, querying a database, or executing tools), and return a dictionary of state updates.
- **Edges**: Direct connections between nodes or conditional functions (Conditional Edges) that dynamically determine which node to invoke next based on the current state.
- **Entry & End Points**: Workflows declare a start node via `set_entry_point(...)` and terminate when reaching the special `END` sentinel node.

## 2. Retrieval-Augmented Generation (RAG) Architecture
Retrieval-Augmented Generation bridges the gap between an LLM's parametric knowledge and external dynamic or private domain data. The core steps of RAG include:
1. **Document Ingestion & Chunking**: Raw files (PDFs, text notes, Markdown) are split into semantically coherent chunks using recursive character splitting. Typical chunk sizes range from 400 to 800 characters with a 10-20% overlap to preserve context across boundaries.
2. **Dense Vector Embeddings**: Chunks are transformed into high-dimensional vector representations using embedding models. Similar concepts reside close together in the vector space.
3. **Vector Database Retrieval**: Queries are converted into embeddings and compared against stored document vectors using distance metrics such as Cosine Similarity or Euclidean Distance. ChromaDB serves as an efficient local embedded vector store.
4. **Context Augmentation**: The highest scoring candidate chunks are injected into the LLM system prompt along with clear source anchors.
5. **Grounded Generation & Citation**: The LLM synthesizes an answer referencing the provided context without hallucinating external unsupported facts.

## 3. Self-Corrective Agentic Loops
Standard naive RAG suffers when initial retrieval fetches irrelevant chunks. LangGraph enables Self-Correcting RAG:
- A **Document Grader Node** scores each chunk for semantic relevance.
- If no chunks pass the quality threshold, a **Query Rewriter Node** reformulates the user question into broader keywords and retries retrieval.
- Once sufficient quality context is gathered, the **Synthesizer Node** outputs the answer with verifiable page and chunk citations.
"""
    },
    {
        "filename": "Modern_Artificial_Intelligence_Fundamentals.md",
        "content": """# Modern Artificial Intelligence and Large Language Models Overview

## 1. The Transformer Architecture
Introduced in the seminal 2017 paper 'Attention Is All You Need' by Vaswani et al., the Transformer revolutionized Natural Language Processing (NLP). The core mechanism is Self-Attention:
- It allows tokens in a sequence to dynamically weigh and attend to every other token, capturing long-range dependencies far better than Recurrent Neural Networks (RNNs) or LSTMs.
- Scaled Dot-Product Attention calculates attention scores using Query (Q), Key (K), and Value (V) matrices.
- Multi-Head Attention allows the model to attend to information from different representation subspaces at different positions simultaneously.

## 2. Pre-training and Fine-Tuning
Modern Foundation Models undergo two distinct training phases:
1. **Self-Supervised Pre-training**: Models process massive corpora (trillions of tokens) predicting the next token (causal language modeling) or masked tokens. This imparts general reasoning, grammar, and broad world knowledge.
2. **Instruction Fine-Tuning (SFT) & RLHF**: Supervised fine-tuning teaches models to follow user prompts as helpful assistants. Reinforcement Learning from Human Feedback (RLHF) and Direct Preference Optimization (DPO) align responses with human preferences, safety standards, and truthfulness.

## 3. RAG vs. Fine-Tuning Comparison
- **RAG (Retrieval-Augmented Generation)**:
  - Best for: Dynamic information, real-time data, verifiable citations, private enterprise documents, zero training costs.
  - Updates: Immediate upon uploading new documents into the vector store.
  - Hallucination Control: Very high, because answers must be directly grounded in retrieved context.
- **Fine-Tuning**:
  - Best for: Teaching style, tone, specialized jargon, or domain-specific formatting conventions.
  - Updates: Requires retraining, GPU compute, and careful validation against catastrophic forgetting.
  - Hallucination Control: Moderate to low; models can still hallucinate facts confidently.

## 4. Temperature and Decoding Parameters
- **Temperature**: Controls randomness. Near 0.0 produces deterministic, focused, and factual output (ideal for RAG and code generation). Values near 0.7-1.0 produce creative and diverse responses.
- **Top-p (Nucleus Sampling)**: Dynamically selects tokens from the smallest set whose cumulative probability exceeds p (e.g., 0.9).
"""
    },
    {
        "filename": "Enterprise_Application_Security_and_Auth.md",
        "content": """# Enterprise Application Security, Authentication & Session Architecture

## 1. Modern Authentication Principles
Secure web applications require robust user identity verification. The fundamental tenets include:
- **Cryptographic Password Hashing**: Passwords must never be stored in plaintext. Use salted hashes such as SHA-256 with unique cryptographically random salts per user, or adaptive algorithms like Argon2, bcrypt, and PBKDF2.
- **Salt Generation**: Unique cryptographic salts prevent pre-computed Rainbow Table attacks and ensure two users with the same password have different stored hashes.

## 2. Session Management and Token Auth
- **Bearer Tokens**: Cryptographically random session identifiers passed in the HTTP Authorization header (`Authorization: Bearer <token>`).
- **Session Expiration**: Tokens must have a deterministic Time-To-Live (TTL) to mitigate risk in case of token leakage.
- **Cross-Origin Resource Sharing (CORS)**: API servers must configure CORS middleware to restrict which origins (domains/ports) are permitted to submit requests and credentials.

## 3. Role-Based Access Control (RBAC)
User permissions are structured into roles:
- **Member / Researcher**: Standard permission to upload personal study documents, query the RAG pipeline, and inspect citations.
- **Administrator**: Full privileges to inspect server health, manage user accounts, and clear or rebuild vector database indices.
"""
    }
]


def load_sample_knowledge(vector_store_instance, user_id: str = "global"):
    """Loads default sample documents into the vector store if not already present."""
    loaded_docs = []
    existing_files = {doc.get("filename") for doc in vector_store_instance.metadata.values()}

    for sample in SAMPLE_DOCS:
        if sample["filename"] not in existing_files:
            file_bytes = sample["content"].encode("utf-8")
            doc = vector_store_instance.add_document(
                filename=sample["filename"],
                file_bytes=file_bytes,
                user_id=user_id
            )
            loaded_docs.append(doc)
    return loaded_docs
