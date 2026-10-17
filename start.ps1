# Synapse RAG - PowerShell Quick Launcher
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "            SYNAPSE RAG - PERSONAL AI KNOWLEDGE ASSISTANT          " -ForegroundColor White
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " [+] LangGraph 2.0 StateGraph Pipeline" -ForegroundColor Green
Write-Host " [+] ChromaDB Vector Database" -ForegroundColor Green
Write-Host " [+] Grounded Citations & Chunk Verification" -ForegroundColor Green
Write-Host " [+] User Authentication & Security" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Demo Credentials:" -ForegroundColor Yellow
Write-Host "   - User:  demo   / Pass: demo123" -ForegroundColor Yellow
Write-Host "   - Admin: admin  / Pass: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host " Launching web app at http://localhost:8000 ..." -ForegroundColor Magenta
Start-Process "http://localhost:8000"
Write-Host " Starting FastAPI backend..." -ForegroundColor Cyan

& ".\venv\Scripts\python.exe" -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
