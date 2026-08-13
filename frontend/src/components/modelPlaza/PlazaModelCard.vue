<template>
  <article
    class="model-card relative flex min-h-[238px] flex-col overflow-hidden border-0 bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5 transition-colors dark:bg-dark-800/75 dark:ring-white/5"
    :class="platformBorderStrongClass(model.platform || group.platform)"
    :style="accentStyle"
  >
    <span class="model-card-accent" aria-hidden="true"></span>
    <header class="flex min-w-0 items-start gap-3 pt-1">
      <div class="model-card-icon flex h-10 w-10 shrink-0 items-center justify-center border dark:border-dark-700">
        <ModelIcon :model="model.name" size="22px" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="break-words text-sm font-semibold text-gray-900 dark:text-white">{{ model.name }}</h3>
        <div class="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            class="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
            :class="platformBadgeLightClass(model.platform || group.platform)"
          >
            {{ platformLabel(model.platform || group.platform) }}
          </span>
          <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-dark-700 dark:text-dark-300">
            {{ billingModeLabel }}
          </span>
        </div>
      </div>
    </header>

    <div v-if="hasPricing" class="mt-5">
      <p class="text-xs font-medium text-gray-500 dark:text-dark-400">{{ t('modelPlaza.card.yourPrice') }}</p>

      <div v-if="isTokenBilling" class="mt-2 grid grid-cols-2 gap-2">
        <div class="price-cell">
          <span>{{ t('modelPlaza.table.input') }}</span>
          <strong>{{ paidPerMillion(primaryTokenPrice?.input_price) }}</strong>
          <small>{{ t('modelPlaza.table.unitPerMillion') }}</small>
        </div>
        <div class="price-cell">
          <span>{{ t('modelPlaza.table.output') }}</span>
          <strong>{{ paidPerMillion(primaryTokenPrice?.output_price) }}</strong>
          <small>{{ t('modelPlaza.table.unitPerMillion') }}</small>
        </div>
      </div>

      <div v-else-if="requestIntervals.length" class="mt-2 flex flex-wrap gap-2">
        <div v-for="(interval, index) in requestIntervals" :key="index" class="request-price">
          <span>{{ tierLabel(interval) }}</span>
          <strong>{{ paidRequestPrice(interval.per_request_price) }}{{ perUnitSuffix }}</strong>
        </div>
      </div>

      <div v-else class="mt-2 flex items-end justify-between gap-3 border-b border-gray-100 pb-3 dark:border-dark-700">
        <strong class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ paidRequestPrice(model.pricing?.per_request_price) }}<small class="ml-1 text-xs font-normal text-gray-500 dark:text-dark-400">{{ perUnitSuffix }}</small>
        </strong>
      </div>

      <p v-if="tokenIntervals.length > 1" class="mt-2 text-xs text-gray-500 dark:text-dark-400">
        {{ t('modelPlaza.card.tieredPrice', { tier: tierLabel(tokenIntervals[0]) }) }}
      </p>
    </div>
    <div v-else class="mt-5 flex flex-1 items-center text-sm text-gray-400 dark:text-dark-500">
      {{ t('modelPlaza.detail.noPricing') }}
    </div>

    <footer class="mt-auto pt-4">
      <div class="model-card-footer flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-dark-400">
        <span>{{ t('modelPlaza.card.group', { name: group.name }) }}</span>
        <span class="font-mono font-semibold" :class="platformTextClass(group.platform)">{{ displayRate }}x</span>
      </div>

      <details v-if="hasPricing" class="mt-3 border-t border-gray-100 pt-3 dark:border-dark-700">
        <summary class="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-gray-600 marker:content-none hover:text-gray-900 dark:text-dark-300 dark:hover:text-white">
          {{ t('modelPlaza.card.pricingDetails') }}
          <Icon name="chevronDown" size="xs" class="details-chevron h-3.5 w-3.5" />
        </summary>

        <div class="mt-3 space-y-3 text-xs text-gray-600 dark:text-dark-300">
          <div v-if="isTokenBilling" class="space-y-2">
            <div v-for="(interval, index) in tokenPriceRows" :key="index" class="detail-row">
              <span v-if="tokenIntervals.length" class="col-span-2 font-medium text-gray-700 dark:text-dark-200">{{ tierLabel(interval) }}</span>
              <span>{{ t('modelPlaza.table.input') }}</span>
              <strong>{{ paidPerMillion(interval.input_price) }}</strong>
              <span>{{ t('modelPlaza.table.output') }}</span>
              <strong>{{ paidPerMillion(interval.output_price) }}</strong>
            </div>
            <div v-if="hasCachePricing" class="detail-row">
              <span>{{ t('modelPlaza.table.cacheWrite') }}</span>
              <strong>{{ paidPerMillion(model.pricing?.cache_write_price) }}</strong>
              <span>{{ t('modelPlaza.table.cacheRead') }}</span>
              <strong>{{ paidPerMillion(model.pricing?.cache_read_price) }}</strong>
            </div>
          </div>

          <div v-if="hasOfficialPricing" class="border-t border-gray-100 pt-3 dark:border-dark-700">
            <p class="mb-2 font-medium text-gray-500 dark:text-dark-400">{{ t('modelPlaza.card.officialReference') }}</p>
            <div class="detail-row">
              <span>{{ t('modelPlaza.table.input') }}</span>
              <strong>{{ officialPerMillion(model.official_pricing?.input_price) }}</strong>
              <span>{{ t('modelPlaza.table.output') }}</span>
              <strong>{{ officialPerMillion(model.official_pricing?.output_price) }}</strong>
            </div>
          </div>
        </div>
      </details>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import ModelIcon from '@/components/common/ModelIcon.vue'
import type { ModelPlazaGroup, PlazaModel } from '@/api/modelPlaza'
import type { UserPricingInterval } from '@/api/channels'
import { BILLING_MODE_IMAGE, BILLING_MODE_TOKEN, type BillingMode } from '@/constants/channel'
import { formatScaled } from '@/utils/pricing'
import {
  platformAccentColor,
  platformBadgeLightClass,
  platformBorderStrongClass,
  platformLabel,
  platformTextClass
} from '@/utils/platformColors'

const props = defineProps<{
  model: PlazaModel
  group: ModelPlazaGroup
}>()

const { t } = useI18n()
const PER_MILLION = 1_000_000
const MIN_DECIMALS = 2

const billingMode = computed<BillingMode>(() =>
  (props.model.pricing?.billing_mode || BILLING_MODE_TOKEN) as BillingMode
)
const isTokenBilling = computed(() => billingMode.value === BILLING_MODE_TOKEN)
const hasPricing = computed(() => props.model.pricing != null)
const effectiveRate = computed(() => props.group.user_rate_multiplier ?? props.group.rate_multiplier)
const usesIndependentImageRate = computed(
  () => billingMode.value === BILLING_MODE_IMAGE && props.group.image_rate_independent
)
const requestRate = computed(() =>
  usesIndependentImageRate.value ? props.group.image_rate_multiplier || 1 : effectiveRate.value
)
const displayRate = computed(() => requestRate.value)
const tokenIntervals = computed(() => props.model.pricing?.intervals ?? [])
const requestIntervals = computed(() =>
  (props.model.pricing?.intervals ?? []).filter((interval) => interval.per_request_price != null)
)
const primaryTokenPrice = computed(() => tokenIntervals.value[0] ?? props.model.pricing)
const tokenPriceRows = computed<UserPricingInterval[]>(() =>
  tokenIntervals.value.length
    ? tokenIntervals.value
    : [{
        min_tokens: 0,
        max_tokens: null,
        input_price: props.model.pricing?.input_price ?? null,
        output_price: props.model.pricing?.output_price ?? null,
        cache_write_price: null,
        cache_read_price: null,
        per_request_price: null
      }]
)
const hasCachePricing = computed(
  () => props.model.pricing?.cache_write_price != null || props.model.pricing?.cache_read_price != null
)
const hasOfficialPricing = computed(
  () => props.model.official_pricing?.input_price != null || props.model.official_pricing?.output_price != null
)
const billingModeLabel = computed(() => {
  if (billingMode.value === BILLING_MODE_IMAGE) return t('modelPlaza.table.perImage')
  if (billingMode.value !== BILLING_MODE_TOKEN) return t('modelPlaza.table.perRequest')
  return t('modelPlaza.card.tokenBilling')
})
const perUnitSuffix = computed(() =>
  billingMode.value === BILLING_MODE_IMAGE
    ? t('modelPlaza.table.perUnitImage')
    : t('modelPlaza.table.perUnitRequest')
)
const accentStyle = computed(() => ({ '--model-accent': platformAccentColor(props.model.platform || props.group.platform) }))

function paidPerMillion(value: number | null | undefined): string {
  if (value == null) return '-'
  return formatScaled(value * effectiveRate.value, PER_MILLION, MIN_DECIMALS)
}

function paidRequestPrice(value: number | null | undefined): string {
  if (value == null) return '-'
  return formatScaled(value * requestRate.value, 1, MIN_DECIMALS)
}

function officialPerMillion(value: number | null | undefined): string {
  return formatScaled(value ?? null, PER_MILLION, MIN_DECIMALS)
}

function tierLabel(interval: UserPricingInterval): string {
  if (interval.tier_label) return interval.tier_label
  if (interval.max_tokens == null) return `>${formatTokenCount(interval.min_tokens)}`
  if (interval.min_tokens === 0) return `<=${formatTokenCount(interval.max_tokens)}`
  return `${formatTokenCount(interval.min_tokens)}-${formatTokenCount(interval.max_tokens)}`
}

function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return `${trimZero(value / 1_000_000)}M`
  if (value >= 1_000) return `${trimZero(value / 1_000)}K`
  return String(value)
}

function trimZero(value: number): string {
  return String(Math.round(value * 100) / 100)
}
</script>

<style scoped>
.model-card {
  border-radius: 1.5rem;
  transition: box-shadow 180ms ease-out, transform 180ms ease-out;
}

.model-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 32px -24px rgb(15 23 42 / 0.58), 0 0 0 1px color-mix(in srgb, var(--model-accent) 25%, transparent);
}

.model-card:focus-within {
  border-color: var(--model-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--model-accent) 16%, transparent);
}

.model-card-accent {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 4px;
  border-radius: 999px;
  margin: 0 1rem;
  background: var(--model-accent);
}

.model-card-icon {
  border: 0;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--model-accent) 10%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--model-accent) 13%, transparent);
}

.model-card-footer {
  border-top: 0;
  border-radius: 0.875rem;
  background: rgb(249 250 251 / 0.8);
  padding: 0.625rem 0.75rem;
}

.price-cell {
  border-radius: 1rem;
  background-color: color-mix(in srgb, var(--model-accent) 8%, rgb(249 250 251));
  padding: 0.625rem;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--model-accent) 10%, transparent);
}

.price-cell span,
.price-cell small {
  display: block;
  color: rgb(107 114 128);
  font-size: 0.6875rem;
  line-height: 1rem;
}

.price-cell strong {
  display: block;
  margin: 0.125rem 0;
  color: rgb(17 24 39);
  font-size: 1rem;
  line-height: 1.25rem;
}

.request-price {
  min-width: 7rem;
  flex: 1 1 0%;
  border-radius: 1rem;
  background-color: color-mix(in srgb, var(--model-accent) 8%, rgb(249 250 251));
  padding: 0.625rem;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--model-accent) 10%, transparent);
}

.request-price span,
.request-price strong {
  display: block;
}

.request-price span {
  color: rgb(107 114 128);
  font-size: 0.6875rem;
}

.request-price strong {
  margin-top: 0.125rem;
  color: rgb(17 24 39);
  font-size: 0.875rem;
}

.detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.375rem 0.75rem;
}

.detail-row strong {
  color: rgb(31 41 55);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
}

details[open] .details-chevron {
  transform: rotate(180deg);
}

.details-chevron {
  transition: transform 150ms ease;
}

.dark .price-cell span,
.dark .price-cell small,
.dark .request-price span {
  color: rgb(156 163 175);
}

.dark .price-cell strong,
.dark .request-price strong {
  color: rgb(243 244 246);
}

.dark .detail-row strong {
  color: rgb(229 231 235);
}

.dark .model-card-icon {
  background: color-mix(in srgb, var(--model-accent) 13%, rgb(31 41 55));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--model-accent) 23%, transparent);
}

.dark .model-card-footer {
  background: rgb(17 24 39 / 0.42);
}

.dark .model-card:hover {
  box-shadow: 0 18px 32px -24px rgb(0 0 0 / 0.9), 0 0 0 1px color-mix(in srgb, var(--model-accent) 30%, transparent);
}
</style>
