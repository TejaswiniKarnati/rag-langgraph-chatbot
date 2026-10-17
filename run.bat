@echo off
title Synapse RAG - Personal AI Knowledge Assistant
cls
echo ====================================================================
echo             SYNAPSE RAG - PERSONAL AI KNOWLEDGE ASSISTANT          
echo ====================================================================
echo  [+] LangGraph 2.0 StateGraph Pipeline
echo  [+] ChromaDB Embedded Vector Store
echo  [+] Grounded Citations & Chunk Verification
echo  [+] User Authentication & Session Security
echo ====================================================================
echo.
echo  Demo Credentials:
echo    - User:  demo   / Pass: demo123
echo    - Admin: admin  / Pass: admin123
echo.
echo  Opening web application in your default browser...
start http://localhost:8000
echo.
echo  Starting FastAPI Server on http://127.0.0.1:8000 ...
echo  (Press Ctrl+C to stop the server at any time)
echo.

.\venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
pause
