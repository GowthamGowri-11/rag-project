/**
 * Shared Type Definitions for Adaptive Domain-Aware RAG System
 */

export type DocumentType =
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'markdown'
  | 'html'
  | 'csv'
  | 'json'
  | 'code';

export interface DocumentSection {
  title: string;
  level?: number;
  content: string;
}

export interface DocumentPage {
  page_number: number;
  text: string;
}

export interface DocumentTable {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface DocumentRepresentation {
  document_id: string;
  filename: string;
  document_type: DocumentType;
  raw_text: string;
  sections: DocumentSection[];
  headings: string[];
  pages?: DocumentPage[];
  tables?: DocumentTable[];
  metadata: {
    domain: string;
    uploaded_at: string;
    file_size_bytes: number;
    mime_type?: string;
    [key: string]: any;
  };
}

export type ChunkingStrategy =
  | 'fixed-size'
  | 'fixed-size-overlap'
  | 'sentence-based'
  | 'paragraph-based'
  | 'recursive'
  | 'semantic'
  | 'heading-aware'
  | 'section-aware'
  | 'page-aware'
  | 'table-aware'
  | 'code-aware';

export interface ChunkMetadata {
  document_id: string;
  chunk_id: string;
  domain: string;
  document_type: DocumentType;
  section?: string;
  page?: number;
  chunk_strategy: ChunkingStrategy;
  chunk_size: number;
  overlap: number;
  source_info: {
    filename: string;
    location_label?: string;
  };
}

export interface Chunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
  dense_vector?: number[];
  sparse_vector?: Record<number, number>;
}

export interface Domain {
  id: string;
  name: string;
  description: string;
  document_count: number;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export type QueryIntent =
  | 'factual_lookup'
  | 'conceptual_explanation'
  | 'cross_document_comparison'
  | 'exact_identifier_search'
  | 'troubleshooting'
  | 'general_inquiry';

export interface QueryAnalysis {
  query: string;
  intent: QueryIntent;
  keywords: string[];
  entities: string[];
  exact_identifiers: string[];
  is_conceptual: boolean;
  is_comparison: boolean;
  complexity: 'low' | 'medium' | 'high';
  detected_domain: string | null;
  domain_confidence: number;
}

export type RetrievalStrategy = 'dense' | 'sparse' | 'hybrid';

export interface CandidateChunk {
  chunk_id: string;
  document_id: string;
  domain: string;
  text: string;
  source_info: {
    filename: string;
    page?: number;
    section?: string;
  };
  retrieval_score: number;
  rerank_score?: number;
}

export interface EvidenceGateResult {
  is_sufficient: boolean;
  max_score: number;
  mean_score: number;
  candidate_count: number;
  reason: string;
}

export type QueryPipelineStatus =
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'NO_EVIDENCE'
  | 'ANSWERED';

export interface QueryTelemetry {
  document_processing_time_ms?: number;
  chunking_strategy?: string;
  chunk_count?: number;
  embedding_time_ms?: number;
  retrieval_strategy: RetrievalStrategy;
  domain_detected: string | null;
  retrieval_latency_ms: number;
  candidate_count: number;
  reranking_latency_ms: number;
  evidence_score: number;
  evidence_status: 'PASS' | 'FAIL';
  llm_latency_ms: number;
  total_query_latency_ms: number;
}

export interface QueryResponse {
  query: string;
  status: QueryPipelineStatus;
  domain: string | null;
  retrieval_strategy: RetrievalStrategy;
  answer: string;
  sources: Array<{
    document_name: string;
    page?: number;
    section?: string;
    chunk_id: string;
    domain: string;
    relevance_score?: number;
  }>;
  telemetry: QueryTelemetry;
  error?: string;
}
