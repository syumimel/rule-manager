/**
 * ILE (Inline Logic Engine) メインエンジン
 */

import { ILEContext, ProcessedMessage } from './types'
import {
  getVariable,
  setVariable,
  generateRandom,
  getTableValue,
  getImageUrl,
  getLatestActiveGenerationId,
} from './functions'

/**
 * 関数呼び出しをパースする
 * 例: "set(key, value)" → { name: "set", args: ["key", "value"] }
 */
function parseFunctionCall(funcCall: string): { name: string; args: string[] } | null {
  const match = funcCall.match(/^(\w+)\((.*)\)$/)
  if (!match) {
    return null
  }

  const name = match[1]
  const argsStr = match[2]

  // カンマで分割（ネストされた関数呼び出しや文字列内のカンマを考慮）
  const args: string[] = []
  let current = ''
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]
    const nextChar = argsStr[i + 1]

    if (!inString) {
      if (char === "'" || char === '"') {
        inString = true
        stringChar = char
        current += char
      } else if (char === '(') {
        depth++
        current += char
      } else if (char === ')') {
        depth--
        current += char
      } else if (char === ',' && depth === 0) {
        args.push(current.trim())
        current = ''
      } else {
        current += char
      }
    } else {
      current += char
      if (char === stringChar && argsStr[i - 1] !== '\\') {
        inString = false
        stringChar = ''
      }
    }
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return { name, args }
}

/**
 * 引数の文字列からクォートを削除
 */
function unquoteArg(arg: string): string {
  const trimmed = arg.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/**
 * 単一のILE式を評価する（再帰的）
 */
async function evaluateExpression(
  expression: string,
  context: ILEContext
): Promise<string> {
  let result = expression
  const maxIterations = 100 // 無限ループ防止
  let iteration = 0

  // ${...} パターンがなくなるまで繰り返し評価
  while (result.includes('${') && iteration < maxIterations) {
    iteration++
    const previousResult = result
    const regex = /\$\{([^}]+)\}/g
    const matches: Array<{ fullMatch: string; content: string; index: number }> = []
    let match

    // 全ての${}パターンを収集
    while ((match = regex.exec(result)) !== null) {
      matches.push({
        fullMatch: match[0],
        content: match[1],
        index: match.index,
      })
    }

    if (matches.length === 0) {
      break
    }

    // set関数を先に処理する必要がある（副作用があるため）
    // 全てのマッチを評価してから、一度に置換する
    const evaluations: Array<{ fullMatch: string; evaluated: string; index: number }> = []
    
    // まずset関数を処理（前から後ろへ、順番が重要なので）
    for (const matchInfo of matches) {
      const { fullMatch, content } = matchInfo
      const funcMatch = parseFunctionCall(content)
      
      if (funcMatch && funcMatch.name === 'set') {
        const { args } = funcMatch
        const evaluatedArgs: string[] = []
        for (const arg of args) {
          const unquoted = unquoteArg(arg)
          if (unquoted.includes('${')) {
            evaluatedArgs.push(await evaluateExpression(unquoted, context))
          } else {
            const funcCallMatch = parseFunctionCall(unquoted)
            if (funcCallMatch) {
              evaluatedArgs.push(await evaluateExpression(`\${${unquoted}}`, context))
            } else {
              evaluatedArgs.push(unquoted)
            }
          }
        }
        
        if (evaluatedArgs.length === 2) {
          setVariable(evaluatedArgs[0], evaluatedArgs[1], context)
        }
        
        // set関数は空文字に置換
        evaluations.push({ fullMatch, evaluated: '', index: matchInfo.index })
      } else {
        // set以外は評価結果を記録
        let evaluated = ''
        
        if (funcMatch) {
          const { name, args } = funcMatch
          const evaluatedArgs: string[] = []
          for (const arg of args) {
            const unquoted = unquoteArg(arg)
            if (unquoted.includes('${')) {
              evaluatedArgs.push(await evaluateExpression(unquoted, context))
            } else {
              const funcCallMatch = parseFunctionCall(unquoted)
              if (funcCallMatch) {
                evaluatedArgs.push(await evaluateExpression(`\${${unquoted}}`, context))
              } else {
                evaluatedArgs.push(unquoted)
              }
            }
          }
          
          switch (name) {
            case 'rand':
              if (evaluatedArgs.length === 2) {
                const min = parseFloat(evaluatedArgs[0])
                const max = parseFloat(evaluatedArgs[1])
                if (!isNaN(min) && !isNaN(max)) {
                  evaluated = generateRandom(min, max)
                }
              }
              break
            case 'tbl':
              if (evaluatedArgs.length === 3) {
                const generationId = evaluatedArgs[0]
                const rowNumber = parseInt(evaluatedArgs[1], 10)
                const fieldName = evaluatedArgs[2]
                if (generationId && !isNaN(rowNumber) && fieldName) {
                  evaluated = await getTableValue(generationId, rowNumber, fieldName, context)
                }
              }
              break
            case 'img_conv':
              if (evaluatedArgs.length === 2) {
                const prefix = evaluatedArgs[0]
                const suffix = evaluatedArgs[1]
                if (prefix && suffix !== undefined) {
                  evaluated = await getImageUrl(prefix, suffix, context)
                }
              }
              break
            default:
              evaluated = ''
          }
      } else {
        // ${rand:min:max}形式のチェック
        const colonMatch = content.match(/^rand:(\d+):(\d+)$/)
        if (colonMatch) {
          const min = parseInt(colonMatch[1], 10)
          const max = parseInt(colonMatch[2], 10)
          if (!isNaN(min) && !isNaN(max)) {
            evaluated = generateRandom(min, max)
          }
        } else {
          // 変数参照
          evaluated = getVariable(content, context)
        }
      }
        
        evaluations.push({ fullMatch, evaluated, index: matchInfo.index })
      }
    }

    // 後ろから前に向かって置換（インデックスがずれないように）
    for (let i = evaluations.length - 1; i >= 0; i--) {
      const { fullMatch, evaluated, index } = evaluations[i]
      result = result.substring(0, index) + evaluated + result.substring(index + fullMatch.length)
    }

    // 変化がなければ終了
    if (result === previousResult) {
      break
    }
  }

  return result
}

/**
 * JSONオブジェクトを再帰的に走査してILE式を評価
 */
async function processValue(value: any, context: ILEContext): Promise<any> {
  if (typeof value === 'string') {
    return await evaluateExpression(value, context)
  } else if (Array.isArray(value)) {
    return await Promise.all(value.map((item) => processValue(item, context)))
  } else if (value && typeof value === 'object') {
    const processed: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      processed[key] = await processValue(val, context)
    }
    return processed
  }
  return value
}

/**
 * ILEエンジンでメッセージを処理
 * 
 * 入力形式:
 * {
 *   "__vars__": { ... },
 *   "__messages__": [ ... ]
 * }
 * 
 * または
 * [ ... ] (直接メッセージ配列)
 */
export async function processILEMessages(
  input: any,
  fortuneTellerId: string
): Promise<any[]> {
  const context: ILEContext = {
    vars: {},
    fortuneTellerId,
  }

  // __vars__がある場合は先に処理
  if (input && typeof input === 'object' && '__vars__' in input) {
    const varsObj = input.__vars__
    if (varsObj && typeof varsObj === 'object') {
      // __vars__は配列形式またはオブジェクト形式をサポート
      // 配列形式: [{"row_idx": "${rand:1:100}"}, {"sasaki": "${row_idx}"}, ...]
      // オブジェクト形式: {"row_idx": "${rand:1:100}", ...}
      if (Array.isArray(varsObj)) {
        // 配列形式の場合：順序を保持して評価
        for (const item of varsObj) {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            // オブジェクトの最初のキー-値ペアを使用
            for (const [key, value] of Object.entries(item)) {
              const processedValue = await processValue(value, context)
              context.vars[key] = processedValue
              break // 最初のキー-値ペアのみを使用
            }
          }
        }
      } else {
        // オブジェクト形式の場合：Object.entries()の順序で評価
        // 注意：JSONBから読み込まれたオブジェクトのキー順序は保証されないため、
        // 順序が重要な場合は配列形式の使用を推奨
        for (const [key, value] of Object.entries(varsObj)) {
          const processedValue = await processValue(value, context)
          context.vars[key] = processedValue
        }
      }
    }

    // __messages__を処理
    if ('__messages__' in input && Array.isArray(input.__messages__)) {
      const messages = await processValue(input.__messages__, context)
      return messages
    }

    return []
  }

  // 直接メッセージ配列の場合
  if (Array.isArray(input)) {
    const messages = await processValue(input, context)
    return messages
  }

  return []
}

