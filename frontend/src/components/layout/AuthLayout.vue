<template>
  <div
    class="auth-layout relative flex min-h-screen items-center justify-center overflow-hidden p-4"
    :class="{
      'auth-layout--branded': isBrandedAuth,
      'auth-layout--login': variant === 'login',
      'auth-layout--register': variant === 'register'
    }"
  >
    <!-- Background -->
    <div class="absolute inset-0 auth-layout__background"></div>

    <!-- Decorative Elements -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="auth-layout__grid absolute inset-0"></div>
      <div class="auth-layout__beam auth-layout__beam--top"></div>
      <div class="auth-layout__beam auth-layout__beam--bottom"></div>
    </div>

    <!-- Content Container -->
    <div v-if="isBrandedAuth" class="auth-login-frame relative z-10 w-full">
      <aside class="auth-login-brand">
        <a href="/home" class="auth-brand-link" aria-label="返回首页">
          <span class="auth-brand-mark">
            <img :src="siteLogo || '/logo.svg'" alt="" class="h-full w-full object-contain" />
          </span>
          <span class="auth-brand-name">{{ siteName }}</span>
        </a>

        <div class="auth-brand-copy">
          <p class="auth-brand-kicker">{{ variant === 'register' ? 'CREATE ACCOUNT' : 'AI API GATEWAY' }}</p>
          <h1>{{ variant === 'register' ? '创建账号，开始连接 AI。' : '从这里，进入你的 AI 工作台。' }}</h1>
          <p class="auth-brand-description">
            {{ variant === 'register'
              ? '建立你的账号，统一管理模型访问、API 密钥与用量。'
              : '一个账号，连接模型、密钥与用量管理。登录后即可继续使用你的控制台。' }}
          </p>
        </div>

        <div class="auth-brand-signal" aria-hidden="true">
          <div class="auth-signal-header">
            <span class="auth-signal-dot"></span>
            <span>GATEWAY STATUS</span>
            <strong>READY</strong>
          </div>
          <div class="auth-signal-line"></div>
          <div class="auth-signal-route">
            <span class="auth-signal-node">ACCOUNT</span>
            <span class="auth-signal-arrow">/</span>
            <span class="auth-signal-node auth-signal-node--accent">CONSOLE</span>
            <span class="auth-signal-arrow">/</span>
            <span class="auth-signal-node">MODELS</span>
          </div>
        </div>

        <div class="auth-brand-footer">
          <span>{{ variant === 'register' ? 'SECURE ONBOARDING' : 'SECURE ACCESS' }}</span>
          <span class="auth-brand-footer-line"></span>
          <span>{{ variant === 'register' ? '02' : '01' }}</span>
        </div>
      </aside>

      <div class="auth-login-column">
        <div class="auth-login-card card-glass rounded-2xl p-8 shadow-glass">
          <div class="auth-login-card-topline">
            <span>{{ variant === 'register' ? 'NEW ACCOUNT' : 'ACCOUNT ACCESS' }}</span>
            <span class="auth-login-card-index">{{ variant === 'register' ? 'REGISTER' : 'SIGN IN' }}</span>
          </div>
          <slot />
        </div>

        <!-- Footer Links -->
        <div class="mt-6 text-center text-sm">
          <slot name="footer" />
        </div>

        <!-- Copyright -->
        <div class="mt-8 text-center text-xs text-gray-400 dark:text-dark-500">
          &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
        </div>
      </div>
    </div>

    <div v-else class="relative z-10 w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="mb-8 text-center">
        <!-- Custom Logo or Default Logo -->
        <template v-if="settingsLoaded">
          <div
            class="mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-primary-500/30"
          >
            <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-full w-full object-contain" />
          </div>
          <h1 class="text-gradient mb-2 text-3xl font-bold">
            {{ siteName }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-dark-400">
            {{ siteSubtitle }}
          </p>
        </template>
      </div>

      <!-- Card Container -->
      <div class="card-glass rounded-2xl p-8 shadow-glass">
        <slot />
      </div>

      <!-- Footer Links -->
      <div class="mt-6 text-center text-sm">
        <slot name="footer" />
      </div>

      <!-- Copyright -->
      <div class="mt-8 text-center text-xs text-gray-400 dark:text-dark-500">
        &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'

const appStore = useAppStore()

const props = withDefaults(defineProps<{
  variant?: 'default' | 'login' | 'register'
}>(), {
  variant: 'default'
})

const variant = computed(() => props.variant)
const isBrandedAuth = computed(() => variant.value === 'login' || variant.value === 'register')

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'Subscription to API Conversion Platform')
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)

const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>

<style scoped>
.auth-layout {
  --auth-ink: #111827;
  --auth-muted: #64748b;
  --auth-line: rgba(100, 116, 139, 0.18);
  --auth-accent: #4f46e5;
  --auth-cyan: #0891b2;
  background: #f5f7fb;
}

.auth-layout:not(.auth-layout--branded) {
  background: linear-gradient(135deg, #f9fafb, rgba(238, 242, 255, 0.42), #f3f4f6);
}

.auth-layout__background {
  background: #f5f7fb;
}

.auth-layout:not(.auth-layout--branded) .auth-layout__background {
  background: linear-gradient(135deg, #f9fafb, rgba(238, 242, 255, 0.42), #f3f4f6);
}

.auth-layout:not(.auth-layout--branded) .auth-layout__grid,
.auth-layout:not(.auth-layout--branded) .auth-layout__beam {
  display: none;
}

.auth-layout__grid {
  background-image:
    linear-gradient(rgba(79, 70, 229, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 70, 229, 0.045) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, black, transparent 78%);
}

.auth-layout__beam {
  position: absolute;
  width: min(54vw, 760px);
  height: 1px;
  background: rgba(79, 70, 229, 0.22);
  box-shadow: 0 0 26px rgba(79, 70, 229, 0.18);
  transform: rotate(-24deg);
  transform-origin: left center;
}

.auth-layout__beam--top {
  top: 18%;
  right: -12%;
}

.auth-layout__beam--bottom {
  bottom: 14%;
  left: -14%;
  background: rgba(8, 145, 178, 0.18);
  box-shadow: 0 0 26px rgba(8, 145, 178, 0.16);
  transform: rotate(24deg);
}

.auth-login-frame {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 460px);
  align-items: center;
  gap: clamp(48px, 8vw, 132px);
  max-width: 1120px;
}

.auth-layout--register {
  align-items: flex-start;
  padding-top: clamp(28px, 5vh, 72px);
  padding-bottom: clamp(28px, 5vh, 72px);
}

.auth-layout--register .auth-login-frame {
  align-items: flex-start;
}

.auth-layout--register .auth-login-brand {
  min-height: min(720px, calc(100vh - 96px));
}

.auth-login-brand {
  display: flex;
  min-height: min(650px, calc(100vh - 48px));
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 0;
  color: var(--auth-ink);
}

.auth-brand-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 12px;
  color: inherit;
  font-size: 16px;
  font-weight: 750;
  text-decoration: none;
}

.auth-brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(79, 70, 229, 0.18);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.14);
}

.auth-brand-copy {
  max-width: 560px;
  padding: 8vh 0 5vh;
}

.auth-brand-kicker {
  margin: 0 0 18px;
  color: var(--auth-accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.auth-brand-copy h1 {
  max-width: 520px;
  margin: 0;
  color: var(--auth-ink);
  font-size: clamp(38px, 4.5vw, 64px);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.06;
}

.auth-brand-description {
  max-width: 440px;
  margin: 24px 0 0;
  color: var(--auth-muted);
  font-size: 16px;
  line-height: 1.75;
}

.auth-brand-signal {
  width: min(100%, 520px);
  padding: 18px 20px;
  border: 1px solid var(--auth-line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
  color: var(--auth-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.auth-signal-header,
.auth-signal-route,
.auth-brand-footer {
  display: flex;
  align-items: center;
}

.auth-signal-header {
  gap: 9px;
}

.auth-signal-header strong {
  margin-left: auto;
  color: #059669;
  font-size: 10px;
}

.auth-signal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.auth-signal-line {
  height: 1px;
  margin: 16px 0;
  background: var(--auth-line);
}

.auth-signal-route {
  gap: 10px;
  color: #475569;
}

.auth-signal-node--accent {
  color: var(--auth-accent);
  font-weight: 800;
}

.auth-signal-arrow {
  color: #94a3b8;
}

.auth-brand-footer {
  max-width: 520px;
  gap: 12px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
}

.auth-brand-footer-line {
  height: 1px;
  flex: 1;
  background: var(--auth-line);
}

.auth-login-column {
  min-width: 0;
}

.auth-login-card {
  position: relative;
  overflow: hidden;
  border-color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.11), 0 3px 12px rgba(79, 70, 229, 0.05);
}

.auth-login-card::before {
  position: absolute;
  top: 0;
  right: 28px;
  left: 28px;
  height: 2px;
  background: linear-gradient(90deg, var(--auth-accent), var(--auth-cyan));
  content: '';
}

.auth-login-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.auth-login-card-index {
  color: var(--auth-accent);
}

.dark .auth-layout {
  --auth-ink: #f8fafc;
  --auth-muted: #94a3b8;
  --auth-line: rgba(148, 163, 184, 0.16);
  background: #070b14;
}

.dark .auth-layout__background {
  background: #070b14;
}

.dark .auth-layout:not(.auth-layout--branded),
.dark .auth-layout:not(.auth-layout--branded) .auth-layout__background {
  background: linear-gradient(135deg, #020617, #111827, #020617);
}

.dark .auth-layout__grid {
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.07) 1px, transparent 1px);
}

.dark .auth-brand-mark {
  border-color: rgba(129, 140, 248, 0.28);
  background: rgba(15, 23, 42, 0.82);
}

.dark .auth-brand-signal {
  border-color: rgba(99, 102, 241, 0.2);
  background: rgba(15, 23, 42, 0.54);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dark .auth-signal-route {
  color: #cbd5e1;
}

.dark .auth-login-card {
  border-color: rgba(99, 102, 241, 0.2);
  background: rgba(15, 23, 42, 0.86);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28), 0 3px 12px rgba(99, 102, 241, 0.08);
}

@media (max-width: 820px) {
  .auth-login-frame {
    display: block;
    max-width: 480px;
  }

  .auth-login-brand,
  .auth-layout--register .auth-login-brand {
    min-height: auto;
    padding: 0 0 28px;
  }

  .auth-brand-copy {
    padding: 42px 0 0;
  }

  .auth-brand-copy h1 {
    max-width: 430px;
    font-size: 38px;
  }

  .auth-brand-description,
  .auth-brand-signal,
  .auth-brand-footer {
    display: none;
  }
}

@media (max-width: 480px) {
  .auth-layout {
    align-items: flex-start;
    padding: 20px 16px;
  }

  .auth-layout--register .auth-login-brand {
    padding-bottom: 16px;
  }

  .auth-layout--register .auth-brand-copy {
    display: none;
  }

  .auth-brand-copy {
    padding-top: 32px;
  }

  .auth-brand-copy h1 {
    font-size: 32px;
  }

  .auth-login-card {
    padding: 24px 20px;
  }
}

.text-gradient {
  @apply bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent;
}
</style>
