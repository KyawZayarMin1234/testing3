# from fastapi import FastAPI
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware
# import chromadb
# from chromadb.utils import embedding_functions
# import requests
# import json

# # =========================
# # ChromaDB setup
# # =========================
# try:
#     chroma_client = chromadb.PersistentClient(path="chroma_db")
#     collection = chroma_client.get_or_create_collection(name="cybersecurity")
# except Exception as e:
#     raise RuntimeError(f"Failed to initialize ChromaDB: {e}")

# # =========================
# # FastAPI app init
# # =========================
# app = FastAPI()

# # Enable CORS for your Next.js frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Replace "*" with your frontend URL in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # =========================
# # HELPERS
# # =========================
# OLLAMA_API_URL = "http://localhost:11434/api/chat"
# MODEL_NAME = "llama3.2:3b"  # local model you already ran

# def retrieve_context(query: str, n_results: int = 3) -> str:
#     try:
#         results = collection.query(query_texts=[query], n_results=n_results)
#         if results["documents"] and len(results["documents"][0]) > 0:
#             return " ".join(results["documents"][0])
#     except Exception as e:
#         print("Error querying ChromaDB:", e)
#     return ""

# def call_llm(prompt: str) -> str:
#     context = retrieve_context(prompt)
#     system_prompt = (
#         "You are a cybersecurity technician from the Securum team, a friendly but knowledgeable assistant. "
#         "You only answer cybersecurity-related questions. If a question is unrelated to cybersecurity, politely refuse. "
#         f"Relevant knowledge: {context}"
#     )
#     payload = {
#         "model": MODEL_NAME,
#         "messages": [
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": prompt}
#         ],
#         "stream": False
#     }
#     try:
#         response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
#         response.raise_for_status()
#         data = response.json()
#         return data.get("message", {}).get("content", "No response from model.")
#     except Exception as e:
#         print("Error calling local Ollama LLM:", e)
#         return "Sorry, I couldn't process your request."

# # =========================
# # API MODEL
# # =========================
# class PromptRequest(BaseModel):
#     prompt: str

# # =========================
# # ROUTES
# # =========================
# @app.get("/")
# async def root():
#     return {"message": "FastAPI backend is running"}

# @app.post("/generate")
# async def generate_response(request: PromptRequest):
#     answer = call_llm(request.prompt)
#     return {"response": answer}

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import chromadb
import requests
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# =========================
# CONFIG
# =========================
OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:3b"

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise EnvironmentError("DATABASE_URL environment variable is missing!")

conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
cursor = conn.cursor()

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
    session_id: int = None  # optional for new chat

class SessionCreateRequest(BaseModel):
    user_id: str
    title: str | None = None

# =========================
# HELPERS
# =========================
def retrieve_context(query: str, n_results: int = 3) -> str:
    try:
        results = collection.query(query_texts=[query], n_results=n_results)
        if results["documents"] and len(results["documents"][0]) > 0:
            return " ".join(results["documents"][0])
    except Exception as e:
        print("Error querying ChromaDB:", e)
    return ""

def call_llm(prompt: str) -> str:
    context = retrieve_context(prompt)
    system_prompt = (
        "You are a cybersecurity technician from the Securum team, a friendly but knowledgeable assistant. "
        "You only answer cybersecurity-related questions. If a question is unrelated to cybersecurity, politely refuse. "
        f"Relevant knowledge: {context}"
    )
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }
    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "No response from model.")
    except Exception as e:
        print("Error calling local Ollama LLM:", e)
        return "Sorry, I couldn't process your request."

# =========================
# ROUTES
# =========================
@app.get("/")
async def root():
    return {"message": "FastAPI backend is running"}

# --- Chat Sessions ---
@app.post("/chat/session")
def create_chat_session(request: SessionCreateRequest):
    cursor.execute(
        "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id, created_at",
        (request.user_id, request.title)
    )
    session = cursor.fetchone()
    conn.commit()
    return {"session_id": session["id"], "created_at": session["created_at"]}

@app.get("/chat/sessions/{user_id}")
def get_user_sessions(user_id: str):
    cursor.execute(
        "SELECT id, title, created_at FROM chat_sessions WHERE user_id=%s ORDER BY created_at DESC",
        (user_id,)
    )
    sessions = cursor.fetchall()
    return [{"session_id": s["id"], "title": s["title"], "created_at": s["created_at"]} for s in sessions]

# --- Chat Messages ---
@app.get("/chat/messages/{session_id}")
def get_chat_messages(session_id: int):
    cursor.execute(
        "SELECT role, content, created_at FROM chat_messages WHERE session_id=%s ORDER BY created_at ASC",
        (session_id,)
    )
    messages = cursor.fetchall()
    return [{"role": m["role"], "content": m["content"], "created_at": m["created_at"]} for m in messages]

@app.post("/chat/message")
async def send_chat_message(
    prompt: str = Form(...),
    user_id: str = Form(...),
    session_id: int | None = Form(None),
    file: UploadFile | None = File(None)
):
    # Handle session
    if not session_id:
        title = prompt[:100] if prompt else (file.filename if file else "New session")
        cursor.execute(
            "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id",
            (user_id, title)
        )
        session = cursor.fetchone()
        session_id = session["id"]
        conn.commit()

    # If file was uploaded, read its content
    file_text = ""
    if file:
        try:
            raw = await file.read()
            file_text = raw.decode("utf-8", errors="ignore")  # assume log file is text
            prompt = f"{prompt}\n\n--- Attached file ({file.filename}) ---\n{file_text[:2500]}"
            # we only append first 2000 chars to avoid overloading
        except Exception as e:
            print("Error reading file:", e)

    # Call LLM
    answer = call_llm(prompt)

    # Save user message
    cursor.execute(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
        (session_id, "user", prompt)
    )
    # Save bot response
    cursor.execute(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
        (session_id, "bot", answer)
    )
    conn.commit()

    return {"session_id": session_id, "response": answer}

# @app.post("/chat/message")
# def send_chat_message(request: PromptRequest):
#     if not request.session_id:
#         title = request.prompt[:100] 
#         cursor.execute(
#             "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id",
#             (request.user_id, title)
#         )
#         session = cursor.fetchone()
#         session_id = session["id"]
#         conn.commit()
#     else:
#         session_id = request.session_id

#     # Call LLM
#     answer = call_llm(request.prompt)

#     # Save user message
#     cursor.execute(
#         "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
#         (session_id, "user", request.prompt)
#     )
#     # Save bot response
#     cursor.execute(
#         "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
#         (session_id, "bot", answer)
#     )
#     conn.commit()

#     return {"session_id": session_id, "response": answer}


