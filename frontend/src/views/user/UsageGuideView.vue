<template>
  <AppLayout>
    <div class="mx-auto max-w-[1480px]">
      <header class="border-b border-gray-200 pb-8 dark:border-dark-700">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div class="max-w-3xl">
            <p class="mb-3 text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">
              {{ content.badge }}
            </p>
            <h2 class="text-3xl font-bold leading-tight text-gray-950 dark:text-white sm:text-4xl">
              {{ content.heading }}
            </h2>
            <p class="mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
              {{ content.lead }}
            </p>
          </div>

          <label class="relative block w-full xl:w-[380px]">
            <span class="sr-only">{{ content.searchLabel }}</span>
            <Icon
              name="search"
              size="sm"
              class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="searchQuery"
              type="search"
              class="input h-11 w-full pl-10"
              :placeholder="content.searchPlaceholder"
            />
          </label>
        </div>
      </header>

      <div class="mt-8 grid min-w-0 gap-10 lg:grid-cols-[210px_minmax(0,1fr)] xl:gap-14">
        <aside class="hidden lg:block">
          <nav class="sticky top-24 border-l border-gray-200 pl-4 dark:border-dark-700" :aria-label="content.searchLabel">
            <a
              v-for="item in content.toc"
              :key="item.id"
              :href="`#${item.id}`"
              class="block border-l-2 border-transparent py-2 pl-3 text-sm text-gray-500 transition-colors hover:border-primary-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {{ item.label }}
            </a>
          </nav>
        </aside>

        <main class="min-w-0 space-y-16">
          <section id="quick-start" class="guide-anchor">
            <SectionHeading :title="content.quickStart.title" :description="content.quickStart.description" />
            <ol class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <li
                v-for="(step, index) in content.quickStart.steps"
                :key="step.title"
                class="relative min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-800"
              >
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {{ index + 1 }}
                </span>
                <h3 class="mt-4 text-base font-semibold text-gray-950 dark:text-white">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{{ step.description }}</p>
                <router-link
                  v-if="step.action && step.to"
                  :to="step.to"
                  class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {{ step.action }}
                  <Icon name="chevronRight" size="xs" />
                </router-link>
              </li>
            </ol>
          </section>

          <section id="essentials" class="guide-anchor">
            <SectionHeading :title="content.essentials.title" :description="content.essentials.description" />
            <dl class="mt-6 divide-y divide-gray-200 border-y border-gray-200 dark:divide-dark-700 dark:border-dark-700">
              <div
                v-for="item in content.essentials.items"
                :key="item.term"
                class="grid gap-2 py-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6"
              >
                <dt class="font-semibold text-gray-950 dark:text-white">{{ item.term }}</dt>
                <dd class="text-sm leading-6 text-gray-600 dark:text-gray-300">{{ item.description }}</dd>
              </div>
            </dl>
          </section>

          <section id="endpoints" class="guide-anchor">
            <SectionHeading :title="content.endpoints.title" :description="content.endpoints.description" />

            <div class="mt-6 grid gap-4 xl:grid-cols-2">
              <article
                v-for="endpoint in endpointOptions"
                :key="endpoint.id"
                class="rounded-lg border bg-white p-5 transition-colors dark:bg-dark-800"
                :class="selectedEndpoint === endpoint.id
                  ? 'border-primary-400 ring-2 ring-primary-500/10 dark:border-primary-500'
                  : 'border-gray-200 dark:border-dark-700'"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 class="font-semibold text-gray-950 dark:text-white">{{ endpoint.label }}</h3>
                    <p class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ endpoint.hint }}</p>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="selectedEndpoint === endpoint.id ? 'btn-primary' : 'btn-secondary'"
                    :aria-pressed="selectedEndpoint === endpoint.id"
                    @click="selectedEndpoint = endpoint.id"
                  >
                    <Icon :name="selectedEndpoint === endpoint.id ? 'check' : 'link'" size="xs" class="mr-1.5" />
                    {{ selectedEndpoint === endpoint.id ? endpointSelectedLabel : endpointUseLabel }}
                  </button>
                </div>

                <div class="mt-5 divide-y divide-gray-100 border-y border-gray-100 dark:divide-dark-700 dark:border-dark-700">
                  <div v-for="value in endpoint.values" :key="value.label" class="py-3">
                    <div class="mb-1.5 flex items-center justify-between gap-3">
                      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ value.label }}</span>
                      <button
                        type="button"
                        class="btn-ghost btn-icon h-7 w-7"
                        :title="content.copy"
                        :aria-label="content.copy"
                        @click="copyText(`endpoint-${endpoint.id}-${value.kind}`, value.value)"
                      >
                        <Icon :name="copiedId === `endpoint-${endpoint.id}-${value.kind}` ? 'check' : 'copy'" size="xs" />
                      </button>
                    </div>
                    <code class="block break-all font-mono text-sm text-gray-800 dark:text-gray-200">{{ value.value }}</code>
                  </div>
                </div>
              </article>
            </div>
            <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">{{ content.exactValue }}</p>
          </section>

          <section id="first-request" class="guide-anchor">
            <SectionHeading :title="content.firstRequest.title" :description="content.firstRequest.description" />

            <div class="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
              <div class="min-w-0">
                <h3 class="mb-3 text-sm font-semibold text-gray-950 dark:text-white">{{ content.firstRequest.requestTitle }}</h3>
                <div class="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                  <div class="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                    <span class="font-mono text-xs text-slate-400">cURL</span>
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                      :title="content.copy"
                      :aria-label="content.copy"
                      @click="copyText('first-request', firstRequestCode)"
                    >
                      <Icon :name="copiedId === 'first-request' ? 'check' : 'copy'" size="sm" />
                    </button>
                  </div>
                  <pre class="max-h-[420px] overflow-auto p-4 text-xs leading-6 text-slate-200"><code>{{ firstRequestCode }}</code></pre>
                </div>
              </div>

              <div class="space-y-7">
                <div>
                  <h3 class="text-sm font-semibold text-gray-950 dark:text-white">{{ content.firstRequest.beforeTitle }}</h3>
                  <ul class="mt-3 space-y-3">
                    <li v-for="item in content.firstRequest.checklist" :key="item" class="flex gap-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      <span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-amber-500"></span>
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-950 dark:text-white">{{ content.firstRequest.successTitle }}</h3>
                  <ul class="mt-3 space-y-3">
                    <li v-for="item in content.firstRequest.successItems" :key="item" class="flex gap-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      <Icon name="checkCircle" size="sm" class="mt-1 flex-none text-emerald-500" />
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="software" class="guide-anchor">
            <SectionHeading :title="content.software.title" :description="content.software.description" />

            <div class="mt-6 flex max-w-full gap-1 overflow-x-auto border-b border-gray-200 dark:border-dark-700" role="tablist">
              <button
                v-for="category in content.software.categories"
                :key="category.id"
                type="button"
                role="tab"
                class="min-h-10 flex-none border-b-2 px-4 py-2 text-sm font-medium transition-colors"
                :class="activeCategory === category.id
                  ? 'border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
                :aria-selected="activeCategory === category.id"
                @click="selectCategory(category.id)"
              >
                {{ category.label }}
              </button>
            </div>

            <div v-if="filteredGuides.length" class="mt-5 space-y-3">
              <details
                v-for="(guide, index) in filteredGuides"
                :key="guide.id"
                class="guide-details overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-800"
                :open="index === 0"
              >
                <summary class="guide-summary flex cursor-pointer list-none items-start justify-between gap-4 p-5">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-base font-semibold text-gray-950 dark:text-white">{{ guide.name }}</h3>
                      <span
                        v-for="badge in guide.badges"
                        :key="badge"
                        class="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-300"
                      >
                        {{ badge }}
                      </span>
                    </div>
                    <p class="mt-1.5 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ guide.summary }}</p>
                  </div>
                  <Icon name="chevronDown" size="sm" class="guide-chevron mt-1 flex-none text-gray-400 transition-transform" />
                </summary>

                <div class="border-t border-gray-100 px-5 pb-6 pt-5 dark:border-dark-700">
                  <div v-if="guide.fields?.length" class="mb-7">
                    <h4 class="text-sm font-semibold text-gray-950 dark:text-white">{{ content.software.fieldTitle }}</h4>
                    <dl class="mt-3 divide-y divide-gray-100 border-y border-gray-100 dark:divide-dark-700 dark:border-dark-700">
                      <div v-for="field in guide.fields" :key="field.label" class="grid gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-5">
                        <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</dt>
                        <dd class="flex min-w-0 items-start justify-between gap-3">
                          <code class="min-w-0 break-all font-mono text-sm text-gray-800 dark:text-gray-200">{{ resolveFieldValue(field) }}</code>
                          <button
                            type="button"
                            class="btn-ghost btn-icon h-7 w-7 flex-none"
                            :title="content.copy"
                            :aria-label="content.copy"
                            @click="copyText(`field-${guide.id}-${field.label}`, resolveFieldValue(field))"
                          >
                            <Icon :name="copiedId === `field-${guide.id}-${field.label}` ? 'check' : 'copy'" size="xs" />
                          </button>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 class="text-sm font-semibold text-gray-950 dark:text-white">{{ content.software.stepsTitle }}</h4>
                    <ol class="mt-3 space-y-3">
                      <li v-for="(step, stepIndex) in guide.steps" :key="step" class="grid grid-cols-[24px_minmax(0,1fr)] gap-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                          {{ stepIndex + 1 }}
                        </span>
                        <span>{{ step }}</span>
                      </li>
                    </ol>
                  </div>

                  <div v-if="guide.snippets?.length" class="mt-7 grid gap-4 2xl:grid-cols-2">
                    <div v-for="snippet in guide.snippets" :key="snippet.id" class="min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                      <div class="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                        <span class="font-mono text-xs text-slate-400">{{ snippet.label }}</span>
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                          :title="content.copy"
                          :aria-label="content.copy"
                          @click="copyText(`snippet-${guide.id}-${snippet.id}`, resolveTemplate(snippet.code))"
                        >
                          <Icon :name="copiedId === `snippet-${guide.id}-${snippet.id}` ? 'check' : 'copy'" size="sm" />
                        </button>
                      </div>
                      <pre class="max-h-[420px] overflow-auto p-4 text-xs leading-6 text-slate-200"><code>{{ resolveTemplate(snippet.code) }}</code></pre>
                    </div>
                  </div>

                  <div v-if="guide.notes?.length" class="mt-7 border-l-2 border-amber-400 pl-4">
                    <h4 class="text-sm font-semibold text-gray-950 dark:text-white">{{ content.software.notesTitle }}</h4>
                    <ul class="mt-2 space-y-1.5 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      <li v-for="note in guide.notes" :key="note">{{ note }}</li>
                    </ul>
                  </div>
                </div>
              </details>
            </div>

            <div v-else class="mt-5 rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-dark-600 dark:text-gray-400">
              {{ content.noResults }}
            </div>
          </section>

          <section id="troubleshooting" class="guide-anchor">
            <SectionHeading :title="content.troubleshooting.title" :description="content.troubleshooting.description" />
            <div class="mt-6 divide-y divide-gray-200 border-y border-gray-200 dark:divide-dark-700 dark:border-dark-700">
              <article
                v-for="item in filteredTroubleshooting"
                :key="item.symptom"
                class="grid gap-4 py-5 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-7"
              >
                <div>
                  <p class="text-xs font-medium text-gray-400">{{ content.troubleshooting.symptomLabel }}</p>
                  <p class="mt-1 break-words font-mono text-sm font-semibold text-gray-950 dark:text-white">{{ item.symptom }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-400">{{ content.troubleshooting.causeLabel }}</p>
                  <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{{ item.cause }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-400">{{ content.troubleshooting.solutionLabel }}</p>
                  <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{{ item.solution }}</p>
                </div>
              </article>
            </div>
          </section>

          <section id="security" class="guide-anchor pb-10">
            <SectionHeading :title="content.security.title" :description="content.security.description" />
            <ul class="mt-6 grid gap-4 md:grid-cols-2">
              <li
                v-for="item in content.security.items"
                :key="item"
                class="flex gap-3 rounded-lg border border-gray-200 bg-white p-5 text-sm leading-6 text-gray-600 shadow-sm dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300"
              >
                <Icon name="shield" size="sm" class="mt-1 flex-none text-emerald-500" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'
import { useClipboard } from '@/composables/useClipboard'
import {
  usageGuideContent,
  type UsageGuideCategory,
  type UsageGuideField,
} from '@/data/usageGuide'

const SectionHeading = defineComponent({
  props: {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'max-w-3xl' }, [
      h('h2', { class: 'text-2xl font-bold text-gray-950 dark:text-white' }, props.title),
      h('p', { class: 'mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300' }, props.description),
    ])
  },
})

const API_KEY_PLACEHOLDER = 'sk-your-api-key'
const MODEL_PLACEHOLDER = 'your-model-id'

const { locale } = useI18n()
const appStore = useAppStore()
const { copyToClipboard } = useClipboard()

const searchQuery = ref('')
const activeCategory = ref<UsageGuideCategory>('clients')
const selectedEndpoint = ref('default')
const copiedId = ref<string | null>(null)
let copiedTimer: number | undefined

const content = computed(() => locale.value === 'zh' ? usageGuideContent.zh : usageGuideContent.en)

function normalizeBaseRoot(value: string): string {
  return value.trim().replace(/\/v1\/?$/, '').replace(/\/+$/, '')
}

function withV1(value: string): string {
  const root = normalizeBaseRoot(value)
  return `${root}/v1`
}

const defaultBaseRoot = computed(() => {
  const configured = appStore.cachedPublicSettings?.api_base_url || window.location.origin
  return normalizeBaseRoot(configured)
})

const customEndpoints = computed(() => {
  const settings = appStore.cachedPublicSettings
  return (settings?.custom_endpoints ?? []).flatMap((endpoint, index) => {
    const name = endpoint.name?.trim() || ''
    const value = normalizeBaseRoot(endpoint.endpoint || '')
    if (name === '' || value === '') return []

    return [{
      id: `custom-${index}`,
      name,
      endpoint: value,
      description: endpoint.description?.trim() || content.value.endpoints.customHint,
    }]
  })
})

const activeBaseRoot = computed(() => {
  if (selectedEndpoint.value === 'default') return defaultBaseRoot.value
  return customEndpoints.value.find((endpoint) => endpoint.id === selectedEndpoint.value)?.endpoint
    || defaultBaseRoot.value
})

const activeOpenAiBase = computed(() => withV1(activeBaseRoot.value))

const endpointUseLabel = computed(() => locale.value === 'zh' ? '使用此端点' : 'Use endpoint')
const endpointSelectedLabel = computed(() => locale.value === 'zh' ? '教程当前使用' : 'Used in examples')

const endpointOptions = computed(() => {
  const options: Array<{
    id: string
    label: string
    hint: string
    values: Array<{ kind: 'root' | 'openai'; label: string; value: string }>
  }> = [
    {
      id: 'default',
      label: content.value.endpoints.defaultLabel,
      hint: content.value.endpoints.defaultHint,
      values: [
        { kind: 'root', label: content.value.endpoints.rootLabel, value: defaultBaseRoot.value },
        { kind: 'openai', label: content.value.endpoints.openAiLabel, value: withV1(defaultBaseRoot.value) },
      ],
    },
  ]

  for (const endpoint of customEndpoints.value) {
    options.push({
      id: endpoint.id,
      label: endpoint.name,
      hint: endpoint.description,
      values: [
        { kind: 'root', label: content.value.endpoints.rootLabel, value: endpoint.endpoint },
        { kind: 'openai', label: content.value.endpoints.openAiLabel, value: withV1(endpoint.endpoint) },
      ],
    })
  }

  return options
})

const normalizedSearch = computed(() => searchQuery.value.trim().toLocaleLowerCase())

const filteredGuides = computed(() => {
  const query = normalizedSearch.value
  const guides = content.value.softwareGuides
  if (!query) {
    return guides.filter((guide) => guide.category === activeCategory.value)
  }

  return guides.filter((guide) => [
    guide.name,
    guide.summary,
    ...guide.badges,
    ...guide.steps,
    ...(guide.notes ?? []),
  ].join(' ').toLocaleLowerCase().includes(query))
})

const filteredTroubleshooting = computed(() => {
  const query = normalizedSearch.value
  if (!query) return content.value.troubleshooting.items
  return content.value.troubleshooting.items.filter((item) =>
    `${item.symptom} ${item.cause} ${item.solution}`.toLocaleLowerCase().includes(query))
})

const firstRequestCode = computed(() => {
  const guide = content.value.softwareGuides.find((item) => item.id === 'curl')
  return resolveTemplate(guide?.snippets?.[0]?.code || '')
})

function selectCategory(category: UsageGuideCategory) {
  activeCategory.value = category
  searchQuery.value = ''
}

function resolveFieldValue(field: UsageGuideField): string {
  switch (field.value) {
    case 'baseRoot':
      return activeBaseRoot.value
    case 'openAiBase':
      return activeOpenAiBase.value
    case 'apiKey':
      return API_KEY_PLACEHOLDER
    case 'model':
      return MODEL_PLACEHOLDER
    case 'literal':
      return field.literal || ''
  }
}

function resolveTemplate(value: string): string {
  const replacements: Array<[string, string]> = [
    ['{BASE_ROOT}', activeBaseRoot.value],
    ['{OPENAI_BASE_URL}', activeOpenAiBase.value],
    ['{API_KEY}', API_KEY_PLACEHOLDER],
    ['{MODEL}', MODEL_PLACEHOLDER],
  ]

  return replacements.reduce(
    (result, [placeholder, replacement]) => result.split(placeholder).join(replacement),
    value,
  )
}

async function copyText(id: string, value: string) {
  const success = await copyToClipboard(value, content.value.copied)
  if (!success) return

  copiedId.value = id
  if (copiedTimer !== undefined) window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null
  }, 1800)
}

onMounted(() => {
  void appStore.fetchPublicSettings()
})

onBeforeUnmount(() => {
  if (copiedTimer !== undefined) window.clearTimeout(copiedTimer)
})
</script>

<style scoped>
.guide-anchor {
  scroll-margin-top: 88px;
}

.guide-summary::-webkit-details-marker {
  display: none;
}

.guide-details[open] .guide-summary {
  background: rgba(248, 250, 252, 0.72);
}

.dark .guide-details[open] .guide-summary {
  background: rgba(30, 41, 59, 0.34);
}

.guide-details[open] .guide-chevron {
  transform: rotate(180deg);
}

pre {
  margin: 0;
  tab-size: 2;
  white-space: pre;
}
</style>
