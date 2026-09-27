import logging
import time
from typing import Any

import requests

logger = logging.getLogger(__name__)

GROUNDED_SYSTEM_INSTRUCTION = """You are a helpful, intelligent AI assistant operating in an Adaptive Domain-Aware RAG system.
Your mission is to answer the user's question clearly, naturally, and accurately using the provided evidence.

GUIDELINES:
1. Answer directly and conversationally, like ChatGPT. Do NOT start with robotic phrases like "Based on the provided evidence" or "According to the documents".
2. Present information smoothly with clean paragraphs and bullet points where helpful.
3. Ground your factual claims in the provided context, but do NOT inject robotic inline brackets like [Source: ...].
4. If the provided context does not contain sufficient facts to answer the question, state politely that the indexed documents do not have enough information to answer."""



class GeminiGenerator:
    """Client for generating grounded answers strictly using Google Gemini API."""

    def __init__(self, api_key: str, model: str = "gemini-3.5-flash", provider: str = "gemini"):
        self.api_key = (api_key or "").strip()
        self.model = model
        self.provider = (provider or "gemini").strip().lower()
        self._client: Any = None
        self.call_count: int = 0
        self.recorded_calls: list[dict[str, Any]] = []
        self._init_sdk()

    def reset_call_count(self) -> None:
        """Resets the Gemini invocation counter for test assertions."""
        self.call_count = 0
        self.recorded_calls.clear()

    def _init_sdk(self):
        if self.provider != "gemini":
            logger.info("LLM provider configured as '%s'.", self.provider)
            return

        if not self.api_key:
            logger.warning("No GEMINI_API_KEY configured.")
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
                logger.info("Initialized legacy google.generativeai client for model %s.", self.model)
            except Exception:  # noqa: BLE001
                logger.info("Google GenAI SDK not installed. Will use direct Google Gemini REST API.")

    def generate(self, query: str, evidence_chunks: list[dict[str, Any]]) -> dict[str, Any]:
        """Generates a grounded response strictly from evidence chunks using Google Gemini API."""
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

        # Enforce explicit provider
        if self.provider != "gemini":
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "answer": f"Unsupported LLM provider '{self.provider}'. Configured provider must be 'gemini'.",
                "latency_ms": latency_ms,
                "provider": self.provider,
                "model_used": self.model,
                "endpoint_used": "none",
                "fallback_occurred": False,
                "error": f"Invalid provider: {self.provider}"
            }

        # Check API key presence
        if not self.api_key or self.api_key.startswith("your_"):
            latency_ms = int((time.time() - start_time) * 1000)
            error_msg = "Google Gemini API key is missing or unconfigured. Please set a valid GEMINI_API_KEY in .env."
            logger.error(error_msg)
            return {
                "answer": f"Generation failed: {error_msg}",
                "latency_ms": latency_ms,
                "provider": "google-gemini",
                "model_used": self.model,
                "endpoint_used": f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
                "fallback_occurred": False,
                "error": error_msg
            }

        # Call Google Gemini API directly with exact target model
        return self._generate_google_gemini(query, prompt, start_time)

    def _generate_google_gemini(self, query: str, prompt: str, start_time: float) -> dict[str, Any]:
        """Generates grounded answer using Google Gemini native API / SDK with fallback models for quota resilience."""
        self.call_count += 1
        self.recorded_calls.append({
            "timestamp": time.time(),
            "query": query,
            "model": self.model
        })

        # Candidate models to try in sequence if primary model encounters 429 (quota exhausted) or 404
        candidate_models = [self.model]
        for fallback in ["gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_error = None
        for candidate in candidate_models:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={self.api_key}"
            endpoint_display = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent"

            client = self._client
            try:
                # 1. New google-genai SDK (only if using configured primary model)
                if candidate == self.model and client is not None and hasattr(client, 'models'):
                    response = client.models.generate_content(
                        model=candidate,
                        contents=prompt,
                        config={"system_instruction": GROUNDED_SYSTEM_INSTRUCTION}
                    )
                    answer_text = response.text
                # 2. Legacy google.generativeai SDK (only if using configured primary model)
                elif candidate == self.model and client is not None and hasattr(client, 'generate_content'):
                    response = client.generate_content(
                        f"{GROUNDED_SYSTEM_INSTRUCTION}\n\n{prompt}"
                    )
                    answer_text = response.text
                # 3. Direct Gemini REST endpoint (robust across all candidate models)
                else:
                    payload = {
                        "contents": [{
                            "role": "user",
                            "parts": [{"text": f"{GROUNDED_SYSTEM_INSTRUCTION}\n\n{prompt}"}]
                        }],
                        "generationConfig": {
                            "temperature": 0.1
                        }
                    }
                    res = requests.post(endpoint, json=payload, timeout=60.0)
                    if res.status_code == 200:
                        data = res.json()
                        answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    else:
                        error_detail = res.text
                        try:
                            err_json = res.json()
                            error_detail = err_json.get("error", {}).get("message", res.text)
                        except Exception:
                            pass
                        raise RuntimeError(f"Google Gemini API error ({res.status_code}): {error_detail}")

                latency_ms = int((time.time() - start_time) * 1000)
                return {
                    "answer": answer_text,
                    "latency_ms": latency_ms,
                    "provider": "google-gemini",
                    "model_used": candidate,
                    "endpoint_used": endpoint_display,
                    "fallback_occurred": (candidate != self.model)
                }

            except Exception as e:
                err_str = str(e).lower()
                last_error = e
                # Fallback on rate limits, quota, deprecated models, timeouts, or network spikes
                is_recoverable = any(k in err_str for k in [
                    "429", "resource_exhausted", "404", "503", "504", "timeout", "timed out", "connection"
                ])
                if is_recoverable:
                    logger.warning(f"Model {candidate} encountered issue ({e}). Trying next fallback candidate...")
                    continue
                else:
                    break

        logger.error("All Gemini candidate models failed: %s", last_error)
        latency_ms = int((time.time() - start_time) * 1000)
        return {
            "answer": "I'm sorry, I encountered a temporary connection delay reaching the language model. Please try asking again in a moment.",
            "latency_ms": latency_ms,
            "provider": "google-gemini",
            "model_used": self.model,
            "endpoint_used": f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
            "fallback_occurred": False,
            "error": str(last_error)
        }


