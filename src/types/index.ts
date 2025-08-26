export interface UploadResponse {
  success: boolean
  filename: string
  originalName: string
  size: number
  url: string
}

export interface Caption {
  caption: string
  hashtags: string
}

export interface CaptionResponse {
  success: boolean
  captions: Caption[]
}

export interface GenerateCaptionRequest {
  imageUrl: string
  userNotes?: string
  tone?: string
}