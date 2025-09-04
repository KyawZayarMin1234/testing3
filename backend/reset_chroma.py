import chromadb

# Connect to ChromaDB
client = chromadb.PersistentClient(path="chroma_db")

# Delete the collection completely
client.delete_collection(name="cybersecurity")

print("✅ Collection 'cybersecurity' deleted. You can now ingest new data.")
