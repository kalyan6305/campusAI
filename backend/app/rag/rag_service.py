import os
import json
import logging
from app.rag.document_loader import load_documents
from app.rag.embedder import Embedder
from app.rag.vector_store import VectorStore

logger = logging.getLogger(__name__)

class RAGService:
    """
    Orchestrator for the RAG pipeline.
    Handles knowledge base building and querying.
    """

    def __init__(self, data_dir: str = "data/rag"):
        self.data_dir = data_dir
        self.index_path = os.path.join(data_dir, "vector_store.index")
        self.chunks_path = os.path.join(data_dir, "chunks.json")
        
        # Ensure data directory exists  
        os.makedirs(data_dir, exist_ok=True)
        
        self.embedder = Embedder()
        self.vector_store = VectorStore(self.index_path)
        self.chunks = []

    async def build_knowledge_base(self, folder_path: str):
        """
        Build the FAISS index and persist text chunks from documents in a folder.
        """
        logger.info(f"Building knowledge base from: {folder_path}")
        
        # 1. Load and chunk documents (now returns list of dicts)
        self.chunks = load_documents(folder_path)
        if not self.chunks:
            logger.warning("No document chunks extracted. Aborting build.")
            return False
        
        # 2. Generate embeddings (extract text from dicts)
        texts = [c["text"] for c in self.chunks]
        embeddings = self.embedder.create_embeddings(texts)
        if len(embeddings) == 0:
            logger.error("Failed to create embeddings. Aborting build.")
            return False
        
        # 3. Create FAISS index
        self.vector_store.create_index(embeddings)
        
        # 4. Save index and chunks
        self.vector_store.save_index()
        with open(self.chunks_path, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f)
            
        logger.info(f"Knowledge base built successfully with {len(self.chunks)} chunks.")
        return True

    async def query_knowledge(self, query: str, k: int = 3):
        """
        Retrieve relevant text chunks/metadata for a given query.
        """
        # 1. Load index and chunks if not already in memory
        if not self.vector_store.index:
            if not self.vector_store.load_index():
                return []
        
        if not self.chunks:
            if os.path.exists(self.chunks_path):
                with open(self.chunks_path, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
            else:
                logger.error("Chunks mapping file not found.")
                return []
        
        # 2. Embed query
        query_vector = self.embedder.create_embeddings([query])
        if len(query_vector) == 0:
            return []
        
        # 3. Search FAISS index
        distances, indices = self.vector_store.search(query_vector[0], k)
        
        # 4. Return relevant results
        results = []
        for idx in indices:
            if idx != -1 and idx < len(self.chunks):
                results.append(self.chunks[idx])
                
        return results

    async def query_knowledge_by_regulation(self, query: str, k: int = 5):
        """
        Retrieve chunks and group them by regulation.
        Returns: { "R23": [chunk1, ...], "R22": [...], ... }
        """
        chunks = await self.query_knowledge(query, k=k)
        
        grouped = {}
        for item in chunks:
            if isinstance(item, dict):
                reg = item.get("metadata", {}).get("regulation", "UNKNOWN")
                text = item.get("text", str(item))
            else:
                reg = "UNKNOWN"
                text = str(item)
                
            if reg not in grouped:
                grouped[reg] = []
            grouped[reg].append(text)
            
        return grouped

    async def get_all_documents(self, folder_path: str = "data/documents"):
        """
        List all source filenames in the documents folder.
        """
        if not os.path.exists(folder_path):
            return []
        
        files = [f for f in os.listdir(folder_path) if f.endswith('.pdf')]
        return [{"filename": f} for f in files]

    async def search_document_chunks(self, query: str, k: int = 5):
        """
        Search for relevant chunks and return them with document metadata.
        """
        results = await self.query_knowledge(query, k)
        return results

async def build_knowledge_base(folder_path: str):
    """Wrapper for external calls."""
    service = RAGService()
    return await service.build_knowledge_base(folder_path)

async def query_knowledge(query: str, k: int = 3):
    """Wrapper for external calls."""
    service = RAGService()
    return await service.query_knowledge(query, k)

async def query_knowledge_by_regulation(query: str, k: int = 5):
    """Wrapper for external calls."""
    service = RAGService()
    return await service.query_knowledge_by_regulation(query, k)

async def get_all_documents(folder_path: str = "data/documents"):
    """Wrapper for external calls."""
    service = RAGService()
    return await service.get_all_documents(folder_path)
