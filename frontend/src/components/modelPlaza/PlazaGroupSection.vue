<template>
  <section class="group-section" :style="accentStyle">
    <header class="group-section-header">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <GroupBadge
            :name="group.name"
            :platform="group.platform as GroupPlatform"
            :subscription-type="(group.subscription_type || 'standard') as SubscriptionType"
            :rate-multiplier="group.rate_multiplier"
            :user-rate-multiplier="group.user_rate_multiplier ?? null"
            :peak-rate-enabled="group.peak_rate_enabled"
            :peak-start="group.peak_start"
            :peak-end="group.peak_end"
            :peak-rate-multiplier="group.peak_rate_multiplier"
            always-show-rate
          />
          <span
            v-if="group.is_exclusive"
            class="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
          >
            <Icon name="shield" size="xs" class="h-3 w-3" />
            {{ t('modelPlaza.badges.exclusive') }}
          </span>
          <span
            v-if="group.subscription_type === 'subscription'"
            class="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
          >
            {{ t('modelPlaza.badges.subscription') }}
          </span>
        </div>
        <p v-if="group.description" class="mt-2 text-sm text-gray-600 dark:text-dark-300">
          {{ group.description }}
        </p>
        <p
          v-if="peakNote"
          class="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400"
        >
          <Icon name="clock" size="xs" class="h-3 w-3" />
          {{ peakNote }}
        </p>
      </div>
      <span class="group-model-count">
        {{ t('modelPlaza.card.modelCount', { count: displayModels.length }) }}
      </span>
    </header>

    <div v-if="sortedModels.length" class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      <PlazaModelCard v-for="model in sortedModels" :key="`${model.platform}:${model.name}`" :model="model" :group="group" />
    </div>
    <p v-else class="border border-dashed border-gray-300 px-5 py-8 text-center text-sm text-gray-400 dark:border-dark-600 dark:text-dark-500">
      {{ t('modelPlaza.detail.noModels') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import GroupBadge from '@/components/common/GroupBadge.vue'
import PlazaModelCard from './PlazaModelCard.vue'
import type { ModelPlazaGroup, PlazaModel } from '@/api/modelPlaza'
import type { GroupPlatform, SubscriptionType } from '@/types'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import { useAppStore } from '@/stores/app'
import { platformAccentColor } from '@/utils/platformColors'

const props = defineProps<{
  group: ModelPlazaGroup
  models?: PlazaModel[]
}>()

const { t } = useI18n()
const appStore = useAppStore()
const displayModels = computed(() => props.models ?? props.group.models)
const accentStyle = computed(() => ({ '--group-accent': platformAccentColor(props.group.platform) }))

const peakNote = computed(() => {
  if (!hasPeakRate(props.group)) return ''
  const window = formatPeakRateWindow(
    props.group,
    serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset)
  )
  return t('modelPlaza.detail.peakNote', {
    window,
    multiplier: props.group.peak_rate_multiplier
  })
})

const sortedModels = computed(() => {
  return [...displayModels.value].sort((a, b) => {
    const tokenA = billingMode(a) === 'token'
    const tokenB = billingMode(b) === 'token'
    if (tokenA !== tokenB) return tokenA ? -1 : 1
    const priceA = a.official_pricing?.output_price ?? null
    const priceB = b.official_pricing?.output_price ?? null
    if (priceA != null && priceB != null && priceA !== priceB) return priceB - priceA
    if (priceA != null && priceB == null) return -1
    if (priceA == null && priceB != null) return 1
    return b.name.localeCompare(a.name)
  })
})

function billingMode(model: PlazaModel): string {
  return model.pricing?.billing_mode || 'token'
}
</script>

<style scoped>
.group-section {
  position: relative;
}

.group-section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--group-accent) 7%, rgb(255 255 255));
  padding: 1rem 1.125rem;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--group-accent) 12%, transparent);
}

.group-model-count {
  flex: 0 0 auto;
  border-radius: 999px;
  background: color-mix(in srgb, var(--group-accent) 12%, rgb(255 255 255));
  padding: 0.3rem 0.625rem;
  color: rgb(75 85 99);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1rem;
}

.dark .group-section-header {
  background: color-mix(in srgb, var(--group-accent) 13%, rgb(31 41 55));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--group-accent) 20%, transparent);
}

.dark .group-model-count {
  background: color-mix(in srgb, var(--group-accent) 18%, rgb(17 24 39));
  color: rgb(209 213 219);
}
</style>
