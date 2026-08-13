import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlazaFilterBar from '../PlazaFilterBar.vue'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key })
  }
})

function mountFilter(overrides: Partial<InstanceType<typeof PlazaFilterBar>['$props']> = {}) {
  return mount(PlazaFilterBar, {
    props: {
      platforms: ['anthropic', 'openai'],
      groups: [
        { id: 1, name: 'OpenAI Standard', platform: 'openai', rate: 1 },
        { id: 2, name: 'Claude VIP', platform: 'anthropic', rate: 0.5 }
      ],
      rates: [0.5, 1],
      platform: 'all',
      groupId: 'all',
      rate: 'all',
      search: '',
      ...overrides
    }
  })
}

describe('PlazaFilterBar', () => {
  it('selecting a group synchronizes its platform and rate', async () => {
    const wrapper = mountFilter()

    await wrapper.get('[data-filter="group"]').setValue('2')

    expect(wrapper.emitted('update:filters')?.[0]).toEqual([{
      platform: 'anthropic',
      groupId: 2,
      rate: 0.5,
      search: ''
    }])
    expect(wrapper.emitted('update:filters')).toHaveLength(1)
  })

  it('clears an incompatible group when changing platforms', async () => {
    const wrapper = mountFilter({ platform: 'openai', groupId: 1, rate: 1 })

    await wrapper.get('[data-filter="platform"]').setValue('anthropic')

    expect(wrapper.emitted('update:filters')?.[0]).toEqual([{
      platform: 'anthropic',
      groupId: 'all',
      rate: 'all',
      search: ''
    }])
  })

  it('only lists groups compatible with the current platform and rate', () => {
    const wrapper = mountFilter({ platform: 'openai', rate: 1 })
    const options = wrapper.get('[data-filter="group"]').findAll('option').map((option) => option.text())

    expect(options).toContain('OpenAI Standard')
    expect(options).not.toContain('Claude VIP')
  })
})
