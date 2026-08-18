import { buildGatewayUrl } from './client'

export interface ImageGenerationRequest {
  model: string
  prompt: string
  n?: number
  size?: string
  quality?: string
  response_format?: 'url' | 'b64_json'
  stream?: boolean
  partial_images?: number
}

export interface ImageGenerationItem {
  type?: string
  url?: string
  b64_json?: string
  revised_prompt?: string
  output_format?: string
  partial_image_index?: number
}

export interface ImageGenerationResponse {
  created?: number
  data?: ImageGenerationItem[]
}

export interface ImageGenerationStreamEvent {
  kind: 'partial' | 'completed' | 'error'
  item?: ImageGenerationItem
  error?: string
}

export interface MediaModel {
  id: string
  object?: string
  owned_by?: string
  capability?: 'image' | 'video' | string
}

export interface MediaModelsResponse {
  object?: string
  data?: MediaModel[]
}

type ImageGenerationStreamListener = (event: ImageGenerationStreamEvent) => void

export interface VideoGenerationRequest {
  model: string
  prompt: string
  duration?: number
  resolution?: string
  aspect_ratio?: string
  image?: { url: string; type: 'image_url' }
}

export interface VideoGenerationResponse {
  id?: string
  request_id?: string
  status?: string
  url?: string
  video_url?: string
  data?: { url?: string }[]
  video?: { url?: string }
  error?: { message?: string }
}

async function parseError(response: Response): Promise<Error> {
  try {
    const body = await response.json()
    const message = body?.error?.message || body?.message || response.statusText
    return new Error(message || `HTTP ${response.status}`)
  } catch {
    return new Error(response.statusText || `HTTP ${response.status}`)
  }
}

function headers(apiKey: string, contentType = 'application/json'): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': contentType,
  }
}

export async function listMediaModels(
  apiKey: string,
  mode: 'image' | 'video',
  signal?: AbortSignal,
): Promise<MediaModelsResponse> {
  const endpoint = mode === 'image' ? '/v1/images/models' : '/v1/videos/models'
  const response = await fetch(buildGatewayUrl(endpoint), {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  })
  if (!response.ok) throw await parseError(response)
  return response.json()
}

export async function generateImage(apiKey: string, payload: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const response = await fetch(buildGatewayUrl('/v1/images/generations'), {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw await parseError(response)
  return response.json()
}

export async function editImage(apiKey: string, payload: ImageGenerationRequest, image: File): Promise<ImageGenerationResponse> {
  const form = new FormData()
  form.append('image', image)
  form.append('model', payload.model)
  form.append('prompt', payload.prompt)
  if (payload.n) form.append('n', String(payload.n))
  if (payload.size) form.append('size', payload.size)
  if (payload.quality) form.append('quality', payload.quality)
  if (payload.response_format) form.append('response_format', payload.response_format)

  const response = await fetch(buildGatewayUrl('/v1/images/edits'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
  if (!response.ok) throw await parseError(response)
  return response.json()
}

function streamPayload(payload: ImageGenerationRequest): ImageGenerationRequest {
  return {
    ...payload,
    stream: true,
    partial_images: payload.partial_images ?? 2,
  }
}

function streamItem(payload: Record<string, any>): ImageGenerationItem {
  const b64 = [payload.b64_json, payload.partial_image_b64, payload.result].find((value) => typeof value === 'string' && value)
  return {
    type: typeof payload.type === 'string' ? payload.type : undefined,
    url: typeof payload.url === 'string' ? payload.url : undefined,
    b64_json: typeof b64 === 'string' ? b64 : undefined,
    revised_prompt: typeof payload.revised_prompt === 'string' ? payload.revised_prompt : undefined,
    output_format: typeof payload.output_format === 'string'
      ? payload.output_format
      : typeof payload.format === 'string' ? payload.format : undefined,
    partial_image_index: typeof payload.partial_image_index === 'number' ? payload.partial_image_index : undefined,
  }
}

function streamEvent(
  eventName: string,
  rawData: string,
  listener: ImageGenerationStreamListener,
  completed: ImageGenerationItem[],
): void {
  const data = rawData.trim()
  if (!data || data === '[DONE]') return

  let payload: Record<string, any>
  try {
    payload = JSON.parse(data)
  } catch {
    return
  }

  const type = `${eventName} ${typeof payload.type === 'string' ? payload.type : ''}`.toLowerCase()
  if (type.includes('partial_image')) {
    const item = streamItem(payload)
    listener({ kind: 'partial', item })
    return
  }
  if (type.includes('completed')) {
    const item = streamItem(payload)
    completed.push(item)
    listener({ kind: 'completed', item })
    return
  }
  if (type.includes('error') || payload.error) {
    const error = payload.error?.message || payload.message || 'Image generation stream failed'
    listener({ kind: 'error', error: String(error) })
  }
}

async function streamImageRequest(
  apiKey: string,
  url: string,
  init: RequestInit,
  listener: ImageGenerationStreamListener,
): Promise<ImageGenerationResponse> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers || {}),
    },
  })
  if (!response.ok) throw await parseError(response)
  if (!response.body) throw new Error('Image generation stream is unavailable')
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
    return response.json()
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let eventName = ''
  let dataLines: string[] = []
  const completed: ImageGenerationItem[] = []

  const dispatch = () => {
    if (dataLines.length) streamEvent(eventName, dataLines.join('\n'), listener, completed)
    eventName = ''
    dataLines = []
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) {
        dispatch()
        continue
      }
      if (line.startsWith('event:')) eventName = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
    }
    if (done) break
  }
  if (buffer.trim()) {
    if (buffer.startsWith('event:')) eventName = buffer.slice(6).trim()
    else if (buffer.startsWith('data:')) dataLines.push(buffer.slice(5).trimStart())
  }
  dispatch()

  if (completed.length) return { data: completed }

  return { data: [] }
}

export function streamImage(
  apiKey: string,
  payload: ImageGenerationRequest,
  listener: ImageGenerationStreamListener,
): Promise<ImageGenerationResponse> {
  return streamImageRequest(
    apiKey,
    buildGatewayUrl('/v1/images/generations'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(streamPayload(payload)),
    },
    listener,
  )
}

export function streamImageEdit(
  apiKey: string,
  payload: ImageGenerationRequest,
  image: File,
  listener: ImageGenerationStreamListener,
): Promise<ImageGenerationResponse> {
  const form = new FormData()
  form.append('image', image)
  form.append('model', payload.model)
  form.append('prompt', payload.prompt)
  form.append('stream', 'true')
  form.append('partial_images', String(payload.partial_images ?? 2))
  if (payload.n) form.append('n', String(payload.n))
  if (payload.size) form.append('size', payload.size)
  if (payload.quality) form.append('quality', payload.quality)
  if (payload.response_format) form.append('response_format', payload.response_format)

  return streamImageRequest(
    apiKey,
    buildGatewayUrl('/v1/images/edits'),
    { method: 'POST', body: form },
    listener,
  )
}

export async function generateVideo(apiKey: string, payload: VideoGenerationRequest): Promise<VideoGenerationResponse> {
  const response = await fetch(buildGatewayUrl('/v1/videos/generations'), {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw await parseError(response)
  return response.json()
}

export async function getVideoStatus(apiKey: string, requestId: string): Promise<VideoGenerationResponse> {
  const response = await fetch(buildGatewayUrl(`/v1/videos/generations/${encodeURIComponent(requestId)}`), {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw await parseError(response)
  return response.json()
}

export async function getVideoContent(apiKey: string, requestId: string): Promise<Blob> {
  const response = await fetch(buildGatewayUrl(`/v1/videos/generations/${encodeURIComponent(requestId)}/content`), {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw await parseError(response)
  return response.blob()
}

export function resolveImageUrl(item: ImageGenerationItem): string {
  if (item.url) return item.url
  if (item.b64_json) return `data:image/${item.output_format || 'png'};base64,${item.b64_json}`
  return ''
}

export function resolveVideoUrl(response: VideoGenerationResponse): string {
  return response.video?.url || response.url || response.video_url || response.data?.[0]?.url || ''
}
