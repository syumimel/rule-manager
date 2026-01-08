import { CSVValidationResult } from './types'

const MAX_ROWS = 4000
const MAX_COLUMNS = 20

export function validateCSV(
  rows: string[][],
  headers: string[]
): CSVValidationResult {
  const errors: string[] = []
  const rowCount = rows.length
  const columnCount = headers.length

  // 行数チェック
  if (rowCount > MAX_ROWS) {
    errors.push(`行数が上限を超えています（最大${MAX_ROWS}行、現在${rowCount}行）`)
  }

  // 列数チェック
  if (columnCount > MAX_COLUMNS) {
    errors.push(`列数が上限を超えています（最大${MAX_COLUMNS}列、現在${columnCount}列）`)
  }

  // 空のCSVチェック
  if (rowCount === 0) {
    errors.push('CSVファイルが空です')
  }

  // 列数の一貫性チェック
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== columnCount) {
      errors.push(`行${i + 1}の列数が一致しません（期待: ${columnCount}列、実際: ${rows[i].length}列）`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    rowCount,
    columnCount,
    columns: headers,
  }
}

export function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.split('\n').filter((line) => line.trim() !== '')
  
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  // ヘッダー行を取得
  const headers = parseCSVLine(lines[0])
  
  // データ行を取得
  const rows = lines.slice(1).map((line) => parseCSVLine(line))

  return { headers, rows }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"'
        i++
      } else {
        // 引用符の開始/終了
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // カンマで区切る
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // 最後のフィールドを追加
  result.push(current.trim())

  return result
}

export function convertToJSON(
  headers: string[],
  rows: string[][]
): Array<{ rowNumber: number; data: Record<string, any> }> {
  return rows.map((row, index) => {
    const data: Record<string, any> = {}
    headers.forEach((header, colIndex) => {
      data[header] = row[colIndex] || ''
    })
    return {
      rowNumber: index + 1,
      data,
    }
  })
}



