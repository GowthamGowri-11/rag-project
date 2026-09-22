# Adaptive Domain-Aware RAG

An enterprise-grade, dynamically extensible Retrieval-Augmented Generation (RAG) system engineered with **strict grounding guarantees** and **dynamic domain isolation**.

The foundational contract of this system is:
> **The system answers ONLY from knowledge explicitly uploaded and indexed by the user. The LLM is NEVER called to answer from pretrained/general knowledge when sufficient evidence does not exist in the knowledge base.**

---

## 1. High-Level Architecture Diagram

```
                         USER
                          |
                +---------+---------+
                |                   |
          Upload Document       Ask Question
                |                   |
                v                   v
        React Frontend       React Frontend
        (Vite + TS/JS)       (Vite + TS/JS)
                |                   |
                +---------+---------+
                          |
                   REST API Gateway
                          |
                          v
                  Node.js + Express
                          |
             +------------+-------------+
             |                          |
             v                          v
      DOCUMENT PIPELINE          QUERY PIPELINE
             |                          |
             v                          v
      Format Detection            Query Analyzer
    (PDF/DOCX/TXT/MD/HTML/              |
       CSV/JSON/Code)                   v
             |                   Domain Detection
             v                 (Isolated Namespace)
     Content Extraction                 |
             |                          v
             v                   Retrieval Router
     Document Analyzer                  |
    (Density/Hierarchy)        +--------+--------+
             |                 |        |        |
             v               Dense   Sparse   Hybrid
     Adaptive Chunking         |        |        |
    (Code/Table/Section/       +--------+--------+
     Heading/Paragraph)                 |
             |                          v
             v                     Qdrant Cloud
           BGE-M3                   Retrieval
      (1024-dim Vector)                 |
             |                          v
             v                      Top 20-50
        Qdrant Cloud                    |
      (Payload Indexed                  v
         by Domain)            BGE Reranker v2-M3
             |                          |
             |                          v
             |                       Top 5-10
             |                          |
             |                          v
             |                  Context Optimizer
             |                 (Dedup & Score Filter)
             |                          |
             |                          v
             |                STRICT EVIDENCE GATE
             |                          |
             |                    +-----+-----+
             |                    |           |
             |                  PASS         FAIL
             |                    |           |
             |                    v           v
             |              Gemini 3.5    NO LLM CALL
             |                 Flash          |
             |                    |           v
             |                    v     "Insufficient Evidence"
             |             Grounded Answer   Refusal
             |               + Citations
             |                    |
             +--------------------+
                          |
                          v
                    REST Response
                   (with Telemetry)
                          |
                          v
                   React Dashboard
```

---

## 2. Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS | Interactive glassmorphic dashboard, domain manager, upload pipeline, grounded chat with telemetry & source citation inspector |
| **Gateway API** | Node.js, Express.js | Main REST API gateway, multipart upload handling, validation, proxy orchestrator |
| **AI / RAG Service** | Python (Flask REST API) | Document parsing, structural analysis, adaptive chunking, embeddings, vector search, reranking, evidence gate, Gemini generation |
| **LLM** | Google Gemini 3.5 Flash | Strictly grounded answer synthesis (invoked **ONLY** when Evidence Gate PASSES) |
| **Embeddings** | BAAI BGE-M3 | 1024-dimensional dense vectors and lexical sparse representations |
| **Vector DB** | Qdrant Cloud | Dedicated knowledge database with payload indexing on `domain` and `document_id` |
| **Transformer Reranker** | BAAI BGE Reranker v2-M3 | High-precision cross-encoder scoring of top 20–50 candidate passages down to top 5–10 |
| **Document Parsers** | Python-based multi-format loaders | PDF, DOCX, TXT, Markdown, HTML, CSV, JSON, and Source Code |
| **Evaluation** | Ragas | Faithfulness, answer relevancy, context precision, and context recall |

*System Restrictions Enforced*: No Next.js, No NestJS, No FastAPI, No PostgreSQL/Neon/MongoDB as vector store.

---

## 3. Core Architectural Capabilities

### 3.1 Strict Evidence Gate (Anti-Hallucination)
Before calling Gemini 3.5 Flash, retrieved chunks pass through the `EvidenceChecker`:
1. **Empty Candidate Check**: If 0 chunks are retrieved (or domain does not exist), the pipeline immediately returns `NO_EVIDENCE`.
2. **Score Threshold Check**: The top rerank score must exceed `EVIDENCE_CONFIDENCE_THRESHOLD` (e.g. 0.65).
3. **Keyword & Entity Coverage**: Essential query terms must be reflected in the candidate passages.
4. **Guaranteed Refusal**: If checks fail, Gemini is **NOT** called. The system outputs:
   `"I don't have sufficient information about this topic in the available knowledge base."`

### 3.2 Dynamic Domain Management & Isolation
Domains are not hard-coded. Users create domains at runtime (e.g., `RAG`, `Legal`, `Clinical`, `Finance`).
- Documents are assigned to a domain upon ingestion.
- In Qdrant, each chunk carries `"domain": "<name>"` in its payload.
- Searches use Qdrant payload filters: `must: [{"key": "domain", "match": {"value": detected_domain}}]`.
- Adding new domains requires zero re-indexing of existing domains.

### 3.3 Adaptive Document Ingestion
1. Multi-format loaders normalize all input into a unified `DocumentRepresentation`.
2. The `DocumentAnalyzer` examines text density, hierarchy depth, tables, code density, and page boundaries.
3. The `AdaptiveChunkingSelector` dynamically chooses the strategy:
   - `code-aware` (preserves functions & classes)
   - `table-aware` (preserves CSV/table rows without column tearing)
   - `heading-aware` / `section-aware` (hierarchical structural splits)
   - `page-aware` (preserves PDF page boundaries)
   - `recursive` / `paragraph-based` / `sentence-based`

### 3.4 Adaptive Retrieval & Reranking
- **Query Analyzer** extracts intent, exact identifiers (CVEs, RFCs), complexity, and domain hints.
- **Retrieval Router** dynamically chooses the strategy:
  - Exact IDs -> **Sparse / Lexical Retrieval**
  - Conceptual Questions -> **Dense Vector Retrieval**
  - Complex / Comparative Questions -> **Hybrid Fusion Retrieval**
- **BGE Reranker v2-M3** cross-encodes top 20–50 candidates to select the top 5–10 most relevant passages.
- **Context Optimizer** deduplicates overlapping text, filters sub-threshold items, and structures source citations.

---

## 4. Repository Structure

```
.
├── frontend/                     # React application (Vite + Modern Vanilla CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx     # System overview, knowledge stats, metrics
│   │   │   ├── DomainsManager.jsx# Dynamic domain registry & creation
│   │   │   ├── DocumentUpload.jsx# Multi-format drag & drop, strategy preview
│   │   │   ├── ChatInterface.jsx # Grounded chat, telemetry, citation drawer
│   │   │   └── DocumentList.jsx  # Repository table & deletion
│   │   ├── services/api.js       # Client for Express gateway
│   │   ├── index.css             # Glassmorphic obsidian design tokens
│   │   ├── App.jsx               # Main container & tabbed navigation
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                      # Node.js + Express REST API Gateway
│   ├── src/
│   │   ├── routes/
│   │   │   ├── documents.js      # Upload, list, delete documents
│   │   │   ├── domains.js        # Dynamic domain management
│   │   │   ├── chat.js           # Query pipeline dispatch
│   │   │   └── health.js         # Service health checks
│   │   ├── services/
│   │   │   └── aiServiceClient.js# HTTP client to Python AI service
│   │   ├── middleware/
│   │   │   ├── upload.js         # Multer configuration
│   │   │   └── logger.js         # Latency & request logger
│   │   └── server.js             # Express bootstrap (Port 5000)
│   └── package.json
│
├── ai-service/                   # Python AI / RAG Service (Flask HTTP API - Port 8000)
│   ├── ingestion/
│   │   ├── loaders/              # PDF, DOCX, TXT, MD, HTML, CSV, JSON, Code
│   │   ├── document_analyzer/    # Document structural profiling
│   │   ├── chunking/             # Adaptive selector & 11 chunking strategies
│   │   └── embeddings/           # BGE-M3 (1024-dim dense + sparse)
│   ├── retrieval/
│   │   ├── query_analyzer/       # Intent, entities, identifiers, complexity
│   │   ├── domain_router/        # Dynamic domain isolation
│   │   ├── retrieval_router/     # Dense vs Sparse vs Hybrid selection
│   │   ├── dense/                # Dense retriever
│   │   ├── sparse/               # Sparse retriever
│   │   ├── hybrid/               # Hybrid retriever
│   │   └── reranker/             # BGE Reranker v2-M3
│   ├── generation/
│   │   ├── context_optimizer/    # Deduplication & score thresholding
│   │   ├── evidence_checker/     # Strict Evidence Gate (Anti-Hallucination)
│   │   └── gemini/               # Gemini 3.5 Flash with strict grounding prompt
│   ├── vector_store/
│   │   └── qdrant/               # Qdrant client, payload indexing, search
│   ├── evaluation/               # Ragas evaluation scaffold
│   ├── tests/                    # Pipeline & E2E unit test suite
│   ├── app.py                    # Flask application
│   ├── config.py                 # Configuration & environment loader
│   └── requirements.txt
│
├── shared/                       # Cross-system specifications and schemas
│   ├── schemas/                  # JSON Schemas (document, chunk, query, domain)
│   └── types.ts                  # Shared TypeScript type definitions
│
├── .env.example                  # Environment configuration template
└── README.md                     # Documentation
```

---

## 5. Quick Start & Setup Instructions

### 5.1 Prerequisites
- **Node.js**: v18+ (Node.js 24 installed)
- **Python**: 3.10+ (Python 3.14 installed)
- **Qdrant**: Qdrant Cloud cluster URL & API key (or local Docker `docker run -p 6333:6333 qdrant/qdrant`)
- **Google Gemini**: Gemini API Key

### 5.2 Environment Configuration
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
QDRANT_URL=https://your-qdrant-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION_NAME=adaptive_domain_rag
PORT=5000
AI_SERVICE_PORT=8000
```

### 5.3 Step 1: Start Python AI Service
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```
*Service will start on `http://127.0.0.1:8000`.*

### 5.4 Step 2: Start Node.js Express Gateway
```bash
cd backend
npm install
npm start
```
*Gateway will start on `http://127.0.0.1:5000`.*

### 5.5 Step 3: Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server will start on `http://localhost:3000`.*

---

## 6. Running Tests

Execute the comprehensive automated test suite (pipeline validation + anti-hallucination E2E tests):
```bash
python -m unittest discover -s ai-service/tests
```
All tests verify:
- Document format normalization across all formats
- Structural document analyzer and adaptive chunking selection
- Query analysis (intent, identifiers, domain hints)
- Retrieval strategy selection (dense, sparse, hybrid)
- **Evidence Gate refusal** on un-indexed domains (Zero LLM calls)
- **Evidence Gate refusal** on low-confidence evidence (Zero LLM calls)
- Grounded generation when evidence passes the gate

---

## 7. REST API Reference

### Express Gateway (`http://localhost:5000`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status of Gateway, Python service, and Qdrant |
| `GET` | `/api/domains` | List all dynamically registered knowledge domains |
| `POST` | `/api/domains` | Register a new dynamic knowledge domain |
| `POST` | `/api/documents/upload` | Upload and adaptively ingest a multi-format document |
| `GET` | `/api/documents` | List all indexed documents with chunking metadata |
| `DELETE` | `/api/documents/:id` | Purge document and delete its vectors from Qdrant |
| `POST` | `/api/chat/query` | Execute adaptive query pipeline with Evidence Gate |

#### Query Request Payload Example:
```json
{
  "query": "What is semantic chunking?",
  "domain_override": "rag",
  "retrieval_strategy_override": null
}
```

#### Query Response Example (ANSWERED):
```json
{
  "query": "What is semantic chunking?",
  "status": "ANSWERED",
  "domain": "rag",
  "retrieval_strategy": "dense",
  "answer": "Semantic chunking splits text based on topic transitions rather than fixed character counts...",
  "sources": [
    {
      "document_name": "RAG_Fundamentals.pdf",
      "page": 12,
      "section": "Chunking Architectures",
      "chunk_id": "chunk_a1b2",
      "domain": "rag",
      "relevance_score": 0.91
    }
  ],
  "telemetry": {
    "retrieval_strategy": "dense",
    "domain_detected": "rag",
    "retrieval_latency_ms": 14,
    "candidate_count": 30,
    "reranking_latency_ms": 22,
    "evidence_score": 0.91,
    "evidence_status": "PASS",
    "llm_latency_ms": 420,
    "total_query_latency_ms": 462
  }
}
```

#### Query Response Example (REFUSED / NO_EVIDENCE):
```json
{
  "query": "What is quantum computing?",
  "status": "NO_EVIDENCE",
  "domain": null,
  "retrieval_strategy": "none",
  "answer": "I don't have sufficient information about this topic in the available knowledge base.",
  "sources": [],
  "telemetry": {
    "evidence_status": "FAIL",
    "evidence_score": 0.0,
    "llm_latency_ms": 0,
    "total_query_latency_ms": 5
  }
}
```
*(Notice `llm_latency_ms: 0` - Gemini was completely inhibited from hallucinating!)*
