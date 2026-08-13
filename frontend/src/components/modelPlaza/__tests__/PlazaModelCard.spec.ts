import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlazaModelCard from '../PlazaModelCard.vue'
import type { ModelPlazaGroup, PlazaModel } from '@/api/modelPlaza'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, params?: Record<string, string | number>) =>
        params?.name ? `${key}:${params.name}` : params?.count ? `${params.count} ${key}` : key
    })
  }
})

function model(overrides: Partial<PlazaModel> = {}): PlazaModel {
  return {
    name: 'gpt-5',
    platform: 'openai',
    pricing: {
      billing_mode: 'token',
      input_price: 3e-6,
      output_price: 1.5e-5,
      cache_write_price: null,
      cache_read_price: null,
      image_input_price: null,
      image_output_price: null,
      per_request_price: null,
      intervals: []
    },
    official_pricing: {
      input_price: 3e-6,
      output_price: 1.5e-5,
      cache_write_price: null,
      cache_read_price: null
    },
    ...overrides
  }
}

function group(overrides: Partial<ModelPlazaGroup> = {}): ModelPlazaGroup {
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
    models: [],
    ...overrides
  }
}

describe('PlazaModelCard', () => {
  it('shows token prices scaled by the effective group rate', () => {
    const wrapper = mount(PlazaModelCard, {
      props: { model: model(), group: group({ rate_multiplier: 0.5 }) }
    })

    expect(wrapper.text()).toContain('$1.50')
    expect(wrapper.text()).toContain('$7.50')
    expect(wrapper.text()).toContain('0.5x')
  })

  it('uses the independent image rate for image prices', () => {
    const wrapper = mount(PlazaModelCard, {
      props: {
        model: model({
          name: 'gpt-image-2',
          pricing: {
            billing_mode: 'image',
            input_price: null,
            output_price: null,
            cache_write_price: null,
            cache_read_price: null,
            image_input_price: null,
            image_output_price: null,
            per_request_price: 0.02,
            intervals: []
          },
          official_pricing: null
        }),
        group: group({ rate_multiplier: 0.1, image_rate_independent: true, image_rate_multiplier: 1 })
      }
    })

    expect(wrapper.text()).toContain('$0.02')
    expect(wrapper.text()).not.toContain('$0.002')
    expect(wrapper.text()).toContain('1x')
  })
})
