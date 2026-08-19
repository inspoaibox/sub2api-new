import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/stores/app'
import type { PublicSettings } from '@/types'
import UsageGuideView from '../UsageGuideView.vue'

function mountView(overrides: Partial<PublicSettings> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const appStore = useAppStore()
  appStore.cachedPublicSettings = {
    api_base_url: 'https://aokede.com',
    ...overrides,
  } as PublicSettings
  vi.spyOn(appStore, 'fetchPublicSettings').mockResolvedValue(appStore.cachedPublicSettings)

  const i18n = createI18n({
    legacy: false,
    locale: 'zh',
    messages: { zh: {} },
  })

  return mount(UsageGuideView, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        AppLayout: { template: '<div><slot /></div>' },
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

describe('UsageGuideView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the beginner guide and default endpoint in request examples', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('5 分钟完成首次配置')
    expect(wrapper.find('#endpoints').findAll('article')).toHaveLength(1)
    expect(wrapper.find('pre').text()).toContain('https://aokede.com/v1/chat/completions')
  })

  it('updates all generated examples when a configured custom endpoint is selected', async () => {
    const wrapper = mountView({
      custom_endpoints: [{
        name: '专线备用端点',
        endpoint: 'https://regional-backup.example.com',
        description: '备用线路',
      }],
    })
    const backupButton = wrapper.findAll('button').find((button) => button.text().trim() === '使用此端点')

    expect(backupButton).toBeDefined()
    await backupButton?.trigger('click')

    expect(wrapper.text()).toContain('专线备用端点')
    expect(wrapper.find('pre').text()).toContain('https://regional-backup.example.com/v1/chat/completions')
  })

  it('searches all software categories by software name', async () => {
    const wrapper = mountView()
    await wrapper.find('input[type="search"]').setValue('Codex')
    await flushPromises()

    expect(wrapper.findAll('.guide-details')).toHaveLength(1)
    expect(wrapper.text()).toContain('Codex CLI')
  })
})
