import logging
import time

from config import config
from evaluation.ragas_eval import RagasEvaluator
from flask import Flask, jsonify, request
from flask_cors import CORS
from generation.context_optimizer.optimizer import ContextOptimizer
from generation.evidence_checker.checker import EvidenceChecker
from generation.gemini.generator import GeminiGenerator
from ingestion.chunking.selector import AdaptiveChunkingSelector
from ingestion.document_analyzer.analyzer import DocumentAnalyzer
from ingestion.embeddings.bge_m3 import BGEM3EmbeddingService
from ingestion.loaders import load_document
from retrieval.dense.retriever import DenseRetriever
from retrieval.domain_router.router import DomainRouter
from retrieval.hybrid.retriever import HybridRetriever
from retrieval.query_analyzer.analyzer import LightweightQueryAnalyzer
from retrieval.reranker.bge_reranker import BGERerankerService
from retrieval.retrieval_router.router import RetrievalRouter
from retrieval.sparse.retriever import SparseRetriever
from vector_store.qdrant.client import QdrantKnowledgeStore

# Setup Logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("adaptive-rag-ai-service")

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Singletons / Core Services Initialization
logger.info("Initializing Adaptive Domain-Aware RAG Services...")
vector_store = QdrantKnowledgeStore(
    url=config.QDRANT_URL,
    api_key=config.QDRANT_API_KEY,
    collection_name=config.QDRANT_COLLECTION
)
embedding_service = BGEM3EmbeddingService(
    model_name=config.BGE_M3_MODEL_NAME,
    device=config.EMBEDDING_DEVICE
)
reranker_service = BGERerankerService(
    model_name=config.BGE_RERANKER_MODEL_NAME,
    device=config.EMBEDDING_DEVICE
)
gemini_generator = GeminiGenerator(
    api_key=config.GEMINI_API_KEY,
    model=config.GEMINI_MODEL
)
doc_analyzer = DocumentAnalyzer()
chunking_selector = AdaptiveChunkingSelector()
query_analyzer = LightweightQueryAnalyzer()
domain_router = DomainRouter()
retrieval_router = RetrievalRouter()
dense_retriever = DenseRetriever(vector_store, embedding_service)
sparse_retriever = SparseRetriever(vector_store)
hybrid_retriever = HybridRetriever(vector_store, embedding_service)
context_optimizer = ContextOptimizer(min_score_threshold=0.25)
evidence_checker = EvidenceChecker(threshold=config.EVIDENCE_CONFIDENCE_THRESHOLD)
evaluator = RagasEvaluator()

# In-memory dynamic domain registry (syncs with Qdrant payloads)
dynamic_domains_registry = {"rag": "RAG Fundamentals & Techniques"}

# In-memory document metadata tracker
document_registry = {}

@app.route("/health", methods=["GET"])
def health_check():
    qdrant_status = vector_store.get_status()
    return jsonify({
        "status": "HEALTHY",
        "service": "adaptive-rag-python-ai-service",
        "qdrant": qdrant_status,
        "gemini_model": config.GEMINI_MODEL,
        "timestamp": time.time()
    }), 200

@app.route("/api/domains", methods=["GET"])
def get_domains():
    qdrant_domains = vector_store.list_domains()
    q_dict = {d["name"].lower(): d["chunk_count"] for d in qdrant_domains}

    combined = []
    for d_key, desc in dynamic_domains_registry.items():
        count = q_dict.get(d_key, 0)
        # Also sum doc counts
        doc_count = sum(1 for doc in document_registry.values() if doc.get("domain", "").lower() == d_key)
        combined.append({
            "id": d_key,
            "name": d_key.upper() if len(d_key) <= 4 else d_key.capitalize(),
            "description": desc,
            "chunk_count": count,
            "document_count": doc_count
        })
    return jsonify(combined), 200

@app.route("/api/domains", methods=["POST"])
def create_domain():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    if not name:
        return jsonify({"error": "Domain name is required"}), 400

    clean_id = name.lower().replace(" ", "_")
    dynamic_domains_registry[clean_id] = description or f"Domain for {name}"
    logger.info(f"Registered new dynamic domain: '{clean_id}'")
    return jsonify({
        "id": clean_id,
        "name": name,
        "description": dynamic_domains_registry[clean_id],
        "created": True
    }), 201

@app.route("/api/documents", methods=["GET"])
def list_documents():
    return jsonify(list(document_registry.values())), 200

@app.route("/api/documents/<doc_id>", methods=["GET"])
def get_document(doc_id):
    if doc_id in document_registry:
        return jsonify(document_registry[doc_id]), 200
    return jsonify({"error": "Document not found"}), 404

@app.route("/api/documents/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    success = vector_store.delete_document(doc_id)
    document_registry.pop(doc_id, None)
    logger.info(f"Deleted document {doc_id} and its Qdrant chunks.")
    return jsonify({"success": success, "document_id": doc_id}), 200

@app.route("/api/ingest", methods=["POST"])
def ingest_document():
    """Ingests a document through the adaptive document pipeline."""
    start_time = time.time()
    domain = request.form.get("domain", "rag").strip().lower()

    # Auto-register domain if newly encountered
    if domain not in dynamic_domains_registry:
        dynamic_domains_registry[domain] = f"Dynamic Domain: {domain.capitalize()}"

    # Handle file upload, form data, or raw JSON content
    file_obj = request.files.get("file")
    if file_obj and file_obj.filename:
        filename = file_obj.filename
        file_bytes = file_obj.read()
    elif request.form.get("content"):
        filename = str(request.form.get("filename") or "unnamed_document.txt")
        form_content = request.form.get("content") or ""
        file_bytes = form_content.encode('utf-8')
    else:
        json_data = request.get_json(silent=True) or {}
        filename = str(json_data.get("filename") or "unnamed_document.txt")
        raw_content = json_data.get("content", "")
        file_bytes = raw_content.encode('utf-8') if isinstance(raw_content, str) else b""
        if not file_bytes:
            return jsonify({"error": "No file or content provided for ingestion"}), 400

    logger.info(f"Ingesting document '{filename}' into domain '{domain}'...")

    # Stage 1: Load and parse document into normalized DocumentRepresentation
    t_load_start = time.time()
    doc = load_document(file_bytes, filename, domain)
    t_load_ms = int((time.time() - t_load_start) * 1000)

    # Stage 2: Document Analyzer
    t_ana_start = time.time()
    profile = doc_analyzer.analyze(doc)
    t_ana_ms = int((time.time() - t_ana_start) * 1000)

    # Stage 3: Adaptive Chunking Selector
    t_chunk_start = time.time()
    strategy_name, chunks, _chunk_meta = chunking_selector.chunk_document(doc, profile)
    t_chunk_ms = int((time.time() - t_chunk_start) * 1000)

    if not chunks:
        return jsonify({"error": "Failed to extract chunks from document"}), 422

    # Stage 4: Generate BGE-M3 Embeddings
    t_embed_start = time.time()
    chunk_texts = [c.text for c in chunks]
    dense_vecs = embedding_service.embed_dense(chunk_texts)
    sparse_vecs = embedding_service.embed_sparse(chunk_texts)
    t_embed_ms = int((time.time() - t_embed_start) * 1000)

    # Stage 5: Store in Qdrant with Domain Metadata
    t_store_start = time.time()
    vector_store.upsert_chunks(chunks, dense_vecs, sparse_vecs)
    t_store_ms = int((time.time() - t_store_start) * 1000)

    total_latency_ms = int((time.time() - start_time) * 1000)

    # Track in registry
    doc_info = {
        "document_id": doc.document_id,
        "filename": filename,
        "domain": domain,
        "document_type": doc.document_type,
        "chunking_strategy": strategy_name,
        "chunk_count": len(chunks),
        "file_size_bytes": len(file_bytes),
        "uploaded_at": doc.metadata.get("uploaded_at"),
        "profile": profile.to_dict(),
        "telemetry": {
            "load_time_ms": t_load_ms,
            "analyzer_time_ms": t_ana_ms,
            "chunking_time_ms": t_chunk_ms,
            "embedding_time_ms": t_embed_ms,
            "storage_time_ms": t_store_ms,
            "total_latency_ms": total_latency_ms
        }
    }
    document_registry[doc.document_id] = doc_info

    logger.info(
        f"Document '{filename}' ingested successfully. "
        f"Strategy: {strategy_name}, Chunks: {len(chunks)}, Total time: {total_latency_ms}ms"
    )

    return jsonify(doc_info), 201

@app.route("/api/query", methods=["POST"])
def execute_query():
    """Executes the full adaptive domain-aware query pipeline with strict anti-hallucination gating."""
    total_start = time.time()
    data = request.get_json() or {}
    query_str = data.get("query", "").strip()
    domain_override = data.get("domain_override")
    strategy_override = data.get("retrieval_strategy_override")

    if not query_str:
        return jsonify({"error": "Query cannot be empty"}), 400

    logger.info(f"Processing query: '{query_str}' (domain_override={domain_override})")

    # Step 1: Lightweight Query Analyzer
    t_qana_start = time.time()
    available_domains = list(dynamic_domains_registry.keys())
    analysis = query_analyzer.analyze(query_str, known_domains=available_domains)
    logger.debug("Query analyzed in %d ms: %s", int((time.time() - t_qana_start) * 1000), analysis.intent)

    # Step 2: Domain Router & Domain Boundary Isolation
    target_domain, is_domain_valid, domain_reason = domain_router.route(
        analysis=analysis,
        available_domains=available_domains,
        domain_override=domain_override
    )

    # Check if target domain is completely invalid / un-indexed
    if not is_domain_valid:
        total_latency = int((time.time() - total_start) * 1000)
        logger.warning(f"Domain rejection: {domain_reason}. Gemini will NOT be called.")
        return jsonify({
            "query": query_str,
            "status": "NO_EVIDENCE",
            "domain": domain_override or analysis.detected_domain_hint,
            "retrieval_strategy": "none",
            "answer": "I don't have sufficient information about this topic in the available knowledge base.",
            "sources": [],
            "telemetry": {
                "retrieval_strategy": "none",
                "domain_detected": target_domain,
                "retrieval_latency_ms": 0,
                "candidate_count": 0,
                "reranking_latency_ms": 0,
                "evidence_score": 0.0,
                "evidence_status": "FAIL",
                "llm_latency_ms": 0,
                "total_query_latency_ms": total_latency
            },
            "refusal_reason": domain_reason
        }), 200

    # Step 3: Retrieval Router (Selects Dense, Sparse, or Hybrid)
    selected_strategy, _strat_reason = retrieval_router.select_strategy(analysis, override=strategy_override)

    # Step 4: First-Stage Retrieval (Top 20-50 candidates)
    t_ret_start = time.time()
    candidates = []
    limit = config.TOP_K_CANDIDATES

    if selected_strategy == "sparse":
        kw = analysis.exact_identifiers or analysis.keywords
        candidates = sparse_retriever.retrieve(kw, domain=target_domain, limit=limit)
    elif selected_strategy == "hybrid":
        kw = analysis.keywords or [query_str]
        candidates = hybrid_retriever.retrieve(query_str, keywords=kw, domain=target_domain, limit=limit)
    else: # dense
        candidates = dense_retriever.retrieve(query_str, domain=target_domain, limit=limit)

    t_ret_ms = int((time.time() - t_ret_start) * 1000)

    # Step 5: Transformer Reranking (BGE Reranker v2-M3) -> Top 5-10
    t_rerank_start = time.time()
    reranked_chunks = reranker_service.rerank(query_str, candidates, top_n=config.TOP_K_RERANKED)
    t_rerank_ms = int((time.time() - t_rerank_start) * 1000)

    # Step 6: Context Optimization (Deduplication, threshold filtering)
    optimized_context = context_optimizer.optimize(reranked_chunks)

    # Step 7: Strict Evidence Gate Pre-Check
    gate_result = evidence_checker.check(query_str, optimized_context)

    # CRITICAL CONTRACT: If Evidence Gate FAILS, NEVER call Gemini!
    if not gate_result.is_sufficient:
        total_latency = int((time.time() - total_start) * 1000)
        logger.info(
            f"Evidence Gate FAILED (Score: {gate_result.confidence_score}). "
            "Gemini was NOT invoked. Returning NO_EVIDENCE response."
        )
        return jsonify({
            "query": query_str,
            "status": "NO_EVIDENCE",
            "domain": target_domain,
            "retrieval_strategy": selected_strategy,
            "answer": gate_result.insufficient_response,
            "sources": [],
            "telemetry": {
                "retrieval_strategy": selected_strategy,
                "domain_detected": target_domain,
                "retrieval_latency_ms": t_ret_ms,
                "candidate_count": len(candidates),
                "reranking_latency_ms": t_rerank_ms,
                "evidence_score": gate_result.confidence_score,
                "evidence_status": "FAIL",
                "llm_latency_ms": 0,
                "total_query_latency_ms": total_latency
            },
            "gate_reason": gate_result.reason
        }), 200

    # Step 8: Gemini 3.5 Flash Grounded Generation (Only when Gate PASSES)
    logger.info(f"Evidence Gate PASSED (Score: {gate_result.confidence_score}). Invoking Gemini 3.5 Flash...")
    gen_result = gemini_generator.generate(query_str, optimized_context)
    llm_latency_ms = gen_result.get("latency_ms", 0)

    total_latency = int((time.time() - total_start) * 1000)

    # Build structured sources list
    sources = []
    for c in optimized_context:
        src = c.get("source_info", {})
        sources.append({
            "document_name": src.get("filename", "Document"),
            "page": c.get("page"),
            "section": c.get("section"),
            "chunk_id": c.get("chunk_id"),
            "domain": c.get("domain"),
            "relevance_score": c.get("rerank_score", c.get("retrieval_score", 0.0))
        })

    response_payload = {
        "query": query_str,
        "status": "ANSWERED",
        "domain": target_domain,
        "retrieval_strategy": selected_strategy,
        "answer": gen_result.get("answer", ""),
        "sources": sources,
        "telemetry": {
            "retrieval_strategy": selected_strategy,
            "domain_detected": target_domain,
            "retrieval_latency_ms": t_ret_ms,
            "candidate_count": len(candidates),
            "reranking_latency_ms": t_rerank_ms,
            "evidence_score": gate_result.confidence_score,
            "evidence_status": "PASS",
            "llm_latency_ms": llm_latency_ms,
            "total_query_latency_ms": total_latency
        }
    }

    logger.info(f"Query answered successfully in {total_latency}ms.")
    return jsonify(response_payload), 200

if __name__ == "__main__":
    port = config.PORT
    logger.info(f"Starting Adaptive Domain-Aware RAG AI Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=config.DEBUG)
