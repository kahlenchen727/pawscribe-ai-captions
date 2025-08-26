import axios from 'axios'
import { UploadResponse, CaptionResponse, GenerateCaptionRequest } from '../types'

const API_BASE_URL = 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for AI requests
})

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('image', file)

  const response = await api.post<UploadResponse>('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const generateCaptions = async (request: GenerateCaptionRequest): Promise<CaptionResponse> => {
  const response = await api.post<CaptionResponse>('/api/generate-captions', request)
  return response.data
}

export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await api.get('/health')
  return response.data
}