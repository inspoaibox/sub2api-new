import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ModelPlazaContent from '../ModelPlazaContent.vue'
import type { ModelPlazaGroup, ModelPlazaResponse, PlazaModel } from '@/api/modelPlaza'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key })
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isAuthenticated: false })
}))

function model(name: string, capabilities?: PlazaModel['capabilities']): PlazaModel {
  return {
    name,
    platform: 'openai',
    pricing: null,
    official_pricing: null,
    ...(capabilities ? { capabilities } : {})
  }
}

function group(models: PlazaModel[]): ModelPlazaGroup {
  return {
    id: 1,
    name: 'Standard',
    description: '',
    platform: 'openai',
    subscription_type: 'standard',
    rate_multiplier: 1,
    peak_rate_enabled: false,
    peak_start: '',
    peak_end: '',
    peak_rate_multiplier: 1,
    is_exclusive: false,
    image_rate_independent: false,
    image_rate_multiplier: 1,
    models
  }
}

function mountContent(response: ModelPlazaResponse) {
  return mount(ModelPlazaContent, {
    props: { response, loading: false },
    global: {
      stubs: {
        PlazaGroupSection: {
          props: ['group', 'models'],
          setup(props) {
            return () => h(
              'div',
              { class: 'visible-models' },
              (props.models ?? props.group.models).map((model: PlazaModel) => model.name).join(',')
            )
          }
        },
        Icon: { template: '<svg />' }
      }
    }
  })
}

describe('ModelPlazaContent capabilities', () => {
  it('shows counts and filters cards by the selected capability', async () => {
    const wrapper = mountContent({
      description: '',
      groups: [group([
        model('gpt-5', ['chat']),
        model('gpt-image-2', ['image']),
        model('sora-2', ['video']),
        model('text-embedding-3-large', ['embedding'])
      ])]
    })

    expect(wrapper.get('[data-capability="chat"]').text()).toContain('1')
    expect(wrapper.get('[data-capability="image"]').text()).toContain('1')
    expect(wrapper.find('.visible-models').text()).toBe('gpt-5')
    expect(wrapper.text()).toContain('4')

    await wrapper.get('[data-capability="image"]').trigger('click')

    expect(wrapper.find('.visible-models').text()).toBe('gpt-image-2')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.get('[data-capability="image"]').attributes('aria-selected')).toBe('true')
  })

  it('treats responses without capabilities as chat models', () => {
    const wrapper = mountContent({
      description: '',
      groups: [group([model('legacy-model')])]
    })

    expect(wrapper.get('[data-capability="chat"]').text()).toContain('1')
    expect(wrapper.find('.visible-models').text()).toBe('legacy-model')
  })

  it('recognizes image models when an older backend omits capabilities', async () => {
    const legacyImage = model('gpt-image-2')
    legacyImage.pricing = {
      billing_mode: 'per_request',
      input_price: 5e-6,
      output_price: 1e-5,
      cache_write_price: null,
      cache_read_price: null,
      image_input_price: 8e-6,
      image_output_price: 3e-5,
      per_request_price: 0.2,
      intervals: []
    }
    const wrapper = mountContent({ description: '', groups: [group([legacyImage])] })

    expect(wrapper.get('[data-capability="image"]').text()).toContain('1')
    expect(wrapper.find('.visible-models').exists()).toBe(false)

    await wrapper.get('[data-capability="image"]').trigger('click')

    expect(wrapper.find('.visible-models').text()).toBe('gpt-image-2')
  })
})
