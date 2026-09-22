import logging
import time
from typing import Any

import requests

logger = logging.getLogger(__name__)

GROUNDED_SYSTEM_INSTRUCTION = """You are a strictly grounded AI assistant operating in an Adaptive Domain-Aware RAG system.
Your mission is to answer the user's question using ONLY the provided evidence passages.

CRITICAL CONSTRAINTS:
1. Answer strictly and exclusively from the facts stated in the provided evidence.
2. NEVER introduce outside facts, general knowledge, or pretrained assumptions.
3. If an aspect of the question is not directly addressed in the evidence, state clearly: "The provided documents do not mention this."
4. Every fact in your answer must cite its supporting source using the format: [Source: <filename>, Page: <page>, Section: <section>].
5. Maintain a professional, concise, and direct tone."""

class GeminiGenerator:
    """Client for generating grounded answers using Gemini 3.5 Flash."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model
        self._client: Any = None
        self._init_sdk()

    def _init_sdk(self):
        if not self.api_key:
            logger.warning("No GEMINI_API_KEY configured. Gemini generation will run in mock/grounded-echo mode.")
            return

        try:
            import importlib
            genai_mod = importlib.import_module("google.genai")
            client_cls = getattr(genai_mod, "Client", None)
            if client_cls:
                self._client = client_cls(api_key=self.api_key)
                logger.info("Initialized google-genai client for model %s.", self.model)
        except Exception:  # noqa: BLE001
            try:
                import importlib
                legacy_genai = importlib.import_module("google.generativeai")
                legacy_genai.configure(api_key=self.api_key)
                self._client = legacy_genai.GenerativeModel(self.model)
                logger.info("Initialized legacy google.generativeai client.")
            except Exception:  # noqa: BLE001
                logger.info("google-genai library not present. Will use direct Gemini REST API.")

    def generate(self, query: str, evidence_chunks: list[dict[str, Any]]) -> dict[str, Any]:
        """Generates a grounded response strictly from evidence chunks."""
        start_time = time.time()

        # Format evidence block
        evidence_texts = []
        for idx, c in enumerate(evidence_chunks):
            src = c.get("source_info", {})
            fname = src.get("filename", "Unknown Document")
            page = c.get("page")
            section = c.get("section")
            loc_parts = [f"File: {fname}"]
            if page:
                loc_parts.append(f"Page: {page}")
            if section:
                loc_parts.append(f"Section: {section}")
            header = " | ".join(loc_parts)
            evidence_texts.append(f"--- Evidence Pass {idx+1} [{header}] ---\n{c.get('text', '')}")

        formatted_context = "\n\n".join(evidence_texts)
        prompt = f"""EVIDENCE CONTEXT:
{formatted_context}

USER QUESTION:
{query}

GROUNDED ANSWER (with citations):"""

        # If no API key is provided, return grounded synthesis mock
        if not self.api_key or self.api_key.startswith("your_"):
            latency_ms = int((time.time() - start_time) * 1000)
            mock_answer = (
                f"Based on the retrieved evidence ({evidence_chunks[0].get('source_info', {}).get('filename', 'document')}):\n\n"
                f"{evidence_chunks[0].get('text', '')[:300]}...\n\n"
                f"[Source: {evidence_chunks[0].get('source_info', {}).get('filename', 'document')}]"
            )
            return {
                "answer": mock_answer,
                "latency_ms": latency_ms,
                "model_used": f"{self.model} (scaffold/offline mode)"
            }

        # Attempt SDK or REST generation
        client = self._client
        try:
            # 1. New google-genai SDK
            if client is not None and hasattr(client, 'models'):
                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config={"system_instruction": GROUNDED_SYSTEM_INSTRUCTION}
                )
                answer_text = response.text
            # 2. Legacy google.generativeai SDK
            elif client is not None and hasattr(client, 'generate_content'):
                response = client.generate_content(
                    f"{GROUNDED_SYSTEM_INSTRUCTION}\n\n{prompt}"
                )
                answer_text = response.text
            # 3. Direct Gemini REST endpoint
            else:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": f"{GROUNDED_SYSTEM_INSTRUCTION}\n\n{prompt}"}]
                    }]
                }
                res = requests.post(endpoint, json=payload, timeout=25.0)
                if res.status_code == 200:
                    data = res.json()
                    answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    raise RuntimeError(f"Gemini API returned status {res.status_code}: {res.text}")

            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "answer": answer_text,
                "latency_ms": latency_ms,
                "model_used": self.model
            }
        except Exception as e:  # noqa: BLE001
            logger.error(f"Error calling Gemini API: {e}")
            latency_ms = int((time.time() - start_time) * 1000)
            # Fail safe: don't hallucinate; return structured error
            return {
                "answer": f"Unable to synthesize final answer due to Gemini API communication issue: {e!s}",
                "latency_ms": latency_ms,
                "model_used": self.model,
                "error": str(e)
            }
