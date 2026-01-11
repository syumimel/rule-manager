import { Imagemap, ImagemapLineMessage } from './types'

/**
 * イメージマップをLINE Messaging API形式に変換
 * クライアントサイドでも使用可能
 */
export function toLineMessage(imagemap: Imagemap): ImagemapLineMessage {
  return {
    type: 'imagemap',
    baseUrl: imagemap.base_url,
    altText: imagemap.alt_text,
    baseSize: {
      width: imagemap.base_width,
      height: imagemap.base_height,
    },
    actions: imagemap.actions || [],
    ...(imagemap.video && { video: imagemap.video }),
  }
}



