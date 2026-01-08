'use client'

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
  if (images.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        まだ画像がアップロードされていません
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <div key={image.id} className="bg-white p-4 rounded-lg shadow">
          <div className="mb-2">
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-48 object-cover rounded"
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
                (e.target as HTMLInputElement).select()
                document.execCommand('copy')
              }}
            />
            <p className="text-xs text-gray-400 mt-1">クリックで画像IDをコピー</p>
          </div>
        </div>
      ))}
    </div>
  )
}



