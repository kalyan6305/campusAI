import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class Embedder:
    """
    Wrapper for sentence-transformers to create document and query embeddings.
    Model: all-MiniLM-L6-v2
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        try:
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded sentence-transformer model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedder model: {e}")
            raise e

    def create_embeddings(self, text_chunks: list[str]):
        """
        Convert a list of text chunks into numerical vectors.
        """
        if not text_chunks:
            return []
        
        try:
            embeddings = self.model.encode(text_chunks)
            logger.info(f"Generated embeddings for {len(text_chunks)} chunks.")
            return embeddings
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return []
