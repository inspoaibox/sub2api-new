<template>
  <AppLayout>
    <div class="mx-auto max-w-[1760px] space-y-4">
      <div v-if="loadingKeys" class="card flex min-h-[420px] items-center justify-center p-8">
        <Icon name="refresh" size="lg" class="animate-spin text-primary-500" />
        <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">{{ t('aiWorkbench.loadingKeys') }}</span>
      </div>

      <div v-else-if="compatibleKeys.length === 0" class="card flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-gray-300">
          <Icon name="key" size="lg" />
        </div>
        <h2 class="mt-4 text-base font-semibold text-gray-950 dark:text-white">{{ t('aiWorkbench.noKeyTitle') }}</h2>
        <p class="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{{ noKeyDescription }}</p>
        <router-link to="/keys" class="btn btn-primary mt-5">
          <Icon name="key" size="sm" />
          {{ t('aiWorkbench.manageKeys') }}
        </router-link>
      </div>

      <div v-else class="grid min-h-[640px] gap-4 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
        <aside class="card h-fit overflow-visible">
          <div class="border-b border-gray-200 px-5 py-4 dark:border-dark-700">
            <h2 class="text-sm font-semibold text-gray-950 dark:text-white">{{ t('aiWorkbench.generationSettings') }}</h2>
          </div>
          <form class="space-y-5 p-5" @submit.prevent="submitGeneration">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">{{ t('aiWorkbench.apiKey') }}</label>
              <Select v-model="selectedKeyId" :options="keyOptions" searchable @change="handleKeyChange" />
              <p v-if="selectedKey?.group" class="mt-1.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {{ selectedKey.group.name }} · {{ platformLabel(selectedKey.group.platform) }}
              </p>
            </div>

            <div>
              <label for="workbench-model" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">{{ t('aiWorkbench.model') }}</label>
              <Select
                id="workbench-model"
                v-model="form.model"
                :options="modelOptions"
                searchable
                creatable
                :disabled="!selectedKey || loadingModels"
                :placeholder="loadingModels ? t('aiWorkbench.loadingModels') : t('aiWorkbench.selectModel')"
                :empty-text="t('aiWorkbench.noModels')"
              />
              <p v-if="loadingModels" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ t('aiWorkbench.loadingModels') }}
              </p>
              <p v-else-if="modelLoadError" class="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {{ modelLoadError }}
              </p>
              <p v-else-if="selectedKey && !availableModels.length" class="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                {{ t('aiWorkbench.noModelsForKey') }}
              </p>
            </div>

            <div>
              <div class="mb-1.5 flex items-center justify-between gap-3">
                <label for="workbench-prompt" class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t('aiWorkbench.prompt') }}</label>
                <div class="flex items-center gap-2">
                  <button
                    v-if="mode === 'image'"
                    type="button"
                    class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    :title="t('aiWorkbench.openPromptLibrary')"
                    @click="showPromptLibrary = true"
                  >
                    <Icon name="book" size="xs" />
                    {{ t('aiWorkbench.promptLibrary') }}
                  </button>
                  <span class="text-xs tabular-nums text-gray-400">{{ form.prompt.length }}/4000</span>
                </div>
              </div>
              <textarea
                id="workbench-prompt"
                v-model="form.prompt"
                class="input min-h-[150px] w-full resize-y py-3"
                maxlength="4000"
                :placeholder="promptPlaceholder"
              ></textarea>
            </div>

            <div>
              <div class="mb-1.5 flex items-center justify-between gap-3">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ referenceLabel }}</label>
                <button v-if="referencePreview" type="button" class="text-xs text-red-600 hover:text-red-700 dark:text-red-400" @click="clearReference">
                  {{ t('common.remove') }}
                </button>
              </div>
              <label
                class="relative flex min-h-[92px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-primary-400 hover:bg-primary-50/40 dark:border-dark-600 dark:bg-dark-900 dark:hover:border-primary-500"
              >
                <img v-if="referencePreview" :src="referencePreview" :alt="referenceLabel" class="h-28 w-full object-cover" />
                <span v-else class="flex flex-col items-center gap-2 px-4 py-5 text-center text-xs text-gray-500 dark:text-gray-400">
                  <Icon name="upload" size="md" />
                  {{ referenceHint }}
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" @change="handleReferenceFile" />
              </label>
            </div>

            <div v-if="mode === 'image'" class="space-y-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.imageResolution') }}</label>
                <Select v-model="form.imageSize" :options="imageSizeOptions" />
                <p class="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ t('aiWorkbench.imageResolutionHint') }}</p>
              </div>

              <div v-if="form.imageSize === customImageSizeValue" class="grid grid-cols-2 gap-3">
                <div>
                  <label for="workbench-custom-width" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.width') }}</label>
                  <div class="relative">
                    <input id="workbench-custom-width" v-model.number="form.customWidth" class="input w-full pr-9" type="number" inputmode="numeric" :min="minimumCustomImageDimension" :max="maximumCustomImageDimension" step="1" />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                  </div>
                </div>
                <div>
                  <label for="workbench-custom-height" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.height') }}</label>
                  <div class="relative">
                    <input id="workbench-custom-height" v-model.number="form.customHeight" class="input w-full pr-9" type="number" inputmode="numeric" :min="minimumCustomImageDimension" :max="maximumCustomImageDimension" step="1" />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                  </div>
                </div>
                <p class="col-span-2 text-xs" :class="customImageSizeValid ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'">
                  {{ customImageSizeValid ? t('aiWorkbench.customResolutionHint', { min: minimumCustomImageDimension, max: maximumCustomImageDimension }) : t('aiWorkbench.invalidCustomResolution', { min: minimumCustomImageDimension, max: maximumCustomImageDimension }) }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.count') }}</label>
                  <Select v-model="form.count" :options="countOptions" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.quality') }}</label>
                  <Select v-model="form.quality" :options="qualityOptions" />
                </div>
              </div>
              <p class="text-xs leading-5 text-gray-500 dark:text-gray-400">{{ t('aiWorkbench.qualityHint') }}</p>
            </div>

            <div v-else class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.duration') }}</label>
                <Select v-model="form.duration" :options="durationOptions" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.resolution') }}</label>
                <Select v-model="form.resolution" :options="resolutionOptions" />
              </div>
              <div class="col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('aiWorkbench.aspectRatio') }}</label>
                <Select v-model="form.aspectRatio" :options="aspectRatioOptions" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full" :disabled="generating || !canSubmit">
              <Icon :name="generating ? 'refresh' : 'sparkles'" size="sm" :class="generating ? 'animate-spin' : ''" />
              {{ generating ? t('aiWorkbench.generating') : generateLabel }}
            </button>
          </form>
        </aside>

        <main class="card min-h-[640px] overflow-hidden">
          <div class="flex min-h-[57px] flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3 dark:border-dark-700">
            <div>
              <h2 class="text-sm font-semibold text-gray-950 dark:text-white">{{ t('aiWorkbench.output') }}</h2>
              <p v-if="activeResult" class="mt-0.5 max-w-xl truncate text-xs text-gray-500 dark:text-gray-400">{{ activeResult.prompt }}</p>
            </div>
            <span v-if="activeResult" class="badge" :class="statusClass(activeResult.status)">{{ statusText(activeResult.status) }}</span>
          </div>

          <div class="flex min-h-[580px] items-center justify-center p-5 sm:p-8">
            <div v-if="!activeResult" class="max-w-sm text-center">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-dark-800 dark:text-gray-500">
                <Icon :name="mode === 'image' ? 'sparkles' : 'play'" size="xl" />
              </div>
              <h3 class="mt-4 text-base font-medium text-gray-900 dark:text-white">{{ emptyTitle }}</h3>
              <p class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ emptyDescription }}</p>
            </div>

            <div v-else-if="(activeResult.status === 'queued' || activeResult.status === 'processing') && !(mode === 'image' && activeResult.urls.length)" class="max-w-sm text-center">
              <Icon name="refresh" size="xl" class="mx-auto animate-spin text-primary-500" />
              <h3 class="mt-4 text-base font-medium text-gray-900 dark:text-white">{{ processingTitle }}</h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ processingDescription }}</p>
              <p v-if="activeResult.requestId" class="mt-3 break-all font-mono text-xs text-gray-400">{{ activeResult.requestId }}</p>
            </div>

            <div v-else-if="activeResult.status === 'failed'" class="max-w-lg text-center">
              <Icon name="exclamationCircle" size="xl" class="mx-auto text-red-500" />
              <h3 class="mt-4 text-base font-medium text-gray-900 dark:text-white">{{ t('aiWorkbench.failedTitle') }}</h3>
              <p class="mt-2 text-sm leading-6 text-red-600 dark:text-red-400">{{ activeResult.error }}</p>
              <button type="button" class="btn btn-secondary mt-5" @click="reuseResult(activeResult)">
                <Icon name="refresh" size="sm" />
                {{ t('aiWorkbench.reuseSettings') }}
              </button>
            </div>

            <div v-else-if="mode === 'image' && activeResult.urls.length" class="relative grid w-full gap-4" :class="activeResult.urls.length > 1 ? 'md:grid-cols-2' : 'max-w-4xl grid-cols-1'">
              <figure v-for="(url, index) in activeResult.urls" :key="`${activeResult.id}-${index}`" class="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-dark-700 dark:bg-dark-900">
                <img :src="url" :alt="`${activeResult.prompt} ${index + 1}`" class="max-h-[680px] min-h-[260px] w-full object-contain" />
                <div v-if="activeResult.status === 'processing'" class="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md bg-gray-950/80 px-3 py-2 pr-14 text-xs text-white shadow-lg">
                  <Icon name="refresh" size="sm" class="animate-spin text-primary-300" />
                  {{ t('aiWorkbench.refiningImage') }}
                </div>
                <div class="absolute right-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100" :class="activeResult.status === 'processing' ? 'top-3' : 'bottom-3'">
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-gray-700 shadow hover:text-primary-600 disabled:cursor-wait disabled:opacity-60 dark:bg-dark-800/95 dark:text-gray-200"
                      :title="t('aiWorkbench.useAsSource')"
                      :disabled="usingResultAsSource === url"
                      @click="useResultAsReference(url)"
                    >
                      <Icon :name="usingResultAsSource === url ? 'refresh' : 'edit'" size="sm" :class="usingResultAsSource === url ? 'animate-spin' : ''" />
                    </button>
                    <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-gray-700 shadow hover:text-primary-600 dark:bg-dark-800/95 dark:text-gray-200" :title="t('aiWorkbench.download')" @click="downloadResult(url, index)">
                      <Icon name="download" size="sm" />
                    </button>
                  </div>
                </div>
              </figure>
            </div>

            <div v-else class="w-full max-w-5xl">
              <video v-if="activeResult.urls[0]" :src="activeResult.urls[0]" controls playsinline class="max-h-[680px] w-full rounded-lg bg-black"></video>
              <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ activeResult.model }}</p>
                <button v-if="activeResult.urls[0]" type="button" class="btn btn-secondary btn-sm" @click="downloadResult(activeResult.urls[0], 0)">
                  <Icon name="download" size="sm" />
                  {{ t('aiWorkbench.downloadVideo') }}
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside class="card h-fit overflow-hidden">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-dark-700">
            <h2 class="text-sm font-semibold text-gray-950 dark:text-white">{{ t('aiWorkbench.sessionHistory') }}</h2>
            <button v-if="history.length" type="button" class="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" @click="clearHistory">
              {{ t('aiWorkbench.clearHistory') }}
            </button>
          </div>
          <div v-if="history.length" class="max-h-[660px] divide-y divide-gray-100 overflow-y-auto dark:divide-dark-700">
            <button
              v-for="item in history"
              :key="item.id"
              type="button"
              class="block w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-dark-800"
              :class="selectedResultId === item.id ? 'bg-primary-50 dark:bg-primary-900/10' : ''"
              @click="selectedResultId = item.id"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400 dark:bg-dark-900">
                  <img v-if="item.kind === 'image' && item.urls[0]" :src="item.urls[0]" alt="" class="h-full w-full object-cover" />
                  <Icon v-else :name="item.kind === 'image' ? 'sparkles' : 'play'" size="sm" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="line-clamp-2 text-sm text-gray-800 dark:text-gray-200">{{ item.prompt }}</p>
                  <div class="mt-1.5 flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span class="truncate">{{ item.model }}</span>
                    <span class="flex-shrink-0">{{ formatTime(item.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div v-else class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ t('aiWorkbench.noHistory') }}
          </div>
        </aside>
      </div>
    </div>
    <AIPromptLibrary
      :show="showPromptLibrary"
      @close="showPromptLibrary = false"
      @select="insertPromptFromLibrary"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import Select from '@/components/common/Select.vue'
import AIPromptLibrary from '@/components/user/AIPromptLibrary.vue'
import { keysAPI } from '@/api/keys'
import {
  generateVideo,
  getVideoContent,
  getVideoStatus,
  resolveImageUrl,
  resolveVideoUrl,
  listMediaModels,
  streamImage,
  streamImageEdit,
} from '@/api/mediaGeneration'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  clearAIWorkbenchHistory,
  loadAIWorkbenchHistory,
  markInterruptedGenerations,
  saveAIWorkbenchHistory,
  type AIWorkbenchGenerationStatus,
  type AIWorkbenchHistoryItem,
} from '@/utils/aiWorkbenchHistory'
import {
  customImageSizeValue,
  isValidCustomImageDimension,
  maximumCustomImageDimension,
  minimumCustomImageDimension,
  resolveImageRequestSize,
} from '@/utils/aiImageSettings'
import type { ApiKey, GroupPlatform } from '@/types'
import type { ImageGenerationStreamEvent } from '@/api/mediaGeneration'

type WorkbenchMode = 'image' | 'video'
type GenerationStatus = AIWorkbenchGenerationStatus
type GenerationResult = AIWorkbenchHistoryItem

const props = defineProps<{ mode: WorkbenchMode }>()
const { t, locale } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()

const loadingKeys = ref(true)
const loadingModels = ref(false)
const modelLoadError = ref('')
const generating = ref(false)
const apiKeys = ref<ApiKey[]>([])
const availableModels = ref<string[]>([])
const selectedKeyId = ref<number | null>(null)
const referenceFile = ref<File | null>(null)
const referencePreview = ref('')
const showPromptLibrary = ref(false)
const usingResultAsSource = ref('')
const history = ref<GenerationResult[]>([])
const selectedResultId = ref('')
const objectUrls = new Set<string>()
let pollGeneration = 0
let modelRequestSeq = 0
let modelAbortController: AbortController | null = null
let historySaveTimer: ReturnType<typeof setTimeout> | null = null
let historyLoadGeneration = 0

const form = reactive({
  model: '',
  prompt: '',
  imageSize: '1024x1024',
  customWidth: 1920,
  customHeight: 1080,
  count: 1,
  quality: 'auto',
  duration: 8,
  resolution: '720p',
  aspectRatio: '16:9',
})

const compatiblePlatforms: Record<WorkbenchMode, GroupPlatform[]> = {
  image: ['openai', 'grok', 'composite'],
  video: ['grok', 'composite'],
}

const compatibleKeys = computed(() => apiKeys.value.filter((key) => (
  key.status === 'active'
  && !!key.key
  && !!key.group
  && key.group.allow_image_generation === true
  && compatiblePlatforms[props.mode].includes(key.group.platform)
)))

const selectedKey = computed(() => compatibleKeys.value.find((key) => key.id === Number(selectedKeyId.value)) || null)
const activeResult = computed(() => history.value.find((item) => item.id === selectedResultId.value) || history.value[0] || null)
const defaultModel = computed(() => {
  if (props.mode === 'video') return 'grok-imagine-video'
  return selectedKey.value?.group?.platform === 'grok' ? 'grok-imagine-image' : 'gpt-image-2'
})
const modelOptions = computed(() => availableModels.value.map((model) => ({ value: model, label: model })))
const keyOptions = computed(() => compatibleKeys.value.map((key) => ({
  value: key.id,
  label: `${key.name} · ${key.group?.name || platformLabel(key.group?.platform)}`,
})))
const imageRequestSize = computed(() => resolveImageRequestSize(form.imageSize, form.customWidth, form.customHeight))
const customImageSizeValid = computed(() => (
  form.imageSize !== customImageSizeValue
  || (isValidCustomImageDimension(form.customWidth) && isValidCustomImageDimension(form.customHeight))
))
const canSubmit = computed(() => (
  !!selectedKey.value
  && !!form.model.trim()
  && !!form.prompt.trim()
  && (props.mode !== 'image' || !!imageRequestSize.value)
))

const generateLabel = computed(() => t(props.mode === 'image' ? 'aiWorkbench.generateImage' : 'aiWorkbench.generateVideo'))
const promptPlaceholder = computed(() => t(props.mode === 'image' ? 'aiWorkbench.imagePromptPlaceholder' : 'aiWorkbench.videoPromptPlaceholder'))
const referenceLabel = computed(() => t(props.mode === 'image' ? 'aiWorkbench.sourceImage' : 'aiWorkbench.referenceImage'))
const referenceHint = computed(() => t(props.mode === 'image' ? 'aiWorkbench.sourceImageHint' : 'aiWorkbench.referenceImageHint'))
const noKeyDescription = computed(() => t(props.mode === 'image' ? 'aiWorkbench.noImageKey' : 'aiWorkbench.noVideoKey'))
const emptyTitle = computed(() => t(props.mode === 'image' ? 'aiWorkbench.emptyImageTitle' : 'aiWorkbench.emptyVideoTitle'))
const emptyDescription = computed(() => t(props.mode === 'image' ? 'aiWorkbench.emptyImageDescription' : 'aiWorkbench.emptyVideoDescription'))
const processingTitle = computed(() => t(props.mode === 'image' ? 'aiWorkbench.renderingImage' : 'aiWorkbench.renderingVideo'))
const processingDescription = computed(() => t(props.mode === 'image' ? 'aiWorkbench.renderingImageDescription' : 'aiWorkbench.renderingVideoDescription'))

const imageSizeOptions = computed(() => [
  { value: '1024x1024', label: t('aiWorkbench.imageSize1024Square') },
  { value: '1536x1024', label: t('aiWorkbench.imageSize1536Landscape') },
  { value: '1024x1536', label: t('aiWorkbench.imageSize1536Portrait') },
  { value: '2048x2048', label: t('aiWorkbench.imageSize2048Square') },
  { value: '2560x1440', label: t('aiWorkbench.imageSize2560Wide') },
  { value: '3840x2160', label: t('aiWorkbench.imageSize3840Wide') },
  { value: customImageSizeValue, label: t('aiWorkbench.customResolution') },
])
const countOptions = [1, 2, 3, 4].map((value) => ({ value, label: String(value) }))
const qualityOptions = computed(() => [
  { value: 'auto', label: t('aiWorkbench.qualityAuto') },
  { value: 'low', label: t('aiWorkbench.qualityLow') },
  { value: 'medium', label: t('aiWorkbench.qualityMedium') },
  { value: 'high', label: t('aiWorkbench.qualityHigh') },
])
const durationOptions = computed(() => [6, 8, 10, 15].map((value) => ({ value, label: t('aiWorkbench.seconds', { value }) })))
const resolutionOptions = ['480p', '720p', '1080p'].map((value) => ({ value, label: value }))
const aspectRatioOptions = computed(() => [
  { value: '16:9', label: t('aiWorkbench.wide') },
  { value: '9:16', label: t('aiWorkbench.vertical') },
  { value: '1:1', label: t('aiWorkbench.squareVideo') },
])

function platformLabel(platform?: GroupPlatform) {
  const labels: Partial<Record<GroupPlatform, string>> = {
    openai: 'OpenAI',
    grok: 'Grok',
    composite: t('aiWorkbench.composite'),
  }
  return platform ? labels[platform] || platform : ''
}

function handleKeyChange() {
  void loadAvailableModels()
}

function preferredModel(models: string[]) {
  const preferred = defaultModel.value
  return models.includes(preferred) ? preferred : models[0] || ''
}

async function loadAvailableModels() {
  const key = selectedKey.value
  const requestID = ++modelRequestSeq
  modelAbortController?.abort()
  modelAbortController = null
  availableModels.value = []
  modelLoadError.value = ''
  form.model = ''
  if (!key) return

  const controller = new AbortController()
  modelAbortController = controller
  loadingModels.value = true
  try {
    const response = await listMediaModels(key.key, props.mode, controller.signal)
    if (requestID !== modelRequestSeq) return
    const seen = new Set<string>()
    availableModels.value = (response.data || [])
      .map((model) => String(model.id || '').trim())
      .filter((model) => {
        if (!model || seen.has(model)) return false
        seen.add(model)
        return true
      })
    form.model = preferredModel(availableModels.value)
  } catch (error) {
    if (requestID !== modelRequestSeq || controller.signal.aborted) return
    modelLoadError.value = errorMessage(error, t('aiWorkbench.loadModelsFailed'))
  } finally {
    if (requestID === modelRequestSeq) {
      loadingModels.value = false
      if (modelAbortController === controller) modelAbortController = null
    }
  }
}

async function loadKeys() {
  loadingKeys.value = true
  try {
    const loaded: ApiKey[] = []
    let page = 1
    while (true) {
      const response = await keysAPI.list(page, 100, { status: 'active', sort_by: 'created_at', sort_order: 'desc' })
      loaded.push(...(response.items || []))
      if (page >= response.pages || !response.items?.length) break
      page += 1
    }
    apiKeys.value = loaded
    selectedKeyId.value = compatibleKeys.value[0]?.id || null
    await loadAvailableModels()
    await restorePersistedVideos()
  } catch (error) {
    appStore.showError(errorMessage(error, t('aiWorkbench.loadKeysFailed')))
  } finally {
    loadingKeys.value = false
  }
}

function handleReferenceFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    appStore.showError(t('aiWorkbench.invalidImage'))
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    appStore.showError(t('aiWorkbench.imageTooLarge'))
    return
  }
  setReferenceFile(file)
}

function setReferenceFile(file: File) {
  clearReference()
  referenceFile.value = file
  referencePreview.value = URL.createObjectURL(file)
  objectUrls.add(referencePreview.value)
}

function clearReference() {
  if (referencePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(referencePreview.value)
    objectUrls.delete(referencePreview.value)
  }
  referenceFile.value = null
  referencePreview.value = ''
}

function createResult(): GenerationResult {
  const result: GenerationResult = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: props.mode,
    prompt: form.prompt.trim(),
    model: form.model.trim(),
    keyName: selectedKey.value?.name || '',
    status: 'queued',
    createdAt: Date.now(),
    urls: [],
    keyId: selectedKey.value?.id,
  }
  history.value.unshift(result)
  selectedResultId.value = result.id
  scheduleHistorySave()
  return result
}

function scheduleHistorySave() {
  if (historySaveTimer) clearTimeout(historySaveTimer)
  historySaveTimer = setTimeout(() => {
    historySaveTimer = null
    void saveHistory()
  }, 150)
}

async function saveHistory() {
  await saveHistoryFor(props.mode, history.value)
}

async function saveHistoryFor(mode: WorkbenchMode, items: GenerationResult[]) {
  const userId = authStore.user?.id
  if (!userId) return
  try {
    await saveAIWorkbenchHistory(userId, mode, items)
  } catch (error) {
    console.warn('Unable to persist AI workbench history:', error)
  }
}

async function restoreHistory() {
  const userId = authStore.user?.id
  if (!userId) return
  const generation = ++historyLoadGeneration
  try {
    const stored = await loadAIWorkbenchHistory(userId, props.mode)
    if (generation !== historyLoadGeneration) return
    const restored = markInterruptedGenerations(stored, t('aiWorkbench.generationInterrupted'))
    history.value = restored
    selectedResultId.value = restored[0]?.id || ''
    if (stored.some((item) => item.status === 'queued' || item.status === 'processing')) {
      await saveAIWorkbenchHistory(userId, props.mode, restored)
    }
  } catch (error) {
    console.warn('Unable to restore AI workbench history:', error)
  }
}

async function submitGeneration() {
  if (!canSubmit.value || !selectedKey.value) {
    appStore.showError(t('aiWorkbench.completeRequiredFields'))
    return
  }

  const key = selectedKey.value
  const result = createResult()
  generating.value = true
  result.status = 'processing'
  scheduleHistorySave()

  try {
    if (props.mode === 'image') {
      const payload = {
        model: result.model,
        prompt: result.prompt,
        n: Number(form.count),
        size: imageRequestSize.value,
        quality: form.quality,
        response_format: 'b64_json' as const,
      }
      let streamError = ''
      const completedUrls: string[] = []
      const applyStreamEvent = (event: ImageGenerationStreamEvent) => {
        if (event.kind === 'error') {
          streamError = event.error || t('aiWorkbench.generateFailed')
          return
        }
        const url = event.item ? resolveImageUrl(event.item) : ''
        if (!url) return
        // Preview events belong to one evolving image. Replace it in place
        // until completed events deliver the final result set.
        if (event.kind === 'partial') {
          result.urls = [url]
          scheduleHistorySave()
          return
        }
        completedUrls.push(url)
        result.urls = completedUrls.slice()
        scheduleHistorySave()
      }
      const response = referenceFile.value
        ? await streamImageEdit(key.key, payload, referenceFile.value, applyStreamEvent)
        : await streamImage(key.key, payload, applyStreamEvent)
      if (streamError) throw new Error(streamError)
      if (response.data?.length) {
        result.urls = response.data.map(resolveImageUrl).filter(Boolean)
      }
      if (!result.urls.length) throw new Error(t('aiWorkbench.emptyImageResponse'))
      result.status = 'completed'
      scheduleHistorySave()
      appStore.showSuccess(t('aiWorkbench.imageGenerated'))
      return
    }

    const referenceDataUrl = referenceFile.value ? await fileToDataUrl(referenceFile.value) : undefined
    const response = await generateVideo(key.key, {
      model: result.model,
      prompt: result.prompt,
      duration: Number(form.duration),
      resolution: form.resolution,
      aspect_ratio: form.aspectRatio,
      ...(referenceDataUrl ? { image: { url: referenceDataUrl, type: 'image_url' } } : {}),
    })
    result.requestId = response.request_id || response.id
    scheduleHistorySave()
    const immediateUrl = resolveVideoUrl(response)
    if (immediateUrl) {
      result.sourceUrls = [immediateUrl]
      result.urls = [await playableVideoUrl(key.key, result.requestId, immediateUrl)]
      result.status = 'completed'
      scheduleHistorySave()
      appStore.showSuccess(t('aiWorkbench.videoGenerated'))
      return
    }
    if (!result.requestId) throw new Error(t('aiWorkbench.missingVideoTask'))
    await pollVideo(key.key, result, ++pollGeneration)
  } catch (error) {
    result.status = 'failed'
    result.error = errorMessage(error, t('aiWorkbench.generateFailed'))
    scheduleHistorySave()
    appStore.showError(result.error)
    } finally {
      generating.value = false
      scheduleHistorySave()
    }
}

async function pollVideo(apiKey: string, result: GenerationResult, generation: number) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (generation !== pollGeneration || !result.requestId) return
    if (attempt > 0) await sleep(3000)
    const response = await getVideoStatus(apiKey, result.requestId)
    const status = String(response.status || '').toLowerCase()
    if (['failed', 'error', 'cancelled'].includes(status)) {
      throw new Error(response.error?.message || t('aiWorkbench.videoTaskFailed'))
    }
    const url = resolveVideoUrl(response)
    if (url && ['done', 'completed', 'succeeded', 'success'].includes(status)) {
      result.sourceUrls = [url]
      result.urls = [await playableVideoUrl(apiKey, result.requestId, url)]
      result.status = 'completed'
      scheduleHistorySave()
      appStore.showSuccess(t('aiWorkbench.videoGenerated'))
      return
    }
  }
  throw new Error(t('aiWorkbench.videoTimeout'))
}

async function playableVideoUrl(apiKey: string, requestId: string | undefined, url: string) {
  if (!url.startsWith('/v1/') || !requestId) return url
  const blob = await getVideoContent(apiKey, requestId)
  const objectUrl = URL.createObjectURL(blob)
  objectUrls.add(objectUrl)
  return objectUrl
}

async function restorePersistedVideos() {
  const pendingVideos = history.value.filter((item) => (
    item.kind === 'video'
    && item.status === 'completed'
    && !item.urls.length
    && !!item.sourceUrls?.[0]
    && !!item.requestId
  ))
  if (!pendingVideos.length) return

  await Promise.all(pendingVideos.map(async (item) => {
    const key = compatibleKeys.value.find((candidate) => candidate.id === item.keyId)
    if (!key || !item.requestId || !item.sourceUrls?.[0]) return
    try {
      item.urls = [await playableVideoUrl(key.key, item.requestId, item.sourceUrls[0])]
    } catch (error) {
      console.warn('Unable to restore generated video:', error)
    }
  }))
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(t('common.fileReadFailed')))
    reader.readAsDataURL(file)
  })
}

function reuseResult(result: GenerationResult) {
  form.prompt = result.prompt
  form.model = result.model
}

function insertPromptFromLibrary(prompt: string, mode: 'replace' | 'append') {
  const nextPrompt = prompt.trim()
  if (!nextPrompt) return
  form.prompt = mode === 'append' && form.prompt.trim()
    ? `${form.prompt.trim()}\n\n${nextPrompt}`
    : nextPrompt
}

async function useResultAsReference(url: string) {
  if (usingResultAsSource.value) return
  usingResultAsSource.value = url
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(response.statusText)
    const blob = await response.blob()
    if (!blob.size) throw new Error(t('aiWorkbench.emptyImageResponse'))
    if (blob.size > 10 * 1024 * 1024) throw new Error(t('aiWorkbench.imageTooLarge'))

    const mimeType = blob.type.startsWith('image/') ? blob.type : 'image/png'
    const extension = mimeType.split('/')[1]?.split('+')[0] || 'png'
    setReferenceFile(new File([blob], `sub2api-edit-source-${Date.now()}.${extension}`, { type: mimeType }))
    appStore.showSuccess(t('aiWorkbench.sourceImageReady'))
  } catch (error) {
    appStore.showError(errorMessage(error, t('aiWorkbench.useAsSourceFailed')))
  } finally {
    usingResultAsSource.value = ''
  }
}

function clearHistory() {
  pollGeneration += 1
  generating.value = false
  for (const item of history.value) {
    for (const url of item.urls) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
        objectUrls.delete(url)
      }
    }
  }
  history.value = []
  selectedResultId.value = ''
  if (historySaveTimer) {
    clearTimeout(historySaveTimer)
    historySaveTimer = null
  }
  const userId = authStore.user?.id
  if (userId) {
    void clearAIWorkbenchHistory(userId, props.mode).catch((error) => {
      console.warn('Unable to clear AI workbench history:', error)
    })
  }
}

async function downloadResult(url: string, index: number) {
  const extension = props.mode === 'image' ? 'png' : 'mp4'
  const filename = `sub2api-${props.mode}-${Date.now()}-${index + 1}.${extension}`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(response.statusText)
    const blobUrl = URL.createObjectURL(await response.blob())
    triggerDownload(blobUrl, filename)
    URL.revokeObjectURL(blobUrl)
  } catch {
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      triggerDownload(url, filename)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function statusClass(status: GenerationStatus) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
  if (status === 'failed') return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
}

function statusText(status: GenerationStatus) {
  return t(`aiWorkbench.status.${status}`)
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || fallback)
  return fallback
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

watch(() => props.mode, (_mode, previousMode) => {
  pollGeneration += 1
  generating.value = false
  if (historySaveTimer) {
    clearTimeout(historySaveTimer)
    historySaveTimer = null
  }
  void saveHistoryFor(previousMode, history.value)
  history.value = []
  selectedResultId.value = ''
  clearReference()
  selectedKeyId.value = compatibleKeys.value[0]?.id || null
  void loadAvailableModels()
  void restoreHistory().then(restorePersistedVideos)
})

onMounted(() => {
  void (async () => {
    await restoreHistory()
    await loadKeys()
  })()
})

onBeforeUnmount(() => {
  pollGeneration += 1
  historyLoadGeneration += 1
  modelRequestSeq += 1
  modelAbortController?.abort()
  modelAbortController = null
  if (historySaveTimer) {
    clearTimeout(historySaveTimer)
    historySaveTimer = null
  }
  void saveHistory()
  for (const url of objectUrls) URL.revokeObjectURL(url)
  objectUrls.clear()
})
</script>
