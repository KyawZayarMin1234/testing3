# STEP 1: Load .env file
from dotenv import load_dotenv

load_dotenv()

# STEP 2: Import all libraries
import os
import json
import io
import csv
from googletrans import Translator
from docx import Document
from fpdf import FPDF
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request, Body, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import chromadb
import requests
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pathlib import Path

# =========================
# CONFIG
# =========================
OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:3b"
GOOGLE_CLIENT_ID = "226312071852-bpt8lnl56pkh0uf544bu3ufk604fms9r.apps.googleusercontent.com"

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise EnvironmentError("DATABASE_URL environment variable is missing!")

# Create a connection pool instead of a single connection
db_pool = pool.SimpleConnectionPool(1, 20, dsn=DB_URL, cursor_factory=RealDictCursor)

chroma_client = chromadb.PersistentClient(path="chroma_db")
collection = chroma_client.get_or_create_collection(name="cybersecurity")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# MODELS
# =========================
class PromptRequest(BaseModel):
    prompt: str
    user_id: str
    session_id: int = None

class SessionCreateRequest(BaseModel):
    user_id: str
    title: str | None = None

class GoogleToken(BaseModel):
    token: str

# =========================
# HELPERS
# =========================
def get_db_connection():
    """Dependency to get a DB connection from the pool."""
    conn = None
    try:
        conn = db_pool.getconn()
        yield conn
    finally:
        if conn:
            db_pool.putconn(conn)

def retrieve_context(query: str, n_results: int = 3) -> str:
    try:
        results = collection.query(query_texts=[query], n_results=n_results)
        if results and "documents" in results and results["documents"]:
            retrieved_docs = [doc for docs in results["documents"] for doc in docs]
            context = "\n\n".join(retrieved_docs)
            return context.strip()
    except Exception as e:
        print(f"❌ Error querying ChromaDB: {e}")
    return "No relevant context found."

def call_llm(prompt: str, history: list[dict] | None = None) -> str:
    """Gets a single, complete response from the LLM with translation."""
    english_prompt, source_lang = _translate(prompt, 'en')

    context = retrieve_context(english_prompt)
    system_prompt = (
        "You are a professional cybersecurity technician..."
        f"\n\n--- Relevant Context ---\n{context}"
    )
    messages = [
        {"role": "system", "content": system_prompt},
        *(history or []),
        {"role": "user", "content": english_prompt}
    ]
    payload = {"model": MODEL_NAME, "messages": messages, "stream": False}

    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        english_answer = data.get("message", {}).get("content", "No response from model.")

        final_answer, _ = _translate(english_answer, source_lang)
        return final_answer
    except Exception as e:
        print(f"Error calling local Ollama LLM: {e}")
        return "Sorry, I couldn't process your request."

def stream_llm_response(prompt: str, history: list[dict] | None = None):
    """A generator function that streams the response from the LLM with translation."""
    english_prompt, source_lang = _translate(prompt, 'en')

    context = retrieve_context(english_prompt)
    system_prompt = (
        "You are a professional cybersecurity technician..."
        f"\n\n--- Relevant Context ---\n{context}"
    )
    messages = [
        {"role": "system", "content": system_prompt},
        *(history or []),
        {"role": "user", "content": english_prompt}
    ]
    payload = {"model": MODEL_NAME, "messages": messages, "stream": True}

    try:
        response = requests.post(OLLAMA_API_URL, json=payload, stream=True)
        response.raise_for_status()

        english_answer = ""
        for chunk in response.iter_lines():
            if chunk:
                data = json.loads(chunk)
                english_answer_chunk = data.get("message", {}).get("content", "")
                english_answer += english_answer_chunk

        final_answer, _ = _translate(english_answer, source_lang)

        for word in final_answer.split():
            yield word + " "

    except Exception as e:
        print(f"Error during streaming: {e}")
        yield "Sorry, an error occurred during streaming."


# --- DOWNLOAD HELPERS ---
def _create_docx(messages):
    document = Document()
    document.add_heading('Chat History', 0)
    for msg in messages:
        p = document.add_paragraph()
        p.add_run(f'{msg["role"].capitalize()}: ').bold = True
        p.add_run(msg["content"])
    file_stream = io.BytesIO()
    document.save(file_stream)
    file_stream.seek(0)
    return file_stream

def _create_pdf(messages):
    try:
        pdf = FPDF()
        pdf.add_page()

        font_path = Path(__file__).parent / "fonts" / "DejaVuSans.ttf"
        pdf.add_font("DejaVu", "", str(font_path))
        pdf.set_font("DejaVu", size=12)

        pdf.cell(0, 10, txt="Chat History", ln=True, align='C')
        pdf.ln(5)

        for msg in messages:
            pdf.set_font("DejaVu", size=10)
            pdf.write(8, f'{msg["role"].capitalize()}: ')
            pdf.set_font("DejaVu", size=10)
            pdf.write(8, msg["content"])
            pdf.ln(12)

        return io.BytesIO(pdf.output())
    except Exception as e:
        print(f"🔴 FAILED TO CREATE PDF: {e}")
        raise e

def _create_csv(messages):
    file_stream = io.StringIO()
    writer = csv.writer(file_stream)
    writer.writerow(['role', 'content'])
    for msg in messages:
        writer.writerow([msg['role'], msg['content']])
    file_stream.seek(0)
    return io.BytesIO(file_stream.read().encode('utf-8'))

def _translate(text: str, dest_lang: str):
    """Translates text to a destination language and detects the source."""
    try:
        translator = Translator()
        detected_lang = translator.detect(text).lang
        if detected_lang == dest_lang:
            return text, detected_lang

        translated = translator.translate(text, dest=dest_lang)
        return translated.text, detected_lang
    except Exception as e:
        print(f"Error during translation: {e}")
        return text, 'en'

# =========================
# ROUTES
# =========================
@app.post("/auth/google")
def google_auth(google_token: GoogleToken, conn=Depends(get_db_connection)):
    try:
        id_info = id_token.verify_oauth2_token(
            google_token.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        user_email = id_info.get("email")
        user_name = id_info.get("name")
        if not user_email:
            raise HTTPException(status_code=400, detail="Email not found in Google token.")

        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, email FROM next_auth.users WHERE email = %s", (user_email,))
            user = cursor.fetchone()

            if user:
                print(f"Existing user logged in: {user_email}")
            else:
                print(f"Creating new user: {user_email}")
                cursor.execute(
                    "INSERT INTO next_auth.users (name, email) VALUES (%s, %s)",
                    (user_name, user_email)
                )
                conn.commit()

        return {"status": "success", "email": user_email}
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token.")
    except Exception as e:
        print(f"An unexpected error during Google auth: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred.")

@app.get("/")
async def root():
    return {"message": "FastAPI backend is running"}

@app.post("/chat/session")
def create_chat_session(user_id: str = Form(...), title: str = Form("New Chatt"), conn=Depends(get_db_connection)):
    with conn.cursor() as cursor:
        cursor.execute("INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id, created_at", (user_id, title))
        session = cursor.fetchone()
        conn.commit()
        return {"session_id": session["id"], "created_at": session["created_at"]}

@app.get("/chat/sessions/{user_id}")
def get_user_sessions(user_id: str, conn=Depends(get_db_connection)):
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, title, created_at FROM chat_sessions WHERE user_id=%s ORDER BY created_at DESC", (user_id,))
        sessions = cursor.fetchall()
        return [{"session_id": s["id"], "title": s["title"], "created_at": s["created_at"]} for s in sessions]

@app.get("/chat/messages/{session_id}")
def get_chat_messages(session_id: int, conn=Depends(get_db_connection)):
    with conn.cursor() as cursor:
        cursor.execute("SELECT role, content, created_at FROM chat_messages WHERE session_id=%s ORDER BY created_at ASC", (session_id,))
        messages = cursor.fetchall()
        return [{"role": m["role"], "content": m["content"], "created_at": m["created_at"]} for m in messages]

@app.post("/chat/message")
async def send_chat_message(
    prompt: str = Form(...),
    user_id: str = Form(...),
    guest: bool = Form(...),
    session_id: int | None = Form(None),
    file: UploadFile | None = File(None),
    conn=Depends(get_db_connection)
):
    if file:
        try:
            raw = await file.read()
            file_text = raw.decode("utf-8", errors="ignore")
            prompt += f"\n\n--- Attached file ({file.filename}) ---\n{file_text[:2500]}"
        except Exception as e:
            print("Error reading uploaded file:", e)

    answer = call_llm(prompt)
    if guest:
        return {"session_id": None, "response": answer}

    with conn.cursor() as cursor:
        if not session_id:
            title = (prompt[:30] + "...") if len(prompt) > 30 else prompt
            if not title.strip():
                title = file.filename[:30] + "..." if file else "New chat"
            cursor.execute("INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id", (user_id, title))
            session_id = cursor.fetchone()["id"]
        else:
            cursor.execute("SELECT id FROM chat_sessions WHERE id=%s", (session_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Session not found")

        cursor.execute("INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)", (session_id, "user", prompt))
        cursor.execute("INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)", (session_id, "bot", answer))
        conn.commit()

    return {"session_id": session_id, "response": answer}

@app.patch("/chat/session/{session_id}")
def update_session_title(session_id: int, title: str = Body(...), conn=Depends(get_db_connection)):
    with conn.cursor() as cursor:
        cursor.execute("UPDATE chat_sessions SET title=%s WHERE id=%s", (title, session_id))
        conn.commit()
        return {"session_id": session_id, "title": title}

@app.post("/chat/stream")
async def stream_chat_message(request: Request):
    body = await request.json()
    prompt = body.get("prompt")
    if not prompt:
        return {"error": "Prompt is required"}, 400
    return StreamingResponse(stream_llm_response(prompt), media_type="text/event-stream")

@app.get("/chat/download/{session_id}")
def download_chat_session(session_id: int, format: str, conn=Depends(get_db_connection)):
    messages = []
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT role, content FROM chat_messages WHERE session_id=%s ORDER BY created_at ASC",
            (session_id,)
        )
        messages = cursor.fetchall()

    if not messages:
        raise HTTPException(status_code=404, detail="Session not found or has no messages.")

    filename = f"chat_session_{session_id}.{format}"

    if format == "docx":
        file_stream = _create_docx(messages)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif format == "pdf":
        file_stream = _create_pdf(messages)
        media_type = "application/pdf"
    elif format == "csv":
        file_stream = _create_csv(messages)
        media_type = "text/csv"
    else:
        raise HTTPException(status_code=400, detail="Invalid format requested.")

    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return StreamingResponse(file_stream, media_type=media_type, headers=headers)
