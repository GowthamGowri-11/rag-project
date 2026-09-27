import logging
import os
import sys
import types
from typing import Any

# Ensure vertexai compatibility shim for ragas in langchain_community
try:
    from langchain_google_vertexai import ChatVertexAI
    mod = types.ModuleType("langchain_community.chat_models.vertexai")
    mod.ChatVertexAI = ChatVertexAI
    sys.modules["langchain_community.chat_models.vertexai"] = mod
except Exception:
    pass

logger = logging.getLogger(__name__)


class RagasEvaluator:
    """Real evaluation interface using Ragas for measuring:
    - Faithfulness (grounding against context)
    - Answer Relevancy (semantic match to query)
    - Context Precision (reranker quality)
    - Context Recall (retrieval coverage)
    """

    def __init__(self, model_name: str = "gemini-3.5-flash-lite"):
        self.model_name = model_name
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self._llm = None
        self._embeddings = None
        self._init_ragas()

    def _init_ragas(self):
        try:
            from google import genai
            from ragas.llms import llm_factory
            from ragas.embeddings import LangchainEmbeddingsWrapper
            from langchain_core.embeddings import Embeddings

            client = genai.Client(api_key=self.api_key)
            self._llm = llm_factory(model=self.model_name, provider="google", client=client)

            from ingestion.bge_m3_embedder import BGEM3EmbeddingService
            bge_service = BGEM3EmbeddingService()

            class BGELangchainWrapper(Embeddings):
                def embed_documents(self, texts: list[str]) -> list[list[float]]:
                    return bge_service.embed_dense(texts)
                def embed_query(self, text: str) -> list[float]:
                    return bge_service.embed_dense([text])[0]

            self._embeddings = LangchainEmbeddingsWrapper(BGELangchainWrapper())
            logger.info("Real Ragas evaluation engine initialized with Gemini and BGE-M3.")
        except Exception as e:
            logger.error(f"Failed to initialize real Ragas engine: {e}")
            self._llm = None

    def evaluate_query(
        self,
        question: str,
        answer: str,
        contexts: list[str],
        ground_truth: str | None = None
    ) -> dict[str, Any]:
        """Runs real Ragas metrics on a single query-answer-context tuple."""
        if not self._llm:
            raise RuntimeError("Real Ragas evaluation engine is not initialized.")

        try:
            from datasets import Dataset
            from ragas import evaluate, RunConfig
            from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

            data = {
                "user_input": [question],
                "response": [answer],
                "retrieved_contexts": [contexts if contexts else ["No context available."]],
                "reference": [ground_truth if ground_truth else answer]
            }

            metrics = [faithfulness, answer_relevancy, context_precision, context_recall]
            dataset = Dataset.from_dict(data)

            res = evaluate(
                dataset,
                metrics=metrics,
                llm=self._llm,
                embeddings=self._embeddings,
                run_config=RunConfig(max_retries=3, max_wait=5)
            )
            return dict(res)
        except Exception as e:
            logger.error(f"Error during real Ragas evaluation: {e}")
            raise
