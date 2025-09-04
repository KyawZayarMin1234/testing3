# import chromadb

# # Path to your manually created file
# filename = "knowledge_base.txt"

# with open(filename, "r") as f:
#     text_data = f.read()

# # Connect to ChromaDB
# client = chromadb.PersistentClient(path="chroma_db")
# collection = client.get_or_create_collection(name="cybersecurity")

# collection.add(
#     documents=[text_data],
#     ids=["doc_001"]  # You can update this ID if you want to overwrite
# )

# print(f"✅ Added {filename} to ChromaDB!")


import chromadb
from chromadb.utils import embedding_functions

# --- Load knowledge base ---
with open("knowledge_base.txt", "r", encoding="utf-8") as f:
    text = f.read()

# --- Chunking ---
def chunk_text(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

chunks = chunk_text(text)

# --- Initialize ChromaDB ---
client = chromadb.PersistentClient(path="chroma_db")

embedding_func = embedding_functions.DefaultEmbeddingFunction()
collection = client.get_or_create_collection(
    name="cybersecurity",
    embedding_function=embedding_func
)

try:
    client.delete_collection("cybersecurity")
    print("✅ Old collection deleted.")
except Exception as e:
    print("ℹ️ No old collection to delete:", e)

# Recreate it
collection = client.get_or_create_collection(
    name="cybersecurity",
    embedding_function=embedding_func
)

# --- Insert chunks ---
for i, chunk in enumerate(chunks):
    collection.add(
        ids=[f"doc_{i}"],
        documents=[chunk],
        metadatas=[{"source": "knowledge_base.txt", "chunk": i}]
    )

print(f"Inserted {len(chunks)} chunks into ChromaDB.")
print("Sample chunk:", chunks[0][:200], "...")
