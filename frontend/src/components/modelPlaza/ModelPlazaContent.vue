<template>
  <div class="plaza-content space-y-6">
    <section
      class="plaza-overview"
      :aria-labelledby="embedded ? undefined : 'model-plaza-title'"
      :aria-label="embedded ? t('modelPlaza.title') : undefined"
    >
      <div class="plaza-overview-copy">
        <div class="plaza-overview-icon" aria-hidden="true">
          <Icon name="grid" size="lg" />
        </div>
        <div>
          <h1 v-if="!embedded" id="model-plaza-title" class="text-xl font-semibold text-gray-950 dark:text-white sm:text-2xl">
            {{ t('modelPlaza.title') }}
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-dark-300">{{ t('modelPlaza.description') }}</p>
          <p
            v-if="!isAuthenticated"
            class="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-dark-400"
          >
            <Icon name="infoCircle" size="xs" class="h-3.5 w-3.5" />
            {{ t('modelPlaza.anonymousHint') }}
          </p>
        </div>
      </div>

      <dl class="plaza-stats">
        <div v-for="stat in plazaStats" :key="stat.label" class="plaza-stat">
          <dt>
            <Icon :name="stat.icon" size="sm" aria-hidden="true" />
            <span>{{ stat.label }}</span>
          </dt>
          <dd>{{ stat.value }}</dd>
        </div>
      </dl>
    </section>

    <!-- 全局价格说明(管理员配置,Markdown) -->
    <div
      v-if="descriptionHtml"
      class="plaza-description px-5 py-4 text-sm"
      v-html="descriptionHtml"
    ></div>

    <!-- 加载/错误/空 -->
    <div v-if="loading" class="flex min-h-[280px] items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-sm text-gray-500 dark:text-dark-400">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-600/25 border-t-primary-600 dark:border-primary-400/25 dark:border-t-primary-400"></div>
        <span>{{ t('modelPlaza.loading') }}</span>
      </div>
    </div>
    <div
      v-else-if="error"
      class="plaza-error px-5 py-8 text-center text-sm text-red-600 dark:text-red-300"
    >
      {{ t('modelPlaza.loadFailed') }}
    </div>
    <template v-else>
      <section class="capability-browser" :aria-label="t('modelPlaza.capabilities.label')">
        <div class="capability-tabs" role="tablist" :aria-label="t('modelPlaza.capabilities.label')">
          <button
            v-for="tab in capabilityTabs"
            :key="tab.id"
            :data-capability="tab.id"
            type="button"
            role="tab"
            :aria-selected="activeCapability === tab.id"
            class="capability-tab inline-flex min-h-10 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors"
            :class="activeCapability === tab.id
              ? 'capability-tab-active'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-dark-400 dark:hover:text-white'"
            @click="activeCapability = tab.id"
          >
            <Icon :name="tab.icon" size="sm" />
            <span>{{ t(tab.label) }}</span>
            <span
              class="capability-count"
              :class="activeCapability === tab.id
                ? 'bg-white/70 text-gray-900 dark:bg-dark-900/40 dark:text-white'
                : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-dark-400'"
            >
              {{ capabilityCounts[tab.id] }}
            </span>
          </button>
        </div>
      </section>

      <!-- 联动筛选:平台 -> 分组 -> 倍率，选择分组时同步所属平台和倍率。 -->
      <section class="plaza-filter-region">
        <div class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-dark-200">
            <Icon name="filter" size="sm" />
          </span>
          <span>{{ t('modelPlaza.filters.title') }}</span>
        </div>
        <PlazaFilterBar
          :platforms="platforms"
          :groups="groupOptions"
          :rates="rates"
          :platform="filters.platform"
          :group-id="filters.groupId"
          :rate="filters.rate"
          :search="filters.search"
          @update:filters="filters = $event"
        />
      </section>

      <div class="plaza-results-meta">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-dark-400">{{ t('modelPlaza.stats.showing') }}</p>
          <p class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
            {{ t(capabilityTabs.find((tab) => tab.id === activeCapability)?.label || 'modelPlaza.capabilities.chat') }}
          </p>
        </div>
        <span class="plaza-results-count">{{ visibleModelCount }}</span>
      </div>

      <!-- 分组分节的模型清单(默认按生效倍率升序) -->
      <div v-if="filteredGroupEntries.length > 0" class="space-y-7">
        <PlazaGroupSection
          v-for="entry in filteredGroupEntries"
          :key="entry.group.id"
          :group="entry.group"
          :models="entry.models"
        />
      </div>
      <div
        v-else
        class="plaza-empty px-5 py-12 text-center text-sm text-gray-500 dark:text-dark-400"
      >
        {{ emptyMessage }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Icon from '@/components/icons/Icon.vue'
import PlazaFilterBar from './PlazaFilterBar.vue'
import PlazaGroupSection from './PlazaGroupSection.vue'
import {
  PLAZA_MODEL_CAPABILITIES,
  type ModelPlazaGroup,
  type ModelPlazaResponse,
  type PlazaModel,
  type PlazaModelCapability
} from '@/api/modelPlaza'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  response: ModelPlazaResponse | null
  loading: boolean
  error?: boolean
  /** 后台内嵌形态(AppLayout 内):隐藏页头。 */
  embedded?: boolean
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

interface PlazaFilterState {
  platform: string
  groupId: number | 'all'
  rate: number | 'all'
  search: string
}

const filters = ref<PlazaFilterState>({
  platform: 'all',
  groupId: 'all',
  rate: 'all',
  search: ''
})
const activeCapability = ref<PlazaModelCapability>('chat')

const capabilityTabs: Array<{ id: PlazaModelCapability; label: string; icon: 'chat' | 'sparkles' | 'play' | 'cube' }> = [
  { id: 'chat', label: 'modelPlaza.capabilities.chat', icon: 'chat' },
  { id: 'image', label: 'modelPlaza.capabilities.image', icon: 'sparkles' },
  { id: 'video', label: 'modelPlaza.capabilities.video', icon: 'play' },
  { id: 'embedding', label: 'modelPlaza.capabilities.embedding', icon: 'cube' }
]

const searchActive = computed(() => filters.value.search.trim() !== '')

const capabilityCounts = computed<Record<PlazaModelCapability, number>>(() => {
  const counts: Record<PlazaModelCapability, number> = { chat: 0, image: 0, video: 0, embedding: 0 }
  for (const group of props.response?.groups ?? []) {
    for (const model of group.models) {
      for (const capability of modelCapabilities(model)) {
        counts[capability] += 1
      }
    }
  }
  return counts
})

const totalModelCount = computed(() => {
  const keys = new Set<string>()
  for (const group of props.response?.groups ?? []) {
    for (const model of group.models) {
      keys.add(`${model.platform}:${model.name}`)
    }
  }
  return keys.size
})

const visibleModelCount = computed(() =>
  filteredGroupEntries.value.reduce((count, entry) => count + entry.models.length, 0)
)

const plazaStats = computed(() => [
  { label: t('modelPlaza.stats.models'), value: totalModelCount.value, icon: 'cube' as const },
  { label: t('modelPlaza.stats.groups'), value: groupOptions.value.length, icon: 'users' as const },
  { label: t('modelPlaza.stats.platforms'), value: platforms.value.length, icon: 'globe' as const },
  { label: t('modelPlaza.stats.showing'), value: visibleModelCount.value, icon: 'eye' as const }
])

const hasAnyModels = computed(() => (props.response?.groups ?? []).some((group) => group.models.length > 0))

const emptyMessage = computed(() => {
  if (!hasAnyModels.value) return t('modelPlaza.empty')
  return searchActive.value ? t('modelPlaza.noSearchResult') : t('modelPlaza.capabilities.empty')
})

const descriptionHtml = computed(() => {
  const md = props.response?.description?.trim()
  if (!md) return ''
  return DOMPurify.sanitize(marked.parse(md) as string)
})

/** 生效倍率 = 用户专属倍率 ?? 分组默认倍率。 */
function effectiveRate(g: ModelPlazaGroup): number {
  return g.user_rate_multiplier ?? g.rate_multiplier
}

const platforms = computed(() =>
  [...new Set((props.response?.groups ?? []).map((g) => g.platform).filter(Boolean))].sort()
)

const groupOptions = computed(() =>
  (props.response?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    platform: g.platform,
    rate: effectiveRate(g)
  }))
)

/** 全量生效倍率;当前组合下不可用的项由 FilterBar 置灰而非隐藏。 */
const rates = computed(() =>
  [...new Set((props.response?.groups ?? []).map(effectiveRate))].sort((a, b) => a - b)
)

/** 数据刷新后选中的倍率可能不复存在,重置为全部。 */
watch(rates, (list) => {
  if (filters.value.rate !== 'all' && !list.includes(filters.value.rate)) {
    filters.value = { ...filters.value, rate: 'all' }
  }
})

const filteredGroupEntries = computed(() => {
  let groups = props.response?.groups ?? []
  if (filters.value.platform !== 'all') {
    groups = groups.filter((g) => g.platform === filters.value.platform)
  }
  if (filters.value.groupId !== 'all') {
    groups = groups.filter((g) => g.id === filters.value.groupId)
  }
  if (filters.value.rate !== 'all') {
    groups = groups.filter((g) => effectiveRate(g) === filters.value.rate)
  }
  const q = filters.value.search.trim().toLowerCase()
  const entries = groups
    .map((group) => ({
      group,
      models: group.models.filter(
        (m) => modelCapabilities(m).includes(activeCapability.value) && (!q || m.name.toLowerCase().includes(q))
      )
    }))
    .filter((entry) => entry.models.length > 0)
  return entries.sort(
    (a, b) => effectiveRate(a.group) - effectiveRate(b.group) || a.group.name.localeCompare(b.group.name)
  )
})

function modelCapabilities(model: PlazaModel): PlazaModelCapability[] {
  const capabilities = model.capabilities?.filter((capability): capability is PlazaModelCapability =>
    (PLAZA_MODEL_CAPABILITIES as readonly string[]).includes(capability)
  )
  if (capabilities?.length) return capabilities

  const billingMode = model.pricing?.billing_mode as string | undefined
  if (billingMode === 'image' || model.pricing?.image_output_price != null) return ['image']
  if (billingMode === 'video') return ['video']

  const name = model.name.toLowerCase()
  if (nameIncludesAny(name, ['embedding', 'embed', 'rerank'])) return ['embedding']
  if (nameIncludesAny(name, [
    'gpt-image', 'dall-e', 'dalle', 'imagen', 'cogview', 'flux', 'midjourney',
    'seedream', 'kolors', 'stable-diffusion', 'stable_diffusion', 'ideogram'
  ])) return ['image']
  if (nameIncludesAny(name, [
    'sora', 'veo', 'cogvideo', 'runway', 'kling', 'luma', 'pika', 'wan-video',
    'hunyuan-video', 'seedance', 'minimax-video'
  ])) return ['video']
  return ['chat']
}

function nameIncludesAny(name: string, fragments: string[]): boolean {
  return fragments.some((fragment) => name.includes(fragment))
}
</script>

<style scoped>
.plaza-description {
  border-radius: 1.5rem;
  background: rgb(240 253 250 / 0.72);
  box-shadow: 0 12px 30px -24px rgb(13 148 136 / 0.5), 0 0 0 1px rgb(13 148 136 / 0.08);
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.plaza-overview {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1.5rem;
  border-radius: 1.75rem;
  background: rgb(255 255 255 / 0.86);
  padding: 1.5rem;
  box-shadow: 0 18px 38px -30px rgb(15 23 42 / 0.45), 0 0 0 1px rgb(15 23 42 / 0.055);
  backdrop-filter: blur(14px);
}

.plaza-overview-copy {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 0.875rem;
}

.plaza-overview-icon {
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: rgb(20 184 166);
  color: white;
  box-shadow: 0 10px 18px -10px rgb(13 148 136 / 0.7);
}

.plaza-stats {
  display: grid;
  min-width: min(100%, 28rem);
  grid-template-columns: repeat(4, minmax(4.5rem, 1fr));
  align-content: start;
  gap: 0.5rem;
}

.plaza-stat {
  min-width: 0;
  padding: 0.25rem 0.625rem;
}

.plaza-stat dt {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: rgb(107 114 128);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1rem;
  white-space: nowrap;
}

.plaza-stat dt :deep(svg) {
  height: 1.75rem;
  width: 1.75rem;
  border-radius: 0.75rem;
  background: rgb(240 253 250);
  padding: 0.375rem;
  color: rgb(13 148 136);
}

.plaza-stat dd {
  margin-top: 0.25rem;
  color: rgb(17 24 39);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.5rem;
}

.capability-browser {
  overflow-x: auto;
  border-bottom: 1px solid rgb(229 231 235);
}

.capability-tabs {
  display: flex;
  min-width: max-content;
  align-items: center;
  gap: 0.25rem;
}

.capability-tab {
  border-bottom: 2px solid transparent;
  transition: background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out;
}

.capability-tab-active {
  border-bottom-color: rgb(20 184 166);
  color: rgb(15 118 110);
}

.capability-count {
  min-width: 1.5rem;
  border-radius: 999px;
  padding: 0.125rem 0.375rem;
  text-align: center;
  font-size: 0.75rem;
  line-height: 1rem;
}

.plaza-filter-region {
  border-radius: 1.75rem;
  background: rgb(255 255 255 / 0.78);
  padding: 1.25rem;
  box-shadow: 0 16px 32px -28px rgb(15 23 42 / 0.55), 0 0 0 1px rgb(15 23 42 / 0.055);
  backdrop-filter: blur(12px);
}

.plaza-results-meta {
  display: flex;
  align-items: end;
  justify-content: space-between;
  padding: 0 0.25rem;
}

.plaza-results-count {
  display: inline-flex;
  min-width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(17 24 39);
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
}

.plaza-error,
.plaza-empty {
  border-radius: 1.75rem;
  background: rgb(255 255 255 / 0.82);
  box-shadow: 0 14px 32px -28px rgb(15 23 42 / 0.5), 0 0 0 1px rgb(15 23 42 / 0.055);
}

.plaza-error {
  background: rgb(254 242 242 / 0.9);
  box-shadow: 0 14px 32px -28px rgb(185 28 28 / 0.4), 0 0 0 1px rgb(239 68 68 / 0.12);
}

.plaza-description :deep(h1),
.plaza-description :deep(h2),
.plaza-description :deep(h3) {
  @apply mb-2 mt-3 font-semibold text-gray-900 first:mt-0 dark:text-white;
}

.plaza-description :deep(p) {
  @apply mb-2 text-gray-700 last:mb-0 dark:text-dark-200;
}

.plaza-description :deep(a) {
  @apply text-primary-600 underline underline-offset-4 hover:text-primary-700 dark:text-primary-300;
}

.plaza-description :deep(ul) {
  @apply mb-2 list-disc pl-5;
}

.plaza-description :deep(ol) {
  @apply mb-2 list-decimal pl-5;
}

.plaza-description :deep(li) {
  @apply mb-0.5 text-gray-700 dark:text-dark-200;
}

.plaza-description :deep(code) {
  @apply rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-dark-800;
}

.plaza-description :deep(blockquote) {
  @apply my-2 border-l-4 border-gray-300 pl-3 text-gray-600 dark:border-dark-600 dark:text-dark-300;
}

.dark .plaza-overview {
  background: rgb(31 41 55 / 0.78);
  box-shadow: 0 18px 38px -30px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(255 255 255 / 0.07);
}

.dark .plaza-description {
  background: rgb(20 184 166 / 0.1);
  box-shadow: 0 12px 30px -24px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(45 212 191 / 0.1);
}

.dark .plaza-stat dt {
  color: rgb(156 163 175);
}

.dark .plaza-stat dt :deep(svg) {
  background: rgb(20 184 166 / 0.14);
  color: rgb(94 234 212);
}

.dark .plaza-stat dd {
  color: rgb(243 244 246);
}

.dark .capability-browser {
  border-color: rgb(55 65 81);
}

.dark .capability-tab {
  background: transparent;
}

.dark .capability-tab-active {
  border-bottom-color: rgb(45 212 191);
  color: rgb(153 246 228);
}

.dark .plaza-filter-region {
  background: rgb(31 41 55 / 0.62);
  box-shadow: 0 16px 32px -28px rgb(0 0 0 / 0.9), 0 0 0 1px rgb(255 255 255 / 0.06);
}

.dark .plaza-results-count {
  background: rgb(229 231 235);
  color: rgb(17 24 39);
}

.dark .plaza-error,
.dark .plaza-empty {
  background: rgb(31 41 55 / 0.76);
  box-shadow: 0 14px 32px -28px rgb(0 0 0 / 0.9), 0 0 0 1px rgb(255 255 255 / 0.06);
}

.dark .plaza-error {
  background: rgb(127 29 29 / 0.18);
  box-shadow: 0 14px 32px -28px rgb(127 29 29 / 0.7), 0 0 0 1px rgb(248 113 113 / 0.12);
}

@media (max-width: 1023px) {
  .plaza-overview {
    flex-direction: column;
  }

  .plaza-stats {
    width: 100%;
    border-top: 1px solid rgb(229 231 235 / 0.8);
    padding-top: 1rem;
  }
}

@media (max-width: 639px) {
  .plaza-overview {
    padding: 1rem;
  }

  .plaza-overview-copy {
    gap: 0.75rem;
  }

  .plaza-overview-icon {
    height: 2.5rem;
    width: 2.5rem;
  }

  .plaza-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .plaza-stat {
    padding: 0.5rem 0.625rem;
  }

  .plaza-stat:nth-child(n + 3) {
    border-top: 1px solid rgb(229 231 235 / 0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .capability-tab,
  .model-card {
    transition: none;
  }
}
</style>
