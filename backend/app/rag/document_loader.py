import os
import logging
from pypdf import PdfReader

logger = logging.getLogger(__name__)

def detect_regulation(filename: str) -> str:
    """
    Helper to extract regulation from filename.
    """
    fn = filename.lower()
    if "r23" in fn:
        return "R23"
    elif "r22" in fn or "phy syl (2)" in fn:
        return "R22"
    elif "r21" in fn:
        return "R21"
    else:
        return "UNKNOWN"

def load_documents(folder_path: str) -> list[dict]:
    """
    Load PDF documents from a specified folder, extract text, and split into chunks.
    Returns: list of {"text": chunk_text, "metadata": {"source_file": filename, "regulation": regulation}}
    """
    all_chunks = []
    
    if not os.path.exists(folder_path):
        logger.error(f"Folder path does not exist: {folder_path}")
        return []

    for filename in os.listdir(folder_path):
        if filename.endswith(".pdf"):
            file_path = os.path.join(folder_path, filename)
            regulation = detect_regulation(filename)
            try:
                reader = PdfReader(file_path)
                text = ""
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                # Simple chunking by word count
                words = text.split()
                chunk_size = 600  # Targeted range 500-800
                
                for i in range(0, len(words), chunk_size):
                    chunk_text = " ".join(words[i : i + chunk_size])
                    if chunk_text.strip():
                        all_chunks.append({
                            "text": chunk_text,
                            "metadata": {
                                "source_file": filename,
                                "regulation": regulation
                            }
                        })
                
                logger.info(f"Loaded and chunked {filename} ({regulation}): {len(all_chunks)} total chunks so far.")
            except Exception as e:
                logger.error(f"Failed to load {filename}: {e}")
                
    return all_chunks
