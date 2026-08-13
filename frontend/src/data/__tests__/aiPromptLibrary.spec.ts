import { describe, expect, it } from 'vitest'
import { filterPromptLibrary, promptLibraryCategories, promptLibraryTags, type PromptLibraryItem } from '../aiPromptLibrary'

const prompts: PromptLibraryItem[] = [
  {
    id: 'one',
    sourceId: 'source-a',
    category: 'Source A',
    title: 'Studio portrait',
    prompt: 'A fashion portrait under soft window light',
    description: '',
    coverUrl: '',
    tags: ['portrait', 'photo'],
    author: '',
    sourceUrl: '',
    imageModel: '',
  },
  {
    id: 'two',
    sourceId: 'source-b',
    category: 'Source B',
    title: 'Product poster',
    prompt: 'A clean advertising poster for a camera',
    description: 'Commercial design example',
    coverUrl: '',
    tags: ['product', 'design'],
    author: '',
    sourceUrl: '',
    imageModel: '',
  },
]

describe('AI prompt library', () => {
  it('derives categories and tags for the filter controls', () => {
    expect(promptLibraryCategories(prompts)).toEqual(['Source A', 'Source B'])
    expect(promptLibraryTags(prompts)).toEqual(['design', 'photo', 'portrait', 'product'])
  })

  it('filters by category, tags, and prompt text', () => {
    expect(filterPromptLibrary(prompts, { category: 'Source A' }).map((item) => item.id)).toEqual(['one'])
    expect(filterPromptLibrary(prompts, { tags: ['design'] }).map((item) => item.id)).toEqual(['two'])
    expect(filterPromptLibrary(prompts, { keyword: 'window light' }).map((item) => item.id)).toEqual(['one'])
  })
})
