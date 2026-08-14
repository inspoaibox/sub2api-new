<template>
  <component :is="isPopup ? 'div' : AppLayout" :class="isPopup ? 'min-h-screen bg-gray-50 dark:bg-dark-900' : ''">
    <div class="mx-auto max-w-lg space-y-6 py-8" :class="isPopup ? 'px-4' : ''">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
      <div v-else-if="initError" class="card p-8 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Icon name="exclamationCircle" size="xl" class="text-red-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('payment.stripeLoadFailed') }}</h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ initError }}</p>
        <button class="btn btn-primary mt-6" @click="closePaymentWindow">{{ t('payment.qr.closePaymentWindow') }}</button>
      </div>
      <template v-else>
        <!-- 金额头部 -->
        <div v-if="order" class="card overflow-hidden">
          <div class="bg-gradient-to-br from-[#635bff] to-[#4f46e5] px-6 py-6 text-center">
            <p class="text-sm font-medium text-indigo-200">{{ t('payment.actualPay') }}</p>
            <p class="mt-1 text-3xl font-bold text-white">{{ formatGatewayAmount(order.pay_amount) }}</p>
          </div>
        </div>

        <!-- 微信二维码展示 -->
        <template v-if="wechatQrUrl">
          <div class="card p-6">
            <div class="flex flex-col items-center space-y-4">
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('payment.qr.scanWxpay') }}</p>
              <div class="rounded-lg border-2 border-[#2BB741] bg-white p-3 dark:border-[#2BB741]/70">
                <img :src="wechatQrUrl" alt="WeChat Pay QR" class="wechat-qr-image block h-auto max-w-full" />
              </div>
              <p class="text-center text-sm text-gray-500 dark:text-gray-400">{{ t('payment.qr.scanWxpayHint') }}</p>
              <button class="btn btn-secondary w-full" type="button" @click="closePaymentWindow">
                <Icon name="x" size="sm" />
                {{ t('payment.qr.closePaymentWindow') }}
              </button>
            </div>
          </div>
          <div class="card p-4 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('payment.qr.waitingPayment') }}</p>
          </div>
        </template>

        <!-- 支付宝跳转状态 -->
        <template v-else-if="redirecting">
          <div class="card p-6">
            <div class="flex flex-col items-center space-y-4 py-4">
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-[#00AEEF] border-t-transparent"></div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('payment.qr.payInNewWindowHint') }}</p>
            </div>
          </div>
        </template>

        <!-- 成功状态 -->
        <template v-else-if="stripeSuccess">
          <div class="card p-6 text-center">
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Icon name="check" size="lg" class="text-green-500" />
              </div>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ t('payment.result.success') }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('payment.stripeSuccessProcessing') }}</p>
            </div>
          </div>
        </template>

        <template v-else-if="stripeProcessing">
          <div class="card p-6 text-center">
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ t('payment.result.processing') }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('payment.stripePaymentProcessing') }}</p>
            </div>
          </div>
        </template>

        <!-- 无指定方式或未知方式时展示完整 Payment Element -->
        <template v-else-if="showPaymentElement">
          <div class="card p-6">
            <div id="stripe-payment-element" class="min-h-[200px]"></div>
            <p v-if="stripeError" class="mt-4 text-sm text-red-600 dark:text-red-400">{{ stripeError }}</p>
            <button class="btn btn-stripe mt-6 w-full py-3 text-base" :disabled="stripeSubmitting || !stripeReady" @click="handleGenericPay">
              <span v-if="stripeSubmitting" class="flex items-center justify-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                {{ t('common.processing') }}
              </span>
              <span v-else>{{ t('payment.stripePay') }}</span>
            </button>
          </div>
          <div class="text-center">
            <button class="btn btn-secondary" @click="closePaymentWindow">{{ t('payment.qr.closePaymentWindow') }}</button>
          </div>
        </template>

        <!-- 错误状态 -->
        <div v-if="stripeError && !showPaymentElement" class="card p-4">
          <p class="text-sm text-red-600 dark:text-red-400">{{ stripeError }}</p>
          <button class="btn btn-secondary mt-3 w-full" @click="closePaymentWindow">{{ t('payment.qr.closePaymentWindow') }}</button>
        </div>
      </template>
    </div>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { PAYMENT_RECOVERY_STORAGE_KEY, readPaymentRecoverySnapshot } from '@/components/payment/paymentFlow'
import { resolveStripeWechatQrImage, type StripeWechatQrCode } from '@/components/payment/stripeWechatQr'
import type { PaymentOrder } from '@/types/payment'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'

const i18n = useI18n()
const { t } = i18n
const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()

// Direct Stripe methods use the compact checkout shell without AppLayout.
const isPopup = computed(() => !!route.query.method)

const loading = ref(true)
const initError = ref('')
const stripeError = ref('')
const stripeSubmitting = ref(false)
const stripeSuccess = ref(false)
const stripeProcessing = ref(false)
const stripeReady = ref(false)
const selectedPaymentType = ref('')
const stripeClientSecret = ref('')
const order = ref<PaymentOrder | null>(null)
const currency = ref('CNY')
const wechatQrUrl = ref('')
const redirecting = ref(false)
const showPaymentElement = ref(false)

function closePaymentWindow() {
  if (window.opener && !window.opener.closed) {
    window.close()
    return
  }
  router.push('/purchase')
}

let stripeInstance: Stripe | null = null
let elementsInstance: StripeElements | null = null
let redirectTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  const orderId = Number(route.query.order_id)
  let clientSecret = String(route.query.client_secret || '')
  let publishableKey = String(route.query.publishable_key || '')
  const method = String(route.query.method || '')
  const resumeToken = typeof route.query.resume_token === 'string' ? route.query.resume_token : undefined

  if (!orderId) {
    loading.value = false
    initError.value = t('payment.stripeMissingParams')
    return
  }

  try {
    if (typeof window !== 'undefined') {
      const restored = readPaymentRecoverySnapshot(
        window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY),
        { resumeToken },
      )
      if (restored?.orderId === orderId) {
        currency.value = normalizePaymentCurrency(restored.currency)
        clientSecret = clientSecret || restored.clientSecret
        publishableKey = publishableKey || restored.publishableKey || ''
      }
    }
    if (!clientSecret) {
      initError.value = t('payment.stripeMissingParams')
      return
    }
    stripeClientSecret.value = clientSecret
    const res = await paymentAPI.getOrder(orderId)
    order.value = res.data
    if (res.data.currency) {
      currency.value = normalizePaymentCurrency(res.data.currency)
    }

    if (!publishableKey) {
      await paymentStore.fetchConfig()
      publishableKey = paymentStore.config?.stripe_publishable_key || ''
    }
    if (!publishableKey) { initError.value = t('payment.stripeNotConfigured'); return }

    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const stripe = await loadStripe(publishableKey)
    if (!stripe) { initError.value = t('payment.stripeLoadFailed'); return }

    stripeInstance = stripe
    loading.value = false

    // 指定方式直接确认，无需渲染完整 Payment Element
    if (method === 'alipay') {
      await confirmAlipay(stripe, clientSecret, orderId)
    } else if (method === 'wechat_pay') {
      await confirmWechatPay(stripe, clientSecret)
    } else {
      // Card and Link render through Payment Element. The backend has already
      // limited the PaymentIntent to the selected method.
      showPaymentElement.value = true
      await nextTick()
      mountPaymentElement(stripe, clientSecret, method)
    }
  } catch (err: unknown) {
    initError.value = extractI18nErrorMessage(err, t, 'payment.errors', t('payment.stripeLoadFailed'))
  } finally {
    loading.value = false
  }
})

const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

function formatGatewayAmount(value: number): string {
  return formatPaymentAmount(value, currency.value, localeCode.value)
}

async function confirmAlipay(stripe: Stripe, clientSecret: string, orderId: number) {
  redirecting.value = true
  const returnUrl = window.location.origin + '/payment/result?order_id=' + orderId + '&status=success'
  const { error } = await stripe.confirmAlipayPayment(clientSecret, { return_url: returnUrl })
  if (error) {
    redirecting.value = false
    stripeError.value = error.message || t('payment.result.failed')
  }
  // 无错误时 Stripe 会自动跳转
}

async function confirmWechatPay(stripe: Stripe, clientSecret: string) {
  const { paymentIntent, error } = await (stripe as Stripe & {
    confirmWechatPayPayment: (
      cs: string,
      data: Record<string, unknown>,
      options: { handleActions: false },
    ) => Promise<{
      paymentIntent?: {
        status: string
        next_action?: { wechat_pay_display_qr_code?: StripeWechatQrCode }
      }
      error?: { message?: string }
    }>
  }).confirmWechatPayPayment(clientSecret, {
    payment_method_options: { wechat_pay: { client: 'web' } },
  }, { handleActions: false })

  if (error) {
    stripeProcessing.value = false
    wechatQrUrl.value = ''
    stripeError.value = error.message || t('payment.result.failed')
    return
  }

  // 从 next_action 中提取二维码
  const qrImage = await resolveStripeWechatQrImage(paymentIntent?.next_action?.wechat_pay_display_qr_code)
  if (qrImage) {
    wechatQrUrl.value = qrImage
    stripeProcessing.value = false
    // 轮询支付完成状态
    startPolling()
  } else if (paymentIntent?.status === 'succeeded') {
    stripeProcessing.value = true
    startPolling()
  } else {
    // The user may close a payment layer before scanning. Keep the order
    // pending and continue checking the backend instead of treating it as a failure.
    stripeProcessing.value = true
    startPolling()
  }
}

function stripePaymentMethodOrder(preferredMethod: string): string[] {
  const order = ['card', 'link', 'alipay', 'wechat_pay']
  if (!order.includes(preferredMethod)) return order
  return [preferredMethod, ...order.filter(method => method !== preferredMethod)]
}

function mountPaymentElement(stripe: Stripe, clientSecret: string, preferredMethod = '') {
  const isDark = document.documentElement.classList.contains('dark')
  const elements = stripe.elements({
    clientSecret,
    appearance: { theme: isDark ? 'night' : 'stripe', variables: { borderRadius: '8px' } },
  })
  elementsInstance = elements
  const paymentElement = elements.create('payment', {
    layout: 'tabs',
    paymentMethodOrder: stripePaymentMethodOrder(preferredMethod),
  } as Record<string, unknown>)
  paymentElement.mount('#stripe-payment-element')
  paymentElement.on('ready', () => { stripeReady.value = true })
  paymentElement.on('change', (event: { value?: { type?: string } }) => {
    selectedPaymentType.value = event.value?.type || ''
  })
}

async function handleGenericPay() {
  if (!stripeInstance || !elementsInstance || stripeSubmitting.value) return
  stripeSubmitting.value = true
  stripeError.value = ''
  try {
    // Stripe Payment Element 的微信支付确认会自行打开可关闭的二维码层。
    // 直接调用确认接口拿二维码，本站展示二维码，避免关闭层被误判为已提交成功。
    if (selectedPaymentType.value === 'wechat_pay') {
      await confirmWechatPay(stripeInstance, stripeClientSecret.value)
      return
    }

    const { error } = await stripeInstance.confirmPayment({
      elements: elementsInstance,
      confirmParams: {
        return_url: window.location.origin + '/payment/result?order_id=' + route.query.order_id + '&status=success',
      },
      redirect: 'if_required',
    })
    if (error) {
      stripeError.value = error.message || t('payment.result.failed')
    } else {
      stripeProcessing.value = true
      startPolling()
    }
  } catch (err: unknown) {
    stripeError.value = extractI18nErrorMessage(err, t, 'payment.errors', t('payment.result.failed'))
  } finally {
    stripeSubmitting.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
let pollStartedAt = 0
let pollInFlight = false

const PAYMENT_POLL_INTERVAL_MS = 3000
const PAYMENT_POLL_TIMEOUT_MS = 10 * 60 * 1000

function startPolling() {
  const orderId = Number(route.query.order_id)
  if (!orderId) return

  if (pollTimer) clearInterval(pollTimer)
  pollStartedAt = Date.now()
  pollInFlight = false

  const checkStatus = async () => {
    if (pollInFlight) return
    pollInFlight = true
    try {
      const o = await paymentStore.pollOrderStatus(orderId)
      if (!o) return
      const status = String(o.status || '').trim().toUpperCase()
      if (status === 'COMPLETED') {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
        stripeProcessing.value = false
        stripeSuccess.value = true
        wechatQrUrl.value = ''
        scheduleClose()
      } else if (status === 'EXPIRED' || status === 'CANCELLED' || status === 'FAILED') {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
        stripeProcessing.value = false
        wechatQrUrl.value = ''
        stripeError.value = t('payment.result.failed')
      }
    } finally {
      pollInFlight = false
    }
  }

  void checkStatus()
  pollTimer = setInterval(() => {
    if (Date.now() - pollStartedAt >= PAYMENT_POLL_TIMEOUT_MS) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      stripeProcessing.value = false
      wechatQrUrl.value = ''
      stripeError.value = t('payment.stripePaymentTimeout')
      return
    }
    void checkStatus()
  }, PAYMENT_POLL_INTERVAL_MS)
}

function scheduleClose() {
  if (window.opener) {
    redirectTimer = setTimeout(() => { window.close() }, 2000)
  } else {
    redirectTimer = setTimeout(() => {
      router.push({ path: '/payment/result', query: { order_id: String(route.query.order_id || ''), status: 'success' } })
    }, 2000)
  }
}

onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.wechat-qr-image {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
