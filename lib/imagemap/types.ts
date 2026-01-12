export interface ImagemapAction {
  type: 'uri' | 'message'
  linkUri?: string // typeが'uri'の場合
  text?: string // typeが'message'の場合
  area: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface ImagemapVideo {
  originalContentUrl: string
  previewImageUrl: string
  area: {
    x: number
    y: number
    width: number
    height: number
  }
  externalLink?: {
    linkUri: string
    label: string
  }
}

export interface Imagemap {
  id: string
  fortune_teller_id: string
  folder_id: string
  name: string
  base_url: string
  alt_text: string
  base_width: number
  base_height: number
  actions: ImagemapAction[]
  video: ImagemapVideo | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ImagemapInput {
  folder_id: string
  name: string
  alt_text: string
  base_width?: number
  base_height?: number
  actions?: ImagemapAction[]
  video?: ImagemapVideo | null
  is_active?: boolean
}

export interface ImagemapLineMessage {
  type: 'imagemap'
  baseUrl: string
  altText: string
  baseSize: {
    width: number
    height: number
  }
  actions: ImagemapAction[]
  video?: ImagemapVideo
}




