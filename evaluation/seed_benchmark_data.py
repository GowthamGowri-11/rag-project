import json
import os
import sys

# Ensure ai-service is in sys.path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from config import config
from ingestion.chunking.strategies import DocumentChunk
from ingestion import BGEM3EmbeddingService
from vector_store import QdrantKnowledgeStore


def seed_benchmark_data():
    print("=" * 60)
    print("SEEDING REAL BENCHMARK CORPUS INTO QDRANT CLUSTER")
    print("=" * 60)

    dataset_path = os.path.join(os.path.dirname(__file__), 'dataset', 'benchmark_corpus.json')
    with open(dataset_path, 'r', encoding='utf-8') as f:
        docs = json.load(f)

    embedding_service = BGEM3EmbeddingService(
        model_name=config.BGE_M3_MODEL_NAME,
        device=config.EMBEDDING_DEVICE
    )
    vector_store = QdrantKnowledgeStore(
        url=config.QDRANT_URL,
        api_key=config.QDRANT_API_KEY,
        collection_name=config.QDRANT_COLLECTION
    )

    total_chunks = 0
    for doc in docs:
        doc_id = doc["id"]
        filename = doc["filename"]
        domain = doc["domain"]
        doc_type = doc["document_type"]

        chunks = []
        texts = []
        for ch in doc["chunks"]:
            chunk_obj = DocumentChunk(
                id=ch["id"],
                document_id=doc_id,
                domain=domain,
                document_type=doc_type,
                text=ch["text"],
                section=ch.get("section"),
                page=ch.get("page"),
                chunk_strategy="heading-aware",
                chunk_size=len(ch["text"]),
                overlap=0,
                source_info={"filename": filename}
            )
            chunks.append(chunk_obj)
            texts.append(ch["text"])

        print(f"Embedding {len(texts)} chunks for doc '{filename}' (domain: {domain})...")
        dense_vecs = embedding_service.embed_dense(texts)
        sparse_vecs = embedding_service.embed_sparse(texts)

        success = vector_store.upsert_chunks(chunks, dense_vecs, sparse_vecs)
        if success:
            print(f"Successfully upserted {len(chunks)} chunks into Qdrant for '{filename}'.")
            total_chunks += len(chunks)
        else:
            print(f"ERROR: Failed to upsert chunks for '{filename}'.")

    print(f"\n[DONE] Total chunks indexed into Qdrant: {total_chunks}")
    return total_chunks


if __name__ == '__main__':
    seed_benchmark_data()
