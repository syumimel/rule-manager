/**
 * アプリケーションエラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

/**
 * 権限エラー
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'アクセス権限がありません') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'バリデーションエラー',
    public errors?: string[]
  ) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * リソースが見つからないエラー
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'リソースが見つかりません') {
    super(message, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}



