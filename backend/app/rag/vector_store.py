import os
import logging
import faiss
import numpy as np

logger = logging.getLogger(__name__)

class VectorStore:
    """
    FAISS-based vector store for persistence and similarity search.
    """

    def __init__(self, index_path: str = "vector_store.index"):
        self.index_path = index_path
        self.index = None

    def create_index(self, embeddings):
        """
        Create a FAISS FlatL2 index from embeddings.
        """
        if len(embeddings) == 0:
            logger.warning("Empty embeddings list provided.")
            return

        dimension = len(embeddings[0])
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
        logger.info(f"Created FAISS index with {self.index.ntotal} vectors.")

    def save_index(self):
        """
        Persist the FAISS index to disk.
        """
        if self.index:
            faiss.write_index(self.index, self.index_path)
            logger.info(f"Saved FAISS index to {self.index_path}")

    def load_index(self):
        """
        Load the FAISS index from disk.
        """
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            logger.info(f"Loaded FAISS index from {self.index_path}")
            return True
        logger.warning(f"Index file not found: {self.index_path}")
        return False

    def search(self, query_embedding, k=3):
        """
        Search for top relevant chunks.
        Returns: distances, indices
        """
        if not self.index:
            logger.error("FAISS index not initialized. Call load_index or create_index first.")
            return [], []

        query_vector = np.array([query_embedding]).astype('float32')
        distances, indices = self.index.search(query_vector, k)
        return distances[0], indices[0]
