
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import chromadb
import requests
from fastapi import Body
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Optional

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
# def retrieve_context(query: str, n_results: int = 3) -> str:
#     try:
#         results = collection.query(query_texts=[query], n_results=n_results)
#         if results["documents"] and len(results["documents"][0]) > 0:
#             return " ".join(results["documents"][0])
#     except Exception as e:
#         print("Error querying ChromaDB:", e)
#     return ""

def retrieve_context(query: str, n_results: int = 3) -> str:
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if results and "documents" in results and results["documents"]:
            # Flatten and combine all retrieved documents
            retrieved_docs = [doc for docs in results["documents"] for doc in docs]
            context = "\n\n".join(retrieved_docs)
            return context.strip()
        
    except Exception as e:
        print(f"❌ Error querying ChromaDB: {e}")
    
    return "No relevant context found."
    
def call_llm(prompt: str) -> str:
    context = retrieve_context(prompt)
    system_prompt = (
        "You are a professional cybersecurity technician from the Securum team, "
        "a friendly but highly knowledgeable assistant. "
        "if link are put in questions, check its structure to detect whether it is phishing link or not"
        "when passwords are put in questions and request for checkign password health, determine its health to define strong or weak by facts"
        "Answer cybersecurity questions with, step-by-step explanations, examples, and best practices. "
        "Your responses should not be short, specific, and technical. "
        "If the question is unrelated to cybersecurity, politely refuse because u are ONLY Allowed to respond to cybersecurity related prompt!"
        f"{context}"
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


@app.post("/chat/session")
def create_chat_session(user_id: str = Form(...), title: str = Form("New Chatt")):
    cursor.execute(
        "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id, created_at",
        (user_id, title)
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
    guest: bool = Form(...),
    session_id: int | None = Form(None),
    file: UploadFile | None = File(None)
):
    # 1. Append file content if provided
    if file:
        try:
            raw = await file.read()
            file_text = raw.decode("utf-8", errors="ignore")
            # Limit content to first 2500 characters
            prompt += f"\n\n--- Attached file ({file.filename}) ---\n{file_text[:2500]}"
        except Exception as e:
            print("Error reading uploaded file:", e)

    # 2. Call LLM
    answer = call_llm(prompt)

    # 3. For guest users, skip DB
    if guest:
        return {"session_id": None, "response": answer}

    # 4. Handle session creation or validation
    if not session_id:
        title = (prompt[:30] + "...") if len(prompt) > 30 else prompt
        if not title.strip():
            title = file.filename[:30] + "..." if file else "New chat"
        cursor.execute(
            "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id",
            (user_id, title)
        )
        session_id = cursor.fetchone()["id"]
        conn.commit()
    else:
        cursor.execute("SELECT id FROM chat_sessions WHERE id=%s", (session_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")

    # 5. Save messages to DB
    cursor.execute(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
        (session_id, "user", prompt)
    )
    cursor.execute(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
        (session_id, "bot", answer)
    )
    conn.commit()

    return {"session_id": session_id, "response": answer}


@app.patch("/chat/session/{session_id}")
def update_session_title(session_id: int, title: str = Body(...)):
    cursor.execute(
        "UPDATE chat_sessions SET title=%s WHERE id=%s",
        (title, session_id)
    )
    conn.commit()
    return {"session_id": session_id, "title": title}
