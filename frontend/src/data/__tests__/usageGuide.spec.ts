import { describe, expect, it } from 'vitest'
import { usageGuideContent } from '../usageGuide'

describe('usageGuideContent', () => {
  it('covers the required beginner workflow and troubleshooting topics', () => {
    expect(usageGuideContent.zh.quickStart.steps).toHaveLength(4)
    expect(usageGuideContent.zh.essentials.items.map((item) => item.term)).toEqual([
      'API 端点',
      'API 密钥',
      '模型 ID',
      '分组',
    ])
    expect(usageGuideContent.zh.troubleshooting.items.map((item) => item.symptom)).toEqual(
      expect.arrayContaining([
        '401 / Unauthorized',
        '404 / Not Found',
        '429 / Too Many Requests',
        'No available compatible accounts',
        'stream disconnected / decoding response body',
      ]),
    )
  })

  it('provides popular clients, coding tools, and SDK examples', () => {
    const ids = usageGuideContent.zh.softwareGuides.map((guide) => guide.id)
    expect(ids).toEqual(expect.arrayContaining([
      'cherry-studio',
      'chatbox',
      'open-webui',
      'lobechat',
      'cline-roo',
      'claude-code',
      'codex-cli',
      'curl',
      'python-sdk',
      'node-sdk',
    ]))

    for (const category of ['clients', 'coding', 'sdk'] as const) {
      expect(usageGuideContent.zh.softwareGuides.some((guide) => guide.category === category)).toBe(true)
    }
  })

  it('keeps secrets as placeholders in every code snippet', () => {
    const snippets = usageGuideContent.zh.softwareGuides.flatMap((guide) => guide.snippets ?? [])
    expect(snippets.length).toBeGreaterThan(0)
    expect(snippets.every((snippet) => !snippet.code.includes('sk-') || snippet.code.includes('{API_KEY}'))).toBe(true)
  })
})
