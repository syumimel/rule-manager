/**
 * LINEユーザーIDをマスク表示
 */
export function maskUserId(userId: string): string {
  if (!userId || userId.length < 8) {
    return userId
  }
  return `${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}`
}

/**
 * 日時をフォーマット
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

