export interface FortuneTypeDefinition {
  fortune_type_id: string
  name: string
  description?: string
  category?: string
  calculation_function: string
  input_format: Record<string, string>
  output_format: {
    result_value: string
    additional_values?: Record<string, string>
  }
  message_template_id: string
  is_active?: boolean
  metadata?: {
    author?: string
    version?: string
  }
}

export interface FortuneTypeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface MessageTemplateDefinition {
  template_id: string
  fortune_type_id: string
  name: string
  description?: string
  templates: Array<{
    result_value: number | string | null
    value_range?: {
      min?: number
      max?: number
    }
    messages: Array<{
      type: 'text' | 'image' | 'imagemap'
      content: Record<string, any>
    }>
  }>
  default_messages?: Array<{
    type: 'text' | 'image' | 'imagemap'
    content: Record<string, any>
  }>
  validation?: {
    required_message_count?: {
      min: number
      max: number
    }
    check_image_existence?: boolean
  }
}

export interface MessageTemplateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingValues?: number[]
  invalidMessageCounts?: Array<{
    result_value: number | string
    count: number
  }>
  missingImages?: Array<{
    result_value: number | string
    image_id: string
  }>
}



