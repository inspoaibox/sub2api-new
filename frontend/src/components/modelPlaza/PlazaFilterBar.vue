<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label class="filter-field">
      <span>{{ t('modelPlaza.filters.platformLabel') }}</span>
      <div class="relative">
        <select
          data-filter="platform"
          :value="platform"
          class="filter-select"
          @change="selectPlatform(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">{{ t('modelPlaza.filters.all') }}</option>
          <option v-for="item in platforms" :key="item" :value="item">{{ item }}</option>
        </select>
        <Icon name="chevronDown" size="xs" class="filter-chevron" />
      </div>
    </label>

    <label class="filter-field">
      <span>{{ t('modelPlaza.filters.groupLabel') }}</span>
      <div class="relative">
        <select
          data-filter="group"
          :value="groupId"
          class="filter-select"
          @change="selectGroup(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">{{ t('modelPlaza.filters.all') }}</option>
          <option v-for="item in linkedGroups" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
        <Icon name="chevronDown" size="xs" class="filter-chevron" />
      </div>
    </label>

    <label class="filter-field">
      <span>{{ t('modelPlaza.filters.rateLabel') }}</span>
      <div class="relative">
        <select
          data-filter="rate"
          :value="rate"
          class="filter-select font-mono"
          @change="selectRate(($event.target as HTMLSelectElement).value)"
        >
          <option value="all">{{ t('modelPlaza.filters.all') }}</option>
          <option v-for="item in linkedRates" :key="item" :value="item">{{ item }}x</option>
        </select>
        <Icon name="chevronDown" size="xs" class="filter-chevron" />
      </div>
    </label>

    <label class="filter-field">
      <span>{{ t('modelPlaza.filters.modelLabel') }}</span>
      <div class="relative">
        <Icon
          name="search"
          size="sm"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-500"
        />
        <input
          :value="search"
          type="search"
          :placeholder="t('modelPlaza.filters.searchPlaceholder')"
          class="filter-input"
          @input="selectSearch(($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="search"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:text-dark-500 dark:hover:text-gray-300"
          @click="selectSearch('')"
        >
          <Icon name="x" size="xs" class="h-3.5 w-3.5" />
        </button>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

interface PlazaFilterState {
  platform: string
  groupId: number | 'all'
  rate: number | 'all'
  search: string
}

const props = defineProps<{
  platforms: string[]
  groups: Array<{ id: number; name: string; platform: string; rate: number }>
  rates: number[]
  platform: string
  groupId: number | 'all'
  rate: number | 'all'
  search: string
}>()

const emit = defineEmits<{
  'update:filters': [value: PlazaFilterState]
}>()

const { t } = useI18n()

const linkedGroups = computed(() =>
  props.groups.filter(
    (group) =>
      (props.platform === 'all' || group.platform === props.platform) &&
      (props.rate === 'all' || group.rate === props.rate)
  )
)

const linkedRates = computed(() => {
  const selectedGroup = props.groups.find((group) => group.id === props.groupId)
  if (selectedGroup) return [selectedGroup.rate]
  return props.rates.filter((rate) =>
    props.groups.some(
      (group) => group.rate === rate && (props.platform === 'all' || group.platform === props.platform)
    )
  )
})

function selectPlatform(value: string) {
  let groupId = props.groupId
  let rate = props.rate
  const selectedGroup = props.groups.find((group) => group.id === props.groupId)
  if (selectedGroup && value !== 'all' && selectedGroup.platform !== value) {
    groupId = 'all'
  }
  if (
    props.rate !== 'all' &&
    !props.groups.some((group) => group.rate === props.rate && (value === 'all' || group.platform === value))
  ) {
    rate = 'all'
  }
  emitFilters({ platform: value, groupId, rate })
}

function selectGroup(value: string) {
  if (value === 'all') {
    emitFilters({ groupId: 'all' })
    return
  }
  const selectedGroup = props.groups.find((group) => group.id === Number(value))
  if (!selectedGroup) return
  emitFilters({
    platform: selectedGroup.platform,
    groupId: selectedGroup.id,
    rate: selectedGroup.rate
  })
}

function selectRate(value: string) {
  const selectedRate = value === 'all' ? 'all' : Number(value)
  let groupId = props.groupId
  const selectedGroup = props.groups.find((group) => group.id === props.groupId)
  if (selectedGroup && selectedRate !== 'all' && selectedGroup.rate !== selectedRate) {
    groupId = 'all'
  }
  emitFilters({ groupId, rate: selectedRate })
}

function selectSearch(value: string) {
  emitFilters({ search: value })
}

function emitFilters(overrides: Partial<PlazaFilterState>) {
  emit('update:filters', {
    platform: props.platform,
    groupId: props.groupId,
    rate: props.rate,
    search: props.search,
    ...overrides
  })
}
</script>

<style scoped>
.filter-field {
  display: grid;
  min-width: 0;
  gap: 0.375rem;
  color: rgb(107 114 128);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1rem;
}

.filter-select,
.filter-input {
  width: 100%;
  min-height: 2.5rem;
  border: 0;
  border-radius: 0.875rem;
  background: rgb(243 244 246 / 0.9);
  color: rgb(31 41 55);
  font-size: 0.875rem;
  line-height: 1.25rem;
  outline: none;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.06);
}

.filter-select {
  appearance: none;
  padding: 0.5rem 2.25rem 0.5rem 0.75rem;
}

.filter-input {
  padding: 0.5rem 2.25rem 0.5rem 2.25rem;
}

.filter-select:hover,
.filter-input:hover {
  background: rgb(229 231 235 / 0.85);
}

.filter-select:focus,
.filter-input:focus {
  background: rgb(255 255 255);
  box-shadow: 0 0 0 3px rgb(20 184 166 / 0.12);
}

.filter-chevron {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  pointer-events: none;
  color: rgb(156 163 175);
  transform: translateY(-50%);
}

.dark .filter-field {
  color: rgb(156 163 175);
}

.dark .filter-select,
.dark .filter-input {
  background: rgb(17 24 39 / 0.48);
  color: rgb(229 231 235);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07);
}

.dark .filter-select:hover,
.dark .filter-input:hover {
  background: rgb(17 24 39 / 0.7);
}
</style>
