import { describe, expect, it } from 'vitest'
import {
  customImageSizeValue,
  isValidCustomImageDimension,
  resolveImageRequestSize,
} from '../aiImageSettings'

describe('AI image settings', () => {
  it('keeps a selected preset unchanged', () => {
    expect(resolveImageRequestSize('1536x1024', 600, 400)).toBe('1536x1024')
  })

  it('builds a validated custom resolution', () => {
    expect(resolveImageRequestSize(customImageSizeValue, 2560, 1440)).toBe('2560x1440')
  })

  it('rejects invalid custom dimensions', () => {
    expect(isValidCustomImageDimension(255)).toBe(false)
    expect(isValidCustomImageDimension(4097)).toBe(false)
    expect(isValidCustomImageDimension(1024.5)).toBe(false)
    expect(resolveImageRequestSize(customImageSizeValue, 1024, 0)).toBe('')
  })
})
