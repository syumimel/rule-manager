'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Image {
  id: string
  name: string
  file_path: string
  url: string
  rule_id: string | null
  created_at: string
  rules: {
    name: string
  } | {
    name: string
  }[] | null
}

interface ImageListProps {
  images: Image[]
}

export default function ImageList({ images }: ImageListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewImage, setPreviewImage] = useState<Image | null>(null)
  const router = useRouter()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(images.map(img => img.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectImage = (imageId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(imageId)
    } else {
      newSelected.delete(imageId)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) {
      return
    }
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedIds.size === 0) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/images/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds: Array.from(selectedIds),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSelectedIds(new Set())
        setShowDeleteModal(false)
        router.refresh()
      } else {
        alert(`削除に失敗しました: ${data.error || '不明なエラー'}`)
      }
    } catch (error: any) {
      alert(`削除に失敗しました: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  const handleImageClick = (image: Image, e: React.MouseEvent) => {
    // チェックボックスやその他の要素のクリックは無視
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.closest('input')) {
      return
    }
    setPreviewImage(image)
  }

  const handleClosePreview = () => {
    setPreviewImage(null)
  }

  const handleCopyImageId = (imageId: string) => {
    navigator.clipboard.writeText(imageId)
    alert('画像IDをコピーしました')
  }

  const handlePreviousImage = () => {
    if (!previewImage) return
    const currentIndex = images.findIndex(img => img.id === previewImage.id)
    if (currentIndex > 0) {
      setPreviewImage(images[currentIndex - 1])
    }
  }

  const handleNextImage = () => {
    if (!previewImage) return
    const currentIndex = images.findIndex(img => img.id === previewImage.id)
    if (currentIndex < images.length - 1) {
      setPreviewImage(images[currentIndex + 1])
    }
  }

  if (images.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        まだ画像がアップロードされていません
      </div>
    )
  }

  const selectedImages = images.filter(img => selectedIds.has(img.id))

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === images.length && images.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              すべて選択 ({selectedIds.size}件選択中)
            </span>
          </label>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleDeleteClick}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            選択した画像を削除 ({selectedIds.size}件)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.id} className="bg-white p-4 rounded-lg shadow relative">
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedIds.has(image.id)}
                onChange={(e) => handleSelectImage(image.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div 
              className="mb-2 cursor-pointer"
              onClick={(e) => handleImageClick(image, e)}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-48 object-cover rounded hover:opacity-90 transition-opacity"
              />
            </div>
            <h3 className="font-semibold text-sm mb-1">{image.name}</h3>
            {image.rules && (
              <p className="text-xs text-gray-500 mb-1">
                ルール: {Array.isArray(image.rules) ? image.rules[0]?.name : image.rules.name}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {new Date(image.created_at).toLocaleString('ja-JP')}
            </p>
            <div className="mt-2">
              <input
                type="text"
                value={image.id}
                readOnly
                className="w-full px-2 py-1 text-xs bg-gray-100 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyImageId(image.id)
                }}
              />
              <p className="text-xs text-gray-400 mt-1">クリックで画像IDをコピー</p>
            </div>
          </div>
        ))}
      </div>

      {/* 画像プレビューモーダル */}
      {previewImage && (() => {
        const currentIndex = images.findIndex(img => img.id === previewImage.id)
        const isFirst = currentIndex === 0
        const isLast = currentIndex === images.length - 1
        
        return (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={handleClosePreview}
          >
            <div 
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {previewImage.name} ({currentIndex + 1} / {images.length})
                </h3>
                <button
                  onClick={handleClosePreview}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* コンテンツ */}
              <div className="p-6">
                {/* 画像プレビュー */}
                <div className="mb-6 flex justify-center bg-gray-100 rounded-lg p-4 relative">
                  {/* 前の画像ボタン */}
                  {!isFirst && (
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition-all hover:scale-110 z-10"
                      aria-label="前の画像"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  <img
                    src={previewImage.url}
                    alt={previewImage.name}
                    className="max-w-full max-h-[60vh] object-contain rounded"
                  />

                  {/* 次の画像ボタン */}
                  {!isLast && (
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition-all hover:scale-110 z-10"
                      aria-label="次の画像"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

              {/* 画像情報 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      画像名
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {previewImage.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      画像ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={previewImage.id}
                        readOnly
                        className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded"
                      />
                      <button
                        onClick={() => handleCopyImageId(previewImage.id)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        コピー
                      </button>
                    </div>
                  </div>

                  {previewImage.rules && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        紐付けルール
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {Array.isArray(previewImage.rules) 
                          ? previewImage.rules[0]?.name || 'なし'
                          : previewImage.rules.name || 'なし'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      アップロード日時
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(previewImage.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ファイルパス
                    </label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded break-all">
                      {previewImage.file_path}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      画像URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={previewImage.url}
                        readOnly
                        className="flex-1 text-sm text-gray-600 bg-gray-50 p-2 rounded break-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(previewImage.url)
                          alert('画像URLをコピーしました')
                        }}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        コピー
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* フッター */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={handleClosePreview}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-600">画像の削除確認</h3>
            <p className="mb-4 text-gray-700">
              選択した <strong className="text-red-600">{selectedIds.size}件</strong> の画像を削除しますか？
            </p>
            {selectedImages.length > 0 && selectedImages.length <= 10 && (
              <div className="mb-4 max-h-40 overflow-y-auto">
                <p className="text-sm font-semibold mb-2">削除対象:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {selectedImages.map(img => (
                    <li key={img.id}>{img.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mb-4 text-sm text-red-600">
              ⚠️ この操作は取り消せません。画像ファイルとデータベースから完全に削除されます。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



