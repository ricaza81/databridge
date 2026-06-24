// ─── Tipos globales DataBridge ────────────────────────────────────────────────

export interface SourceProfile {
  name: string
  rows: number
  cols: number
  potential_keys: string[]
  date_columns: string[]
  id_columns: string[]
  name_columns: string[]
  column_summary: Record<string, ColumnProfile>
}

export interface ColumnProfile {
  type: 'text' | 'numeric' | 'datetime' | 'id_numeric'
  null_pct: number
  unique_pct: number
  is_potential_key: boolean
  sample: string[]
}

export interface Relationship {
  source_a: string
  col_a: string
  source_b: string
  col_b: string
  name_similarity: number
  shared_values: number
  coverage_a_pct: number
  coverage_b_pct: number
  min_coverage_pct: number
  sample_shared: string[]
  confidence: number
}

export interface QualityIssue {
  source: string
  column: string
  type: 'nulos_excesivos' | 'columna_constante' | 'duplicados' | 'formato_inconsistente'
  detail: string
  severity: 'alta' | 'media' | 'baja'
}

export interface AnalysisSummary {
  total_sources: number
  total_rows: number
  total_relationships_found: number
  high_confidence_relationships: number
  critical_quality_issues: number
}

export interface Analysis {
  sources: SourceProfile[]
  relationships: Relationship[]
  quality_issues: QualityIssue[]
  errors: string[]
  summary: AnalysisSummary
}

export interface Session {
  session_id: string
  files: string[]
  analysis_ready: boolean
  summary?: AnalysisSummary
  analysis?: Analysis
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type UploadedFile = {
  name: string
  size: number
  status: 'uploading' | 'ready' | 'error'
}
