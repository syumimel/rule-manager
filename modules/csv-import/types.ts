export interface CSVUploadResult {
  success: boolean
  error?: string
  ruleId?: string
  generationId?: string
  rowCount?: number
  preview?: CSVRow[]
}

export interface CSVRow {
  rowNumber: number
  data: Record<string, any>
}

export interface CSVValidationResult {
  isValid: boolean
  errors: string[]
  rowCount: number
  columnCount: number
  columns: string[]
}

export interface RuleGeneration {
  id: string
  rule_id: string
  generation_number: number
  uploaded_at: string
  uploaded_by: string
  row_count: number
  is_active: boolean
  is_archived: boolean
}



