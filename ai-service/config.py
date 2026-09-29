import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root or current folder
project_root = Path(__file__).resolve().parent.parent
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv(override=True)


class AppConfig:
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    DEBUG: bool = os.getenv("NODE_ENV", "development") == "development"

    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").lower()

    # Google Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    # Qdrant Vector DB
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION_NAME", "adaptive_domain_rag")

    # Models
    BGE_M3_MODEL_NAME: str = os.getenv("BGE_M3_MODEL_NAME", "BAAI/bge-m3")
    BGE_RERANKER_MODEL_NAME: str = os.getenv("BGE_RERANKER_MODEL_NAME", "BAAI/bge-reranker-v2-m3")
    EMBEDDING_DEVICE: str = os.getenv("EMBEDDING_DEVICE", "cpu")

    # Pipeline thresholds
    EVIDENCE_CONFIDENCE_THRESHOLD: float = float(os.getenv("EVIDENCE_CONFIDENCE_THRESHOLD", "0.45"))
    TOP_K_CANDIDATES: int = int(os.getenv("TOP_K_CANDIDATES", "10"))  # Reduced from 15 to 10 for faster retrieval

    TOP_K_RERANKED: int = int(os.getenv("TOP_K_RERANKED", "5"))  # Reduced from 7 to 5 for faster response

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

config = AppConfig()
