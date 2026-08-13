<template>
  <BaseDialog
    :show="show"
    :title="t('aiWorkbench.promptLibrary')"
    width="wide"
    close-on-click-outside
    @close="emit('close')"
  >
    <div class="flex min-h-[540px] flex-col gap-4">
      <div class="flex flex-col gap-3 border-b border-gray-100 pb-4 dark:border-dark-700 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative min-w-0 flex-1">
          <Icon name="search" size="sm" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="keyword"
            type="search"
            class="input w-full pl-9"
            :placeholder="t('aiWorkbench.searchPrompts')"
          />
        </div>
        <div class="flex items-center gap-1 rounded-md bg-gray-100 p-1 text-xs dark:bg-dark-900">
          <button
            type="button"
            class="rounded px-2.5 py-1.5 transition-colors"
            :class="insertMode === 'replace' ? 'bg-white font-medium text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
            @click="insertMode = 'replace'"
          >
            {{ t('aiWorkbench.replacePrompt') }}
          </button>
          <button
            type="button"
            class="rounded px-2.5 py-1.5 transition-colors"
            :class="insertMode === 'append' ? 'bg-white font-medium text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
            @click="insertMode = 'append'"
          >
            {{ t('aiWorkbench.appendPrompt') }}
          </button>
        </div>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-[188px_minmax(0,1fr)]">
        <aside class="min-h-0 border-b border-gray-100 pb-4 dark:border-dark-700 md:overflow-y-auto md:border-b-0 md:border-r md:pb-0 md:pr-4">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{ t('aiWorkbench.promptCategory') }}</h3>
          <div class="mt-2 flex flex-wrap gap-1.5 md:flex-col md:items-stretch">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="rounded-md px-2.5 py-1.5 text-left text-xs transition-colors"
              :class="selectedCategory === category ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-dark-900 dark:text-gray-300 dark:hover:bg-dark-700'"
              @click="selectedCategory = category"
            >
              {{ category === 'all' ? t('common.all') : category }}
            </button>
          </div>

          <div v-if="availableTags.length" class="mt-5">
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{ t('aiWorkbench.promptTags') }}</h3>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <button
                v-for="tag in availableTags"
                :key="tag"
                type="button"
                class="rounded-full border px-2 py-1 text-[11px] transition-colors"
                :class="selectedTags.includes(tag) ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-dark-600 dark:text-gray-400'"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </aside>

        <section class="flex min-h-0 min-w-0 flex-col">
          <div class="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{{ t('aiWorkbench.promptCount', { count: filteredItems.length }) }}</span>
            <span v-if="failedSources.length">{{ t('aiWorkbench.somePromptSourcesUnavailable') }}</span>
          </div>

          <div v-if="loading" class="flex flex-1 items-center justify-center">
            <Icon name="refresh" size="lg" class="animate-spin text-primary-500" />
          </div>

          <div v-else-if="filteredItems.length" class="mt-3 grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="item in pagedItems"
              :key="`${item.sourceId}:${item.id}`"
              class="group flex min-h-[206px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-900"
            >
              <img
                v-if="item.coverUrl"
                :src="item.coverUrl"
                :alt="item.title"
                class="h-24 w-full object-cover"
                loading="lazy"
                @error="hideCover"
              />
              <div class="flex flex-1 flex-col p-3">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{{ item.title }}</h4>
                  <span v-if="item.imageModel" class="max-w-[45%] truncate text-[10px] text-gray-400">{{ item.imageModel }}</span>
                </div>
                <p class="mt-1.5 line-clamp-3 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ item.description || item.prompt }}</p>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-dark-700 dark:text-gray-400">{{ tag }}</span>
                </div>
                <div class="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span class="max-w-[58%] truncate text-[10px] text-gray-400">{{ item.category }}</span>
                  <button type="button" class="btn btn-secondary btn-sm !h-7 !px-2 text-xs" @click="selectPrompt(item)">
                    <Icon name="check" size="xs" />
                    {{ t('aiWorkbench.usePrompt') }}
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="flex flex-1 flex-col items-center justify-center text-center">
            <Icon name="book" size="xl" class="text-gray-300 dark:text-gray-600" />
            <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('aiWorkbench.noPromptsFound') }}</p>
          </div>

          <div v-if="pageCount > 1" class="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-dark-700 dark:text-gray-400">
            <span>{{ page }}/{{ pageCount }}</span>
            <button type="button" class="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-600" :title="t('aiWorkbench.previousPage')" :disabled="page === 1" @click="page -= 1">
              <Icon name="chevronLeft" size="sm" />
            </button>
            <button type="button" class="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-600" :title="t('aiWorkbench.nextPage')" :disabled="page === pageCount" @click="page += 1">
              <Icon name="chevronRight" size="sm" />
            </button>
          </div>
        </section>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Icon from '@/components/icons/Icon.vue'
import {
  filterPromptLibrary,
  loadPromptLibrary,
  promptLibraryCategories,
  promptLibraryTags,
  type PromptLibraryItem,
} from '@/data/aiPromptLibrary'

type InsertMode = 'replace' | 'append'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{
  close: []
  select: [prompt: string, mode: InsertMode]
}>()
const { t } = useI18n()

const pageSize = 24
const loading = ref(false)
const items = ref<PromptLibraryItem[]>([])
const failedSources = ref<string[]>([])
const keyword = ref('')
const selectedCategory = ref('all')
const selectedTags = ref<string[]>([])
const insertMode = ref<InsertMode>('replace')
const page = ref(1)

const categories = computed(() => ['all', ...promptLibraryCategories(items.value)])
const availableTags = computed(() => promptLibraryTags(filterPromptLibrary(items.value, {
  keyword: keyword.value,
  category: selectedCategory.value,
})))
const filteredItems = computed(() => filterPromptLibrary(items.value, {
  keyword: keyword.value,
  category: selectedCategory.value,
  tags: selectedTags.value,
}))
const pageCount = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize)))
const pagedItems = computed(() => filteredItems.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch([keyword, selectedCategory, selectedTags], () => {
  page.value = 1
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

watch(() => props.show, (show) => {
  if (show && !items.value.length) void loadItems()
})

async function loadItems() {
  loading.value = true
  try {
    const result = await loadPromptLibrary()
    items.value = result.items
    failedSources.value = result.failedSources
  } finally {
    loading.value = false
  }
}

function toggleTag(tag: string) {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((item) => item !== tag)
    : [...selectedTags.value, tag]
}

function selectPrompt(item: PromptLibraryItem) {
  emit('select', item.prompt, insertMode.value)
  emit('close')
}

function hideCover(event: Event) {
  const image = event.target as HTMLImageElement
  image.style.display = 'none'
}
</script>
