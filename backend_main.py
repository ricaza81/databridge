"""
DataBridge API — FastAPI backend
Endpoints: /upload, /analyze, /chat, /session/{id}
"""

import os
import json
import uuid
import asyncio
from pathlib import Path
from typing import Optional

# Cargar .env automáticamente si existe
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import anthropic
import aiofiles
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend_analyzer import analyze_files, SafeEncoder

# ─── Config ──────────────────────────────────────────────────────────────────

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

SESSIONS: dict[str, dict] = {}  # En prod: Redis

app = FastAPI(title="DataBridge API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic()

# ─── Sistema prompt del agente ────────────────────────────────────────────────

SYSTEM_PROMPT = """Eres DataBridge, un agente experto en integración de datos empresariales.

Tu misión: analizar fuentes de datos heterogéneas (Excel, CSV, SQL, APIs), identificar relaciones implícitas aunque los datos estén sucios o desestructurados, y proponer un modelo de integración claro y accionable.

Cuando el usuario sube archivos, recibes un análisis técnico pre-procesado. Tu trabajo es:
1. Interpretar ese análisis en lenguaje claro y directo
2. Identificar las llaves de integración más confiables
3. Detectar problemas de calidad y proponer fixes concretos
4. Proponer el modelo unificado (entidades, relaciones, transformaciones necesarias)
5. Responder preguntas de seguimiento con precisión técnica

Tono: experto pero directo. Sin relleno. Sin "¡Excelente pregunta!". 
Formato: usa estructura clara con secciones. Sé concreto con nombres de columnas y porcentajes reales.
Idioma: español colombiano, técnico pero comprensible para un gerente comercial.

Cuando propongas código, usa Python con pandas. Cuando propongas esquemas, usa notación simple de tablas."""


# ─── Modelos ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str


class SessionResponse(BaseModel):
    session_id: str
    files: list[str]
    analysis_ready: bool


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/session")
async def create_session():
    """Crea una nueva sesión de trabajo."""
    sid = str(uuid.uuid4())
    SESSIONS[sid] = {
        "files": [],
        "file_paths": [],
        "analysis": None,
        "history": [],
    }
    return {"session_id": sid}


@app.post("/upload/{session_id}")
async def upload_files(session_id: str, files: list[UploadFile] = File(...)):
    """Sube uno o más archivos a una sesión."""
    if session_id not in SESSIONS:
        raise HTTPException(404, "Sesión no encontrada")

    session = SESSIONS[session_id]
    uploaded = []
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(exist_ok=True)

    for file in files:
        dest = session_dir / file.filename
        async with aiofiles.open(dest, "wb") as f:
            content = await file.read()
            await f.write(content)

        session["files"].append(file.filename)
        session["file_paths"].append(str(dest))
        uploaded.append(file.filename)

    # Lanzar análisis en background
    asyncio.create_task(_run_analysis(session_id))

    return {"uploaded": uploaded, "session_id": session_id}


async def _run_analysis(session_id: str):
    """Analiza los archivos de la sesión y guarda el resultado."""
    session = SESSIONS[session_id]
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, analyze_files, session["file_paths"]
        )
        session["analysis"] = result
    except Exception as e:
        session["analysis"] = {"error": str(e)}


@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Estado de la sesión y su análisis."""
    if session_id not in SESSIONS:
        raise HTTPException(404, "Sesión no encontrada")
    s = SESSIONS[session_id]
    return {
        "session_id": session_id,
        "files": s["files"],
        "analysis_ready": s["analysis"] is not None,
        "summary": s["analysis"].get("summary") if s["analysis"] else None,
    }


@app.post("/chat")
async def chat(req: ChatRequest):
    """Endpoint de chat con streaming. Devuelve SSE."""
    if req.session_id not in SESSIONS:
        raise HTTPException(404, "Sesión no encontrada")

    session = SESSIONS[req.session_id]

    # Esperar análisis si no está listo
    for _ in range(30):
        if session["analysis"] is not None:
            break
        await asyncio.sleep(0.5)

    if session["analysis"] is None:
        raise HTTPException(503, "Análisis aún no disponible")

    # Construir contexto del análisis para el primer mensaje
    analysis_context = ""
    if not session["history"]:
        analysis_json = json.dumps(session["analysis"], cls=SafeEncoder, ensure_ascii=False, indent=2)
        analysis_context = f"""El usuario acaba de subir {len(session['files'])} archivo(s): {', '.join(session['files'])}.

Aquí está el análisis técnico pre-procesado:

```json
{analysis_json}
```

Basándote en este análisis, responde a su mensaje."""

    # Construir historial de mensajes
    messages = []
    for h in session["history"]:
        messages.append({"role": h["role"], "content": h["content"]})

    user_content = f"{analysis_context}\n\n{req.message}" if analysis_context else req.message
    messages.append({"role": "user", "content": user_content})

    # Guardar en historial (con contexto solo la primera vez)
    session["history"].append({"role": "user", "content": req.message})

    async def generate():
        full_response = ""
        try:
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    full_response += text
                    yield f"data: {json.dumps({'text': text})}\n\n"

            session["history"].append({"role": "assistant", "content": full_response})
            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Elimina sesión y archivos temporales."""
    if session_id in SESSIONS:
        import shutil
        session_dir = UPLOAD_DIR / session_id
        if session_dir.exists():
            shutil.rmtree(session_dir)
        del SESSIONS[session_id]
    return {"deleted": session_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend_main:app", host="0.0.0.0", port=8000, reload=True)
