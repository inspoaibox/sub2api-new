import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppSidebar.vue')
const componentSource = readFileSync(componentPath, 'utf8')
const headerPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppHeader.vue')
const headerSource = readFileSync(headerPath, 'utf8')
const stylePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css')
const styleSource = readFileSync(stylePath, 'utf8')

describe('AppSidebar custom SVG styles', () => {
  it('does not override uploaded SVG fill or stroke colors', () => {
    expect(componentSource).toContain('.sidebar-svg-icon {')
    expect(componentSource).toContain('color: currentColor;')
    expect(componentSource).toContain('display: block;')
    expect(componentSource).not.toContain('stroke: currentColor;')
    expect(componentSource).not.toContain('fill: none;')
  })
})

describe('AppSidebar scroll position persistence', () => {
  it('binds a template ref to the sidebar nav element', () => {
    expect(componentSource).toContain('ref="sidebarNavRef"')
    expect(componentSource).toContain('sidebar-nav')
  })

  it('declares sidebarNavRef in script setup', () => {
    expect(componentSource).toContain("const sidebarNavRef = ref<HTMLElement | null>(null)")
  })

  it('saves scroll position on beforeUnmount', () => {
    expect(componentSource).toContain('onBeforeUnmount')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('sidebarNavRef.value.scrollTop')
  })

  it('restores scroll position on mount', () => {
    expect(componentSource).toContain('onMounted')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('nextTick')
  })
})

describe('AppSidebar header styles', () => {
  it('does not clip the version badge dropdown', () => {
    const sidebarHeaderBlockMatch = styleSource.match(/\.sidebar-header\s*\{[\s\S]*?\n {2}\}/)
    const sidebarBrandBlockMatch = componentSource.match(/\.sidebar-brand\s*\{[\s\S]*?\n\}/)

    expect(sidebarHeaderBlockMatch).not.toBeNull()
    expect(sidebarBrandBlockMatch).not.toBeNull()
    expect(sidebarHeaderBlockMatch?.[0]).not.toContain('@apply overflow-hidden;')
    expect(sidebarBrandBlockMatch?.[0]).not.toContain('overflow: hidden;')
  })
})

describe('model plaza navigation', () => {
  it('places the feature-gated model plaza directly after API keys', () => {
    const apiKeysIndex = componentSource.indexOf("{ path: '/keys', label: t('nav.apiKeys')")
    const modelPlazaIndex = componentSource.indexOf("{ path: '/model-plaza', query: { embedded: '1' }")
    const aiImageIndex = componentSource.indexOf("{ path: '/ai-image', label: t('nav.aiImageWorkbench')")

    expect(apiKeysIndex).toBeGreaterThan(-1)
    expect(modelPlazaIndex).toBeGreaterThan(apiKeysIndex)
    expect(modelPlazaIndex).toBeLessThan(aiImageIndex)
    expect(componentSource).toContain('featureFlag: flagModelPlaza')
  })

  it('does not duplicate the model plaza entry in the header', () => {
    expect(headerSource).not.toContain("path: '/model-plaza'")
    expect(headerSource).not.toContain("t('nav.modelPlaza')")
  })
})

describe('usage guide navigation', () => {
  it('places the usage guide directly after channel status', () => {
    const channelStatusIndex = componentSource.indexOf("{ path: '/monitor', label: t('nav.channelStatus')")
    const usageGuideIndex = componentSource.indexOf("{ path: '/usage-guide', label: t('nav.usageGuide')")
    const subscriptionsIndex = componentSource.indexOf("{ path: '/subscriptions', label: t('nav.mySubscriptions')")

    expect(channelStatusIndex).toBeGreaterThan(-1)
    expect(usageGuideIndex).toBeGreaterThan(channelStatusIndex)
    expect(usageGuideIndex).toBeLessThan(subscriptionsIndex)
  })
})
