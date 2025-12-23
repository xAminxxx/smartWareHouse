import os
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict
import glob

class WarehouseRAGEngine:
    def __init__(self, db_path: str = "./warehouse_db"):
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Use a local embedding model (free, fast, no API key needed)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.collection = self.client.get_or_create_collection(
            name="warehouse_knowledge",
            embedding_function=self.embedding_fn
        )

    def load_documents(self, data_dir: str):
        """Loads markdown files from data_dir"""
        files = glob.glob(os.path.join(data_dir, "**/*.md"), recursive=True)
        
        for file_path in files:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Simple chunking by paragraph/section
            chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
            
            # Prepare metadata and IDs
            category = os.path.basename(os.path.dirname(file_path))
            filename = os.path.basename(file_path)
            
            ids = [f"{filename}_{i}" for i in range(len(chunks))]
            metadatas = [{"category": category, "source": filename} for _ in chunks]
            
            # Add to collection
            self.collection.add(
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )
            print(f"✅ Loaded {len(chunks)} chunks from {filename} ({category})")

    def query(self, query_text: str, n_results: int = 3) -> List[str]:
        """Retrieves the most relevant chunks for a given query."""
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        # Flatten the list of lists returned by Chroma
        return results["documents"][0] if results["documents"] else []

if __name__ == "__main__":
    # Quick test / Seed RAG
    engine = WarehouseRAGEngine()
    
    data_path = os.path.join(os.getcwd(), "data")
    
    # Reload documents
    if engine.collection.count() > 0:
        print("🧹 Refreshing knowledge base...")
        engine.client.delete_collection("warehouse_knowledge")
        engine.collection = engine.client.create_collection(
            name="warehouse_knowledge",
            embedding_function=engine.embedding_fn
        )
    
    engine.load_documents(data_path)
    print("🚀 Warehouse RAG Knowledge Base ready!")
