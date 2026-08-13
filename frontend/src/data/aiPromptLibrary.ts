export interface PromptLibrarySource {
  id: string
  name: string
  url: string
  homepage: string
}

export interface PromptLibraryItem {
  id: string
  sourceId: string
  category: string
  title: string
  prompt: string
  description: string
  coverUrl: string
  tags: string[]
  author: string
  sourceUrl: string
  imageModel: string
}

export interface PromptLibraryLoadResult {
  items: PromptLibraryItem[]
  failedSources: string[]
}

interface CachedSource {
  id: string
  fetchedAt: number
  items: PromptLibraryItem[]
}

interface RawPromptSourceItem {
  id?: unknown
  title?: unknown
  prompt?: unknown
  description?: unknown
  coverUrl?: unknown
  referenceImageUrls?: unknown
  tags?: unknown
  author?: unknown
  sourceUrl?: unknown
  imageModel?: unknown
}

const cacheTtlMs = 60 * 60 * 1000
const databaseName = 'sub2api-ai-prompt-library'
const databaseVersion = 1
const storeName = 'sources'
const pendingLoads = new Map<string, Promise<PromptLibraryItem[]>>()

// These public JSON feeds are normalized by the Image Prompts registry used by
// Infinite Canvas. Keeping the source boundary lets the library update without
// coupling this application to a separate frontend.
export const promptLibrarySources: PromptLibrarySource[] = [
  source('banana-prompt-quicker', 'Banana Prompt Quicker', 'https://glidea.github.io/banana-prompt-quicker/'),
  source('davidwu-gpt-image2-prompts', 'DavidWu GPT Image 2', 'https://github.com/davidwuw0811-boop/awesome-gpt-image2-prompts'),
  source('freestylefly-gpt-image-2', 'Freestylefly GPT Image 2', 'https://github.com/freestylefly/awesome-gpt-image-2'),
  source('awesome-gpt-image', 'Awesome GPT Image', 'https://github.com/ZeroLu/awesome-gpt-image'),
  source('awesome-gpt4o-image-prompts', 'Awesome GPT-4o', 'https://github.com/ImgEdify/Awesome-GPT4o-Image-Prompts'),
  source('youmind-gpt-image-2', 'YouMind GPT Image 2', 'https://github.com/YouMind-OpenLab/awesome-gpt-image-2'),
  source('youmind-nano-banana-pro', 'YouMind Nano Banana Pro', 'https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts'),
]

const fallbackPrompts: PromptLibraryItem[] = [
  {
    id: 'sub2api-product-still-life',
    sourceId: 'sub2api',
    category: 'Sub2API',
    title: 'Product still life',
    prompt: 'Create a premium studio product photograph of [product]. Use a clean background, controlled softbox lighting, accurate materials, subtle shadows, and a balanced commercial composition.',
    description: 'Replace [product] with the item you want to show.',
    coverUrl: '',
    tags: ['product', 'studio', 'photorealistic'],
    author: '',
    sourceUrl: '',
    imageModel: '',
  },
  {
    id: 'sub2api-editorial-portrait',
    sourceId: 'sub2api',
    category: 'Sub2API',
    title: 'Editorial portrait',
    prompt: 'Create an editorial portrait of [subject] with natural skin texture, thoughtful styling, soft directional window light, a muted complementary color palette, shallow depth of field, and a refined magazine photography finish.',
    description: 'Replace [subject] with the person or character to portray.',
    coverUrl: '',
    tags: ['portrait', 'editorial', 'photography'],
    author: '',
    sourceUrl: '',
    imageModel: '',
  },
  {
    id: 'sub2api-app-poster',
    sourceId: 'sub2api',
    category: 'Sub2API',
    title: 'App launch poster',
    prompt: 'Design a polished launch poster for [product or campaign]. Establish a clear visual hierarchy, one central subject, confident typography space, a limited brand color palette, and crisp high-resolution details suitable for a modern digital campaign.',
    description: 'Replace [product or campaign] with your subject.',
    coverUrl: '',
    tags: ['poster', 'brand', 'design'],
    author: '',
    sourceUrl: '',
    imageModel: '',
  },
]

function source(id: string, name: string, homepage: string): PromptLibrarySource {
  return {
    id,
    name,
    homepage,
    url: `https://raw.githubusercontent.com/yukkcat/image-prompts/main/dist/sources/${id}.json`,
  }
}

export async function loadPromptLibrary(): Promise<PromptLibraryLoadResult> {
  const results = await Promise.all(promptLibrarySources.map(async (promptSource) => {
    try {
      return { items: await loadPromptSource(promptSource), failedSource: '' }
    } catch {
      return { items: [], failedSource: promptSource.name }
    }
  }))

  const items = results.flatMap((result) => result.items)
  return {
    items: items.length ? items : fallbackPrompts,
    failedSources: results.map((result) => result.failedSource).filter(Boolean),
  }
}

export function filterPromptLibrary(
  items: PromptLibraryItem[],
  options: { keyword?: string; category?: string; tags?: string[] },
): PromptLibraryItem[] {
  const keyword = options.keyword?.trim().toLowerCase() || ''
  const category = options.category || 'all'
  const tags = options.tags || []

  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false
    if (tags.length && !tags.some((tag) => item.tags.includes(tag))) return false
    if (!keyword) return true
    return [item.title, item.prompt, item.description, item.category, item.author, ...item.tags]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })
}

export function promptLibraryCategories(items: PromptLibraryItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.category).filter(Boolean)))
}

export function promptLibraryTags(items: PromptLibraryItem[]): string[] {
  return Array.from(new Set(items.flatMap((item) => item.tags).filter(Boolean))).sort((left, right) => left.localeCompare(right))
}

async function loadPromptSource(promptSource: PromptLibrarySource): Promise<PromptLibraryItem[]> {
  let cached: CachedSource | null = null
  try {
    cached = await readCachedSource(promptSource.id)
  } catch {
    // A private browsing context can reject IndexedDB while network requests
    // remain available. The prompt library should still be usable there.
  }
  if (cached && Date.now() - cached.fetchedAt < cacheTtlMs) return cached.items

  const existing = pendingLoads.get(promptSource.id)
  if (existing) return existing

  const loading = fetchPromptSource(promptSource, cached?.items)
    .finally(() => pendingLoads.delete(promptSource.id))
  pendingLoads.set(promptSource.id, loading)
  return loading
}

async function fetchPromptSource(
  promptSource: PromptLibrarySource,
  cachedItems: PromptLibraryItem[] | undefined,
): Promise<PromptLibraryItem[]> {
  try {
    const response = await fetch(promptSource.url, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload: unknown = await response.json()
    if (!Array.isArray(payload)) throw new Error('Prompt source returned an invalid payload')
    const items = normalizePromptItems(payload, promptSource)
    if (!items.length) throw new Error('Prompt source returned no valid prompts')
    try {
      await writeCachedSource({ id: promptSource.id, fetchedAt: Date.now(), items })
    } catch {
      // Caching is an optimization; do not hide successfully fetched prompts.
    }
    return items
  } catch (error) {
    if (cachedItems?.length) return cachedItems
    throw error
  }
}

function normalizePromptItems(values: unknown[], promptSource: PromptLibrarySource): PromptLibraryItem[] {
  const knownIds = new Set<string>()
  const items: PromptLibraryItem[] = []

  values.forEach((value, index) => {
    const record = asRecord(value)
    const title = stringValue(record.title).trim()
    const prompt = stringValue(record.prompt).trim()
    if (!title || !prompt) return

    const id = stringValue(record.id).trim() || `${promptSource.id}-${index + 1}`
    if (knownIds.has(id)) return
    knownIds.add(id)

    const referenceImageUrls = stringArray(record.referenceImageUrls)
    items.push({
      id,
      sourceId: promptSource.id,
      category: promptSource.name,
      title,
      prompt,
      description: stringValue(record.description).trim(),
      coverUrl: absoluteUrl(promptSource.url, stringValue(record.coverUrl).trim()) || absoluteUrl(promptSource.url, referenceImageUrls[0] || ''),
      tags: stringArray(record.tags),
      author: stringValue(record.author).trim(),
      sourceUrl: absoluteUrl(promptSource.url, stringValue(record.sourceUrl).trim()) || promptSource.homepage,
      imageModel: stringValue(record.imageModel).trim(),
    })
  })

  return items
}

function asRecord(value: unknown): RawPromptSourceItem {
  return value && typeof value === 'object' ? value as RawPromptSourceItem : {}
}

function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(stringValue).map((item) => item.trim()).filter(Boolean) : []
}

function absoluteUrl(baseUrl: string, value: string): string {
  if (!value) return ''
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return value
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Unable to open prompt library cache'))
  })
}

async function readCachedSource(id: string): Promise<CachedSource | null> {
  const database = await openDatabase()
  if (!database) return null

  try {
    return await new Promise<CachedSource | null>((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(id)
      request.onsuccess = () => resolve((request.result as CachedSource | undefined) || null)
      request.onerror = () => reject(request.error || new Error('Unable to read prompt library cache'))
    })
  } finally {
    database.close()
  }
}

async function writeCachedSource(entry: CachedSource): Promise<void> {
  const database = await openDatabase()
  if (!database) return

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite')
      transaction.objectStore(storeName).put(entry)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error('Unable to cache prompt library source'))
      transaction.onabort = () => reject(transaction.error || new Error('Unable to cache prompt library source'))
    })
  } finally {
    database.close()
  }
}
