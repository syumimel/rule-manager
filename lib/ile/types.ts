/**
 * ILE (Inline Logic Engine) 型定義
 */

export interface ILEContext {
  vars: Record<string, any>
  fortuneTellerId: string
}

export interface ILEFunction {
  name: string
  execute: (args: string[], context: ILEContext) => Promise<string>
}

export interface ProcessedMessage {
  hasVars?: boolean
  messages: any[]
}



