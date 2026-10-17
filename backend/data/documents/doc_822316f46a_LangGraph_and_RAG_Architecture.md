# Agentic RAG and LangGraph 2.0 Comprehensive Architecture

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
