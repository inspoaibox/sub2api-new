export type AIWorkbenchMode = 'image' | 'video'
export type AIWorkbenchGenerationStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface AIWorkbenchHistoryItem {
  id: string
  kind: AIWorkbenchMode
  prompt: string
  model: string
  keyName: string
  status: AIWorkbenchGenerationStatus
  createdAt: number
  urls: string[]
  sourceUrls?: string[]
  keyId?: number
  requestId?: string
  error?: string
}

interface AIWorkbenchHistoryRecord {
  key: string
  items: AIWorkbenchHistoryItem[]
  updatedAt: number
}

const databaseName = 'sub2api-ai-workbench'
const databaseVersion = 1
const storeName = 'history'

function storageKey(userId: number, mode: AIWorkbenchMode): string {
  return `sub2api:ai-workbench:v1:${userId}:${mode}`
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Unable to open workbench history storage'))
  })
}

function cloneItems(items: AIWorkbenchHistoryItem[]): AIWorkbenchHistoryItem[] {
  return items.map((item) => ({
    ...item,
    // Object URLs are tied to the current document and cannot survive a refresh.
    urls: item.urls.filter((url) => !url.startsWith('blob:')),
    sourceUrls: item.sourceUrls ? [...item.sourceUrls] : undefined,
  }))
}

export function markInterruptedGenerations(items: AIWorkbenchHistoryItem[], interruptedMessage: string): AIWorkbenchHistoryItem[] {
  return items.map((item) => {
    if (item.status !== 'queued' && item.status !== 'processing') {
      return { ...item, urls: [...item.urls], sourceUrls: item.sourceUrls ? [...item.sourceUrls] : undefined }
    }
    return {
      ...item,
      urls: [...item.urls],
      sourceUrls: item.sourceUrls ? [...item.sourceUrls] : undefined,
      status: 'failed',
      error: interruptedMessage,
    }
  })
}

export async function loadAIWorkbenchHistory(userId: number, mode: AIWorkbenchMode): Promise<AIWorkbenchHistoryItem[]> {
  if (!Number.isFinite(userId) || userId <= 0) return []
  const database = await openDatabase()
  if (!database) return []

  try {
    const record = await new Promise<AIWorkbenchHistoryRecord | undefined>((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(storageKey(userId, mode))
      request.onsuccess = () => resolve(request.result as AIWorkbenchHistoryRecord | undefined)
      request.onerror = () => reject(request.error || new Error('Unable to load workbench history'))
    })
    return Array.isArray(record?.items) ? cloneItems(record.items) : []
  } finally {
    database.close()
  }
}

export async function saveAIWorkbenchHistory(userId: number, mode: AIWorkbenchMode, items: AIWorkbenchHistoryItem[]): Promise<void> {
  if (!Number.isFinite(userId) || userId <= 0) return
  const database = await openDatabase()
  if (!database) return

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).put({
        key: storageKey(userId, mode),
        items: cloneItems(items),
        updatedAt: Date.now(),
      } satisfies AIWorkbenchHistoryRecord)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error('Unable to save workbench history'))
      transaction.onabort = () => reject(transaction.error || new Error('Unable to save workbench history'))
    })
  } finally {
    database.close()
  }
}

export async function clearAIWorkbenchHistory(userId: number, mode: AIWorkbenchMode): Promise<void> {
  if (!Number.isFinite(userId) || userId <= 0) return
  const database = await openDatabase()
  if (!database) return

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).delete(storageKey(userId, mode))
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error('Unable to clear workbench history'))
      transaction.onabort = () => reject(transaction.error || new Error('Unable to clear workbench history'))
    })
  } finally {
    database.close()
  }
}
