import { NextResponse } from 'next/server'
import { AppError } from './errors'

/**
 * 成功レスポンスを生成
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * エラーレスポンスを生成
 */
export function errorResponse(error: Error | AppError, status?: number) {
  const isAppError = error instanceof AppError
  const statusCode = status || (isAppError ? error.statusCode : 500)

  return NextResponse.json(
    {
      success: false,
      error: error.message,
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      ...(isAppError && error instanceof Error && 'errors' in error
        ? { errors: (error as any).errors }
        : {}),
    },
    { status: statusCode }
  )
}

/**
 * API Routeのエラーハンドリング
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return errorResponse(error)
  }

  if (error instanceof Error) {
    return errorResponse(error)
  }

  return errorResponse(new Error('予期しないエラーが発生しました'))
}



