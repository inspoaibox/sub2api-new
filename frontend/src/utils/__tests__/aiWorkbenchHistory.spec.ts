import { describe, expect, it } from 'vitest'
import { markInterruptedGenerations, type AIWorkbenchHistoryItem } from '../aiWorkbenchHistory'

describe('AI workbench history', () => {
  it('preserves completed output and marks in-flight generations as interrupted', () => {
    const items: AIWorkbenchHistoryItem[] = [
      {
        id: 'completed',
        kind: 'image',
        prompt: 'a lighthouse at dawn',
        model: 'gpt-image-2',
        keyName: 'Image key',
        status: 'completed',
        createdAt: 1,
        urls: ['data:image/png;base64,final'],
      },
      {
        id: 'processing',
        kind: 'image',
        prompt: 'a mountain lake',
        model: 'gpt-image-2',
        keyName: 'Image key',
        status: 'processing',
        createdAt: 2,
        urls: ['data:image/png;base64,preview'],
      },
    ]

    const restored = markInterruptedGenerations(items, 'Generation connection interrupted')

    expect(restored[0]).toMatchObject({ status: 'completed', urls: ['data:image/png;base64,final'] })
    expect(restored[1]).toMatchObject({
      status: 'failed',
      error: 'Generation connection interrupted',
      urls: ['data:image/png;base64,preview'],
    })
    expect(items[1].status).toBe('processing')
  })
})
