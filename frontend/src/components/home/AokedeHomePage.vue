<template>
  <div class="aokede-home" data-testid="aokede-home" :data-theme="themeName">
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <a class="skip-link" href="#main-content">跳过导航，直接访问主要内容</a>

    <header class="site-nav">
      <div class="container nav-container">
        <RouterLink class="nav-logo" to="/home">
          <img class="logo-img" :src="siteLogo" :alt="`${displaySiteName} Logo`" />
          <span>{{ displaySiteName }}</span>
        </RouterLink>

        <ul class="nav-links">
          <li><a href="#features">接口优势</a></li>
          <li><a href="#playground">接入示例</a></li>
          <li><a href="#pricing">计费说明</a></li>
          <li><a href="#faq">常见问题</a></li>
        </ul>

        <div class="nav-actions">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            class="theme-toggle"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="查看文档"
          >
            <Icon name="book" size="md" />
          </a>
          <button class="theme-toggle" type="button" :aria-label="themeToggleLabel" @click="emit('toggle-theme')">
            <svg v-if="isDark" class="sun-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
            <svg v-else class="moon-icon" viewBox="0 0 24 24">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </button>
          <RouterLink class="btn btn-secondary btn-small" to="/login">登录</RouterLink>
          <RouterLink class="btn btn-primary btn-small" :to="primaryCtaPath">控制台</RouterLink>
        </div>
      </div>
    </header>

    <main id="main-content">
      <section class="hero-section">
        <div class="container hero-grid">
          <div class="hero-content reveal is-visible">
            <div class="hero-badge">
              <span class="hero-badge-dot"></span>
              <span>专为开发者与 AI 创新业务打造</span>
            </div>
            <h1>
              一个 API 密钥，<br />
              <span class="text-gradient">调通全球主流 AI 模型</span>
            </h1>
            <p class="hero-description">
              {{ heroSubtitle }}
            </p>
            <div class="hero-actions">
              <RouterLink class="btn btn-primary" :to="primaryCtaPath">
                {{ isAuthenticated ? '进入控制台' : '开始免费调试' }}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </RouterLink>
              <a class="btn btn-secondary" href="#playground">查看 SDK 代码示例</a>
            </div>
            <div class="hero-features-list">
              <span v-for="feature in heroFeatures" :key="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ feature }}
              </span>
            </div>
          </div>

          <div class="hero-visual reveal reveal-delay-1 is-visible">
            <div class="simulator-card">
              <div class="simulator-header">
                <span class="sim-tag">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  实时网络中转状态
                </span>
                <span class="sim-live-badge"><span></span>LIVE MONITOR</span>
              </div>

              <div class="sim-flow">
                <div class="sim-node" :class="{ active: simulatorStage === 'client' }">
                  <div class="node-icon-bg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div class="node-info">
                    <strong>开发者 SDK 客户端</strong>
                    <span>baseURL = window.location.origin</span>
                  </div>
                </div>

                <div class="sim-rail"><div class="sim-dot" :class="{ animating: simulatorStage === 'client' }"></div></div>

                <div class="sim-node" :class="{ active: simulatorStage === 'gateway', 'success-glow': simulatorStage === 'success' }">
                  <div class="node-icon-bg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div class="node-info">
                    <strong>Aokede API 直连中枢</strong>
                    <span>{{ gatewayLog }}</span>
                  </div>
                </div>

                <div class="sim-rail"><div class="sim-dot" :class="{ animating: simulatorStage === 'gateway' }"></div></div>

                <div class="upstream-list">
                  <div
                    v-for="upstream in simulatedUpstreams"
                    :key="upstream.key"
                    class="upstream-node"
                    :class="{ selected: simulatorStage === 'success' && simulatorTarget.key === upstream.key }"
                  >
                    <span class="upstream-logo">{{ upstream.logo }}</span>
                    <span>{{ upstream.model }}</span>
                  </div>
                </div>
              </div>

              <div class="sim-metrics">
                <div class="sim-metric status-ok">
                  <span class="metric-title">请求状态</span>
                  <span class="metric-data">{{ simulatorStatus }}</span>
                </div>
                <div class="sim-metric">
                  <span class="metric-title">网络时延</span>
                  <span class="metric-data">{{ simulatorLatency }}</span>
                </div>
                <div class="sim-metric">
                  <span class="metric-title">目标模型</span>
                  <span class="metric-data">{{ simulatorTarget.model }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="partners-section">
        <div class="container partners-wrapper">
          <span class="partners-title">支持对接的高级模型提供商</span>
          <div class="partners-list">
            <div v-for="partner in partners" :key="partner.name" class="partner-item">
              <span class="partner-icon">{{ partner.logo }}</span>{{ partner.name }}
            </div>
          </div>
        </div>
      </section>

      <section class="section-padding" id="features">
        <div class="container">
          <div class="section-header reveal is-visible">
            <span class="section-badge">一站式开发接入</span>
            <h2>更稳定、更快速的 AI 研发体验</h2>
            <p>从本地开发调试到高并发线上生产环境，我们为您解决跨模型集成、网络阻塞以及复杂的境外支付限制。</p>
          </div>

          <div class="bento-grid">
            <div class="bento-card bento-card-large reveal is-visible">
              <div class="bento-content">
                <div class="bento-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
                <h3>零学习成本，一行代码平滑集成</h3>
                <p>100% 兼容官方 OpenAI API 规范。无需学习新的开发库，直接将已有 OpenAI 项目的 baseURL 重定向到 Aokede Gateway，即可调用 Claude、DeepSeek、Gemini 等主流模型。</p>
              </div>
              <div class="bento-visual-wrapper">
                <div class="bento-lb-widget">
                  <div class="bento-lb-row">
                    <span class="bento-lb-name">原项目官方配置 (OpenAI)</span>
                    <div class="bento-lb-bar"><div class="bento-lb-fill bento-fill-muted"></div></div>
                    <span class="bento-lb-ms muted">需要科学上网</span>
                  </div>
                  <div class="bento-lb-row">
                    <span class="bento-lb-name success">替换为 Aokede (直连网关)</span>
                    <div class="bento-lb-bar"><div class="bento-lb-fill bento-fill-success"></div></div>
                    <span class="bento-lb-ms success">国内多线直连 · 稳定</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-for="feature in bentoFeatures" :key="feature.title" class="bento-card reveal is-visible">
              <div class="bento-icon">
                <svg v-if="feature.icon === 'layers'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
              <div v-if="feature.rows" class="bento-endpoints">
                <div v-for="row in feature.rows" :key="row.label" class="bento-endpoint-row">
                  <span>{{ row.label }}</span>
                  <span>{{ row.value }}</span>
                </div>
              </div>
            </div>

            <div class="bento-card bento-card-large reveal is-visible">
              <div class="bento-visual-wrapper">
                <div class="bento-lb-widget">
                  <div class="bento-lb-row">
                    <span>API Key: key_test_project</span>
                    <span>限额已设: ¥100.00 / 活跃</span>
                  </div>
                  <div class="bento-lb-row">
                    <span>API Key: key_production_app</span>
                    <span>高并发高 QPS 保证 / 活跃</span>
                  </div>
                </div>
              </div>
              <div class="bento-content">
                <div class="bento-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3>独立 API 密钥分配与防刷限额</h3>
                <p>为不同应用、测试环境或下层用户分别分发 API 令牌。可设定令牌最大可用额度，防止业务死循环或恶意请求导致额度暴刷。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-padding playground-section" id="playground">
        <div class="container playground-grid">
          <div class="playground-info reveal is-visible">
            <span class="section-badge">一分钟开箱即用</span>
            <h2>更改 baseURL，<br />立刻完成大模型对接</h2>
            <p>无论您使用 OpenAI 原生 SDK，还是 LangChain、LlamaIndex 或网页应用模板，都只需替换 API 端点和密钥即可平滑工作。</p>
            <div class="code-tabs-wrapper">
              <button
                v-for="template in codeTemplates"
                :key="template.lang"
                class="code-tab"
                :class="{ active: activeCodeLang === template.lang }"
                type="button"
                @click="activeCodeLang = template.lang"
              >
                {{ template.label }}
              </button>
            </div>
          </div>

          <div class="reveal reveal-delay-1 is-visible">
            <div class="terminal-box">
              <div class="terminal-header">
                <div class="terminal-dots">
                  <span class="terminal-dot"></span>
                  <span class="terminal-dot"></span>
                  <span class="terminal-dot"></span>
                </div>
                <span class="terminal-lang">{{ activeCodeLabel }}</span>
                <button class="btn-copy" type="button" @click="copyActiveCode">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{{ copyButtonText }}</span>
                </button>
              </div>
              <div class="terminal-body">
                <pre><code>{{ activeCode }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-padding" id="pricing">
        <div class="container">
          <div class="section-header reveal is-visible">
            <span class="section-badge">按量计费 · 无月租</span>
            <h2>弹性透明的按量付费模式</h2>
            <p>无需绑定昂贵的固定包月套餐。按实际 API 请求量与 Token 消耗精准结算，用多少付多少。</p>
          </div>

          <div class="payg-grid">
            <div class="payg-table-card reveal is-visible">
              <div class="payg-table-header">
                <h3>主流模型公开费率示例</h3>
                <span>直连官方原价计费 · 汇率以 1 USD = 7.2 CNY 实时折算扣费</span>
              </div>
              <div class="payg-table">
                <div class="payg-th">
                  <span>模型名称</span>
                  <span>输入费率</span>
                  <span>输出费率</span>
                </div>
                <div v-for="model in pricingModels" :key="model.name" class="payg-tr">
                  <span class="model-cell">
                    <span class="model-badge" :class="model.badgeClass">{{ model.logo }}</span>
                    <strong>{{ model.name }}</strong>
                  </span>
                  <span>{{ model.input }} <small>{{ model.inputCny }}</small></span>
                  <span>{{ model.output }} <small>{{ model.outputCny }}</small></span>
                </div>
              </div>
              <div class="payg-table-footer">
                <p>* 以上费率换算以官方 API 定价为准，详细多模型费率及权重系数请在登录控制台后查看。</p>
              </div>
            </div>

            <div class="payg-flow reveal reveal-delay-1 is-visible">
              <div v-for="step in paySteps" :key="step.num" class="payg-flow-card">
                <div class="flow-num-badge">{{ step.num }}</div>
                <div class="flow-info">
                  <h4>{{ step.title }}</h4>
                  <p>{{ step.description }}</p>
                </div>
              </div>
              <div class="payg-flow-action">
                <RouterLink class="btn btn-primary full-width" :to="primaryCtaPath">
                  立即开通并充值额度
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-padding" id="faq">
        <div class="container">
          <div class="section-header reveal is-visible">
            <span class="section-badge">解决您的疑惑</span>
            <h2>常见问题解答 (FAQ)</h2>
            <p>在决定接入前，或许您想了解这些关于网关性能、计费机制以及数据隐私的问题。</p>
          </div>

          <div class="faq-wrapper reveal is-visible">
            <div
              v-for="(item, index) in faqItems"
              :key="item.question"
              class="faq-item"
              :class="{ active: openFaqIndex === index }"
            >
              <button class="faq-question" type="button" @click="toggleFaq(index)">
                <span>{{ item.question }}</span>
                <span class="faq-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </button>
              <div class="faq-answer">
                <div class="faq-answer-inner">{{ item.answer }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="container cta-section reveal is-visible">
        <div class="cta-card">
          <h2>下一次模型调用，从更稳定的入口开始</h2>
          <p>不再担心单一上游服务报错引起产品宕机。将你的应用立刻接入 Aokede Gateway，享受强韧调度与多租户隔离计费体验。</p>
          <div class="cta-actions">
            <RouterLink class="btn btn-primary" :to="primaryCtaPath">进入控制台</RouterLink>
            <RouterLink v-if="registrationEnabled" class="btn btn-secondary" to="/register">免费注册账号</RouterLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-brand-title">
              <img class="logo-img footer-logo" :src="siteLogo" :alt="`${displaySiteName} Logo`" />
              <span class="footer-name">{{ displaySiteName }}</span>
            </div>
            <p>稳定、统一、高可用的企业级 AI API 接入中转与资源调度网关系统。</p>
          </div>
          <ul class="footer-links">
            <li><RouterLink to="/login">用户登录</RouterLink></li>
            <li v-if="registrationEnabled"><RouterLink to="/register">注册账号</RouterLink></li>
            <li><a :href="docUrl || '#playground'" :target="docUrl ? '_blank' : undefined" :rel="docUrl ? 'noopener noreferrer' : undefined">开发者文档</a></li>
            <li><a href="#pricing">收费细则</a></li>
          </ul>
        </div>
        <div class="footer-bottom">
          <p>© {{ currentYear }} {{ displaySiteName }}. All Rights Reserved.</p>
          <p>Powered by Sub2API Admin Service Node</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'

type CodeLang = 'curl' | 'python' | 'javascript' | 'go'
type SimulatorStage = 'idle' | 'client' | 'gateway' | 'success'

interface SimulatedUpstream {
  key: string
  logo: string
  model: string
  latencyRange: [number, number]
}

const props = withDefaults(defineProps<{
  siteName?: string
  siteLogo?: string
  siteSubtitle?: string
  docUrl?: string
  isDark?: boolean
  isAuthenticated?: boolean
  dashboardPath?: string
  registrationEnabled?: boolean
  currentYear?: number
}>(), {
  siteName: '',
  siteLogo: '/aokede-logo.png',
  siteSubtitle: '',
  docUrl: '',
  isDark: true,
  isAuthenticated: false,
  dashboardPath: '/dashboard',
  registrationEnabled: false,
  currentYear: new Date().getFullYear(),
})

const emit = defineEmits<{
  'toggle-theme': []
}>()

const defaultSiteName = 'Aokede Gateway'
const defaultSubtitle = '国内多线直连加速，完美兼容 OpenAI 原生 SDK 规范。免去境外多平台注册与绑卡繁琐，聚合调度 GPT、Claude、DeepSeek 和 Gemini 接口，助您的 AI 产品秒级平滑接入。'
const displaySiteName = computed(() => props.siteName?.trim() || defaultSiteName)
const heroSubtitle = computed(() => props.siteSubtitle?.trim() || defaultSubtitle)
const themeName = computed(() => props.isDark ? 'dark' : 'light')
const themeToggleLabel = computed(() => props.isDark ? '切换为亮色模式' : '切换为暗色模式')
const primaryCtaPath = computed(() => props.isAuthenticated ? props.dashboardPath : '/login')
const apiOrigin = computed(() => (typeof window === 'undefined' ? 'https://aokede.com' : window.location.origin))

const heroFeatures = ['国内多线直连加速', '官方 SDK 100% 兼容']
const partners = [
  { logo: 'O', name: 'OpenAI' },
  { logo: 'A', name: 'Anthropic' },
  { logo: 'G', name: 'Google Gemini' },
  { logo: 'D', name: 'DeepSeek' },
  { logo: 'L', name: 'Llama' },
]

const simulatedUpstreams: SimulatedUpstream[] = [
  { key: 'openai', logo: 'O', model: 'GPT-5.6', latencyRange: [8, 12] },
  { key: 'claude', logo: 'A', model: 'Claude 5', latencyRange: [9, 15] },
  { key: 'deepseek', logo: 'D', model: 'DeepSeek-V4', latencyRange: [11, 20] },
  { key: 'gemini', logo: 'G', model: 'Gemini 3.1', latencyRange: [7, 14] },
]

const simulatorStage = ref<SimulatorStage>('idle')
const simulatorTarget = ref<SimulatedUpstream>(simulatedUpstreams[0])
const simulatorStatus = ref('--')
const simulatorLatency = ref('--')
const gatewayLog = ref('就绪 · 监听请求')
const simulatorTimer = ref<number | undefined>()

const bentoFeatures = [
  {
    title: '网络链路多区域加速',
    description: '基于全球 BGP 优质路由与高防安全边缘节点，支持国内网络环境直接高速访问大模型上游，减少高超时率和异常断开。',
    icon: 'layers',
    rows: [
      { label: '直连网络', value: 'CN2 / BGP 多线接入' },
      { label: '加速表现', value: '请求耗时平均缩短 30%+' },
    ],
  },
  {
    title: 'SSE 流式输出与函数调用',
    description: '支持 Server-Sent Events 流式响应，以及 Agent 开发中常用的工具函数调用、结构化输出与多轮对话状态保持。',
    icon: 'lock',
  },
]

const activeCodeLang = ref<CodeLang>('curl')
const copyButtonText = ref('复制代码')
const codeTemplates = computed(() => [
  {
    lang: 'curl' as const,
    label: 'cURL',
    code: `curl -X POST "${apiOrigin.value}/v1/chat/completions" \\
  -H "Authorization: Bearer $AOKEDE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.6",
    "messages": [{"role": "user", "content": "你好，Aokede Gateway！"}]
  }'`,
  },
  {
    lang: 'python' as const,
    label: 'Python',
    code: `# pip install openai
from openai import OpenAI

client = OpenAI(
    api_key="your_aokede_key_here",
    base_url="${apiOrigin.value}/v1"
)

response = client.chat.completions.create(
    model="claude-5-sonnet",
    messages=[{"role": "user", "content": "你好，Aokede Gateway！"}]
)
print(response.choices[0].message.content)`,
  },
  {
    lang: 'javascript' as const,
    label: 'Node.js',
    code: `// npm install openai
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "your_aokede_key_here",
  baseURL: "${apiOrigin.value}/v1"
});

const response = await client.chat.completions.create({
  model: "deepseek-v4",
  messages: [{ role: "user", content: "你好，Aokede Gateway！" }]
});
console.log(response.choices[0].message.content);`,
  },
  {
    lang: 'go' as const,
    label: 'Go',
    code: `package main

import (
  "context"
  "fmt"
  "github.com/sashabaranov/go-openai"
)

func main() {
  config := openai.DefaultConfig("your_aokede_key_here")
  config.BaseURL = "${apiOrigin.value}/v1"
  client := openai.NewClientWithConfig(config)

  resp, _ := client.CreateChatCompletion(
    context.Background(),
    openai.ChatCompletionRequest{
      Model: "gemini-3.1-pro",
      Messages: []openai.ChatCompletionMessage{
        {Role: openai.ChatMessageRoleUser, Content: "你好，Aokede Gateway！"},
      },
    },
  )
  fmt.Println(resp.Choices[0].Message.Content)
}`,
  },
])

const activeTemplate = computed(() => codeTemplates.value.find((template) => template.lang === activeCodeLang.value) || codeTemplates.value[0])
const activeCode = computed(() => activeTemplate.value.code)
const activeCodeLabel = computed(() => activeTemplate.value.lang === 'javascript' ? 'nodejs' : activeTemplate.value.lang)

const pricingModels = [
  { logo: 'O', badgeClass: 'op-badge', name: 'GPT-5.6 (Sol)', input: '$5.00', inputCny: '(¥36.00)', output: '$15.00', outputCny: '(¥108.00)' },
  { logo: 'A', badgeClass: 'cl-badge', name: 'Claude 5 Sonnet', input: '$3.00', inputCny: '(¥21.60)', output: '$15.00', outputCny: '(¥108.00)' },
  { logo: 'D', badgeClass: 'ds-badge', name: 'DeepSeek-V4', input: '$0.14', inputCny: '(¥1.00)', output: '$0.28', outputCny: '(¥2.00)' },
  { logo: 'G', badgeClass: 'ge-badge', name: 'Gemini 3.1 Pro', input: '$1.25', inputCny: '(¥9.00)', output: '$3.75', outputCny: '(¥27.00)' },
]

const paySteps = [
  { num: '01', title: '弹性账户，按需充值', description: '支持多种支付渠道快速充值，零固定包月门槛。充值余额永久有效，支持随时查看余额明细。' },
  { num: '02', title: 'Token 级实时扣费', description: 'API 请求成功后，系统按模型消耗的 Token 额度毫秒级扣减，未成功调用的请求不扣费。' },
  { num: '03', title: '流水透明，账单可溯', description: '控制台提供详实请求日志与对账记录，支持按 API Key、模型和时间筛选并导出流水。' },
]

const faqItems = [
  {
    question: '我是否需要修改现有的 AI 应用代码或类库逻辑？',
    answer: '完全不需要。API 协议与 OpenAI API 标准兼容。如果您使用官方 openai Python/Node SDK、LangChain、LlamaIndex 等，只需将 baseURL 或 base_url 替换为网关地址，并更换 apiKey 即可。',
  },
  {
    question: '国内直连访问是否稳定？延迟表现怎么样？',
    answer: '网关通过优质网络链路与边缘节点降低跨境访问的不确定性，开发机或服务器无需额外本地代理即可更稳定地访问大模型上游。',
  },
  {
    question: '接口支持 Server-Sent Events (SSE) 流式返回与函数调用吗？',
    answer: '支持。流式打字机响应、Function Calling/Tool Calls、结构化 JSON 输出和多轮对话参数都会尽量保持与上游官方行为一致。',
  },
  {
    question: '充值额度有有效期限制吗？如何查看扣费明细？',
    answer: '余额和计费策略以后台配置为准。每次调用产生的费用会生成账单流水，用户可在控制台查看请求日志、余额变化和历史消费明细。',
  },
]
const openFaqIndex = ref<number | null>(0)

function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? null : index
}

async function copyActiveCode() {
  try {
    await copyText(activeCode.value)
    copyButtonText.value = '已复制！'
  } catch {
    copyButtonText.value = '复制失败'
  }

  window.setTimeout(() => {
    copyButtonText.value = '复制代码'
  }, 1800)
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) {
    throw new Error('Copy failed')
  }
}

function scheduleSimulation(delay = 0) {
  simulatorTimer.value = window.setTimeout(runSimulationCycle, delay)
}

function runSimulationCycle() {
  const target = simulatedUpstreams[Math.floor(Math.random() * simulatedUpstreams.length)]
  simulatorTarget.value = target
  simulatorStatus.value = '--'
  simulatorLatency.value = '--'
  simulatorStage.value = 'client'
  gatewayLog.value = '接收请求...'

  window.setTimeout(() => {
    simulatorStage.value = 'gateway'
    gatewayLog.value = `路由调度 -> ${target.model}`
  }, 600)

  window.setTimeout(() => {
    const latency = Math.floor(Math.random() * (target.latencyRange[1] - target.latencyRange[0] + 1)) + target.latencyRange[0]
    simulatorStage.value = 'success'
    gatewayLog.value = '已转发并记账 OK'
    simulatorStatus.value = '200 OK'
    simulatorLatency.value = `${latency} ms`
  }, 1200)

  window.setTimeout(() => {
    simulatorStage.value = 'idle'
    gatewayLog.value = '就绪 · 监听请求'
  }, 2500)

  scheduleSimulation(3800)
}

onMounted(() => {
  scheduleSimulation(800)
})

onBeforeUnmount(() => {
  if (simulatorTimer.value) {
    window.clearTimeout(simulatorTimer.value)
  }
})
</script>

<style scoped>
.aokede-home {
  --container: 1200px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-normal: 0.35s var(--ease-out);
  --transition-fast: 0.15s var(--ease-out);
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --bg: #030712;
  --bg-gradient: radial-gradient(circle at top, #0b1129 0%, #030712 100%);
  --surface: rgba(15, 23, 42, 0.6);
  --surface-hover: rgba(30, 41, 59, 0.8);
  --surface-soft: rgba(15, 23, 42, 0.4);
  --glass-bg: rgba(10, 15, 30, 0.7);
  --ink: #f8fafc;
  --ink-soft: #e2e8f0;
  --muted: #64748b;
  --line: rgba(99, 102, 241, 0.12);
  --line-strong: rgba(99, 102, 241, 0.25);
  --accent: #6366f1;
  --accent-secondary: #ec4899;
  --accent-cyan: #06b6d4;
  --accent-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  --accent-glow: rgba(99, 102, 241, 0.15);
  --success: #10b981;
  --success-glow: rgba(16, 185, 129, 0.15);
  --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 50px rgba(99, 102, 241, 0.12), 0 0 20px rgba(236, 72, 153, 0.08);
  --code-bg: #070a13;
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  background: var(--bg);
  background-image: var(--bg-gradient);
  color: var(--ink);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
}

.aokede-home[data-theme='light'] {
  --bg: #f8fafc;
  --bg-gradient: radial-gradient(circle at top, #eef2ff 0%, #f8fafc 100%);
  --surface: rgba(255, 255, 255, 0.75);
  --surface-hover: rgba(255, 255, 255, 0.95);
  --surface-soft: rgba(241, 245, 249, 0.6);
  --glass-bg: rgba(255, 255, 255, 0.8);
  --ink: #0f172a;
  --ink-soft: #334155;
  --muted: #64748b;
  --line: rgba(99, 102, 241, 0.08);
  --line-strong: rgba(99, 102, 241, 0.18);
  --accent: #4f46e5;
  --accent-secondary: #db2777;
  --accent-cyan: #0891b2;
  --accent-glow: rgba(79, 70, 229, 0.08);
  --success-glow: rgba(16, 185, 129, 0.08);
  --shadow-sm: 0 2px 8px rgba(99, 102, 241, 0.04);
  --shadow-md: 0 10px 30px rgba(99, 102, 241, 0.06);
  --shadow-lg: 0 30px 60px rgba(99, 102, 241, 0.1);
  --shadow-glow: 0 0 40px rgba(79, 70, 229, 0.06), 0 0 20px rgba(219, 39, 119, 0.03);
}

.aokede-home *,
.aokede-home *::before,
.aokede-home *::after {
  box-sizing: border-box;
}

.aokede-home h1,
.aokede-home h2,
.aokede-home h3,
.aokede-home h4 {
  color: var(--ink);
  font-weight: 800;
  line-height: 1.15;
}

.aokede-home a {
  color: inherit;
  text-decoration: none;
}

.aokede-home button {
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
}

.container {
  position: relative;
  z-index: 2;
  width: min(calc(100% - 48px), var(--container));
  margin-inline: auto;
}

.text-gradient {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-grid,
.bg-glow {
  pointer-events: none;
}

.bg-grid {
  position: fixed;
  inset: 0;
  z-index: 1;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(circle at top, black 50%, transparent 95%);
}

.bg-glow {
  position: absolute;
  z-index: 0;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  opacity: 0.22;
  filter: blur(150px);
  animation: float-glow 12s ease-in-out infinite alternate;
}

.aokede-home[data-theme='light'] .bg-glow {
  opacity: 0.08;
}

.bg-glow-1 {
  top: -200px;
  right: -100px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
}

.bg-glow-2 {
  bottom: 25%;
  left: -200px;
  background: radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%);
  animation-duration: 15s;
  animation-direction: alternate-reverse;
}

@keyframes float-glow {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(60px, 40px) scale(1.15); }
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 20px;
  z-index: 999;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  padding: 10px 20px;
  font-weight: 700;
}

.skip-link:focus {
  top: 20px;
}

.btn {
  position: relative;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow: hidden;
  border-radius: 999px;
  padding: 13px 24px;
  font-weight: 700;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
}

.btn-primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.28);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(99, 102, 241, 0.35);
}

.btn-secondary {
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  backdrop-filter: blur(14px);
}

.btn-secondary:hover {
  border-color: var(--accent);
  background: var(--surface-hover);
}

.btn-small {
  min-height: 38px;
  padding: 9px 17px;
  font-size: 14px;
}

.logo-img {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  object-fit: contain;
}

.section-header {
  max-width: 760px;
  margin: 0 auto 56px;
  text-align: center;
}

.section-badge {
  display: inline-flex;
  margin-bottom: 16px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--accent-cyan);
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 800;
}

.section-header h2,
.playground-info h2,
.cta-card h2 {
  font-size: clamp(32px, 4vw, 52px);
  letter-spacing: 0;
}

.section-header p,
.playground-info p,
.cta-card p {
  margin-top: 16px;
  color: var(--muted);
  font-size: 17px;
}

.site-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(18px);
}

.nav-container {
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.nav-logo,
.footer-brand-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: var(--ink);
  font-size: 18px;
  font-weight: 900;
}

.nav-logo span,
.footer-name {
  overflow-wrap: anywhere;
}

.nav-links,
.nav-actions,
.partners-list,
.hero-actions,
.hero-features-list,
.cta-actions,
.footer-links {
  display: flex;
  align-items: center;
}

.nav-links {
  gap: 30px;
}

.nav-links a {
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  transition: color var(--transition-fast);
}

.nav-links a:hover {
  color: var(--ink);
}

.nav-actions {
  gap: 10px;
}

.theme-toggle {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  transition: var(--transition-fast);
}

.theme-toggle:hover {
  border-color: var(--accent);
  color: var(--ink);
}

.theme-toggle svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.hero-section {
  position: relative;
  z-index: 2;
  padding: 96px 0 52px;
}

.hero-grid,
.playground-grid,
.payg-grid {
  display: grid;
  align-items: center;
  gap: 64px;
  grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
}

.hero-content h1 {
  margin: 0;
  font-size: clamp(46px, 7vw, 78px);
  letter-spacing: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 24px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--ink-soft);
  padding: 8px 15px;
  font-size: 14px;
  font-weight: 700;
}

.hero-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 6px var(--success-glow);
}

.hero-description {
  max-width: 660px;
  margin: 24px 0 32px;
  color: var(--ink-soft);
  font-size: 18px;
}

.hero-actions {
  flex-wrap: wrap;
  gap: 14px;
}

.hero-features-list {
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 26px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
}

.hero-features-list span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.hero-features-list svg {
  width: 16px;
  height: 16px;
  color: var(--success);
}

.simulator-card,
.bento-card,
.terminal-box,
.payg-table-card,
.payg-flow-card,
.faq-item,
.cta-card {
  border: 1px solid var(--line);
  background: var(--glass-bg);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px);
}

.simulator-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  padding: 24px;
}

.simulator-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.045) 45%, transparent 55%);
  transform: translateX(-100%);
  animation: scan-line 5s linear infinite;
}

@keyframes scan-line {
  to { transform: translateX(100%); }
}

.simulator-header,
.sim-metrics,
.payg-table-header,
.terminal-header,
.footer-grid,
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.simulator-header {
  margin-bottom: 24px;
}

.sim-tag,
.sim-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sim-live-badge span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 12px var(--success);
}

.sim-flow {
  display: grid;
  gap: 14px;
}

.sim-node {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface-soft);
  padding: 14px;
  transition: var(--transition-normal);
}

.sim-node.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 26px var(--accent-glow);
}

.sim-node.success-glow {
  border-color: var(--success);
  box-shadow: 0 0 0 1px var(--success), 0 0 26px var(--success-glow);
}

.node-icon-bg,
.bento-icon {
  display: grid;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  background: var(--accent-gradient);
  color: #fff;
}

.node-icon-bg svg {
  width: 22px;
  height: 22px;
}

.node-info {
  min-width: 0;
}

.node-info strong {
  display: block;
  color: var(--ink);
  font-size: 14px;
}

.node-info span {
  display: block;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sim-rail {
  position: relative;
  height: 34px;
  margin-left: 36px;
  border-left: 1px dashed var(--line-strong);
}

.sim-dot {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-cyan);
  opacity: 0;
  box-shadow: 0 0 14px var(--accent-cyan);
}

.sim-dot.animating {
  opacity: 1;
  animation: flow-down 0.6s ease-in-out forwards;
}

@keyframes flow-down {
  to { transform: translateY(34px); opacity: 0; }
}

.upstream-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.upstream-node {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface-soft);
  padding: 11px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
  transition: var(--transition-normal);
}

.upstream-node.selected {
  border-color: var(--success);
  color: var(--ink);
  background: var(--success-glow);
}

.upstream-logo,
.partner-icon,
.model-badge,
.flow-num-badge {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  font-weight: 900;
}

.upstream-logo,
.partner-icon {
  width: 24px;
  height: 24px;
  background: var(--accent-gradient);
  font-size: 11px;
}

.sim-metrics {
  margin-top: 18px;
}

.sim-metric {
  flex: 1;
  min-width: 0;
  border-radius: 14px;
  background: var(--surface-soft);
  padding: 12px;
}

.metric-title {
  display: block;
  color: var(--muted);
  font-size: 11px;
}

.metric-data {
  display: block;
  overflow: hidden;
  color: var(--ink);
  font-size: 14px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-ok .metric-data {
  color: var(--success);
}

.partners-section {
  position: relative;
  z-index: 2;
  padding: 28px 0;
}

.partners-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  padding: 18px 24px;
}

.partners-title {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.partners-list {
  flex-wrap: wrap;
  gap: 16px;
}

.partner-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 800;
}

.section-padding {
  position: relative;
  z-index: 2;
  padding: 96px 0;
}

.bento-grid {
  display: grid;
  grid-auto-rows: minmax(280px, auto);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.bento-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border-radius: var(--radius-lg);
  padding: 26px;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
}

.bento-card:hover {
  transform: translateY(-4px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-lg);
}

.bento-card-large {
  grid-column: span 2;
  flex-direction: row;
  gap: 28px;
}

.bento-content {
  flex: 1;
}

.bento-icon {
  margin-bottom: 20px;
}

.bento-card h3 {
  margin: 0 0 12px;
  font-size: 23px;
}

.bento-card p {
  color: var(--muted);
  font-size: 15px;
}

.bento-visual-wrapper {
  display: flex;
  min-width: 260px;
  flex: 1;
  align-items: center;
}

.bento-lb-widget,
.bento-endpoints {
  width: 100%;
}

.bento-lb-widget {
  display: grid;
  gap: 12px;
}

.bento-lb-row,
.bento-endpoint-row {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface-soft);
  padding: 12px;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 800;
}

.bento-lb-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.18);
}

.bento-lb-fill {
  height: 100%;
  border-radius: inherit;
}

.bento-fill-muted {
  width: 100%;
  background: #475569;
}

.bento-fill-success {
  width: 65%;
  background: var(--success);
}

.success {
  color: var(--success);
}

.muted {
  color: var(--muted);
}

.bento-endpoints {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}

.bento-endpoint-row {
  grid-template-columns: minmax(90px, 0.6fr) minmax(0, 1fr);
}

.playground-section {
  background: linear-gradient(180deg, transparent, var(--surface-soft), transparent);
}

.playground-info p {
  max-width: 540px;
}

.code-tabs-wrapper {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 28px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-soft);
  padding: 5px;
}

.code-tab {
  min-height: 36px;
  border-radius: 999px;
  color: var(--muted);
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 800;
}

.code-tab.active,
.code-tab:hover {
  background: var(--accent-gradient);
  color: #fff;
}

.terminal-box {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.terminal-header {
  min-height: 54px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.82);
  padding: 0 18px;
}

.terminal-dots {
  display: flex;
  gap: 7px;
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.terminal-dot:nth-child(1) { background: #ff5f56; }
.terminal-dot:nth-child(2) { background: #ffbd2e; }
.terminal-dot:nth-child(3) { background: #27c93f; }

.terminal-lang {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}

.btn-copy svg {
  width: 16px;
  height: 16px;
}

.terminal-body {
  min-height: 430px;
  max-height: 430px;
  overflow: auto;
  background: var(--code-bg);
  padding: 22px;
}

.terminal-body pre {
  margin: 0;
}

.terminal-body code {
  color: #e2e8f0;
  font-family: "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre;
}

.payg-grid {
  align-items: stretch;
}

.payg-table-card {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.payg-table-header {
  align-items: flex-start;
  border-bottom: 1px solid var(--line);
  padding: 24px;
}

.payg-table-header h3 {
  margin: 0;
  font-size: 22px;
}

.payg-table-header span,
.payg-table-footer {
  color: var(--muted);
  font-size: 13px;
}

.payg-table {
  overflow-x: auto;
}

.payg-th,
.payg-tr {
  display: grid;
  min-width: 650px;
  grid-template-columns: 1.35fr 1fr 1fr;
  gap: 12px;
  padding: 16px 24px;
}

.payg-th {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}

.payg-tr {
  border-top: 1px solid var(--line);
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 800;
}

.payg-tr small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
}

.model-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.model-badge {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.op-badge { background: #10a37f; }
.cl-badge { background: #d97706; }
.ds-badge { background: #2563eb; }
.ge-badge { background: #1a73e8; }

.payg-table-footer {
  border-top: 1px solid var(--line);
  padding: 18px 24px;
}

.payg-flow {
  display: grid;
  align-content: start;
  gap: 16px;
}

.payg-flow-card {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 16px;
  border-radius: var(--radius-md);
  padding: 18px;
}

.flow-num-badge {
  width: 42px;
  height: 42px;
  background: var(--accent-gradient);
  font-size: 13px;
}

.flow-info h4 {
  margin: 0 0 6px;
  font-size: 18px;
}

.flow-info p {
  color: var(--muted);
  font-size: 14px;
}

.full-width {
  width: 100%;
}

.faq-wrapper {
  max-width: 900px;
  margin-inline: auto;
}

.faq-item {
  overflow: hidden;
  border-radius: var(--radius-md);
}

.faq-item + .faq-item {
  margin-top: 12px;
}

.faq-question {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--ink);
  cursor: pointer;
  padding: 20px 22px;
  text-align: left;
  font-weight: 800;
}

.faq-icon-box {
  display: grid;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--accent);
  transition: transform var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
}

.faq-icon-box svg {
  width: 14px;
  height: 14px;
}

.faq-item.active .faq-icon-box {
  transform: rotate(45deg);
  background: var(--accent);
  color: #fff;
}

.faq-answer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--transition-normal);
}

.faq-item.active .faq-answer {
  grid-template-rows: 1fr;
}

.faq-answer-inner {
  min-height: 0;
  overflow: hidden;
  color: var(--muted);
  padding: 0 22px;
}

.faq-item.active .faq-answer-inner {
  padding-bottom: 20px;
}

.cta-section {
  position: relative;
  z-index: 2;
  padding-bottom: 88px;
}

.cta-card {
  overflow: hidden;
  border-radius: var(--radius-xl);
  padding: 56px;
  text-align: center;
}

.cta-actions {
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.site-footer {
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  padding: 52px 0 32px;
}

.footer-grid {
  align-items: flex-start;
}

.footer-brand {
  max-width: 430px;
}

.footer-logo {
  width: 32px;
  height: 32px;
}

.footer-brand p,
.footer-bottom {
  color: var(--muted);
  font-size: 14px;
}

.footer-links {
  flex-wrap: wrap;
  gap: 18px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.footer-links a {
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
}

.footer-links a:hover {
  color: var(--ink);
}

.footer-bottom {
  margin-top: 34px;
  border-top: 1px solid var(--line);
  padding-top: 22px;
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out);
}

.reveal.is-visible {
  opacity: 1;
  transform: none;
}

.reveal-delay-1 {
  transition-delay: 0.15s;
}

@media (max-width: 1024px) {
  .nav-links {
    display: none;
  }

  .hero-grid,
  .playground-grid,
  .payg-grid {
    grid-template-columns: 1fr;
  }

  .hero-content {
    text-align: center;
  }

  .hero-description,
  .playground-info p {
    margin-inline: auto;
  }

  .hero-actions,
  .hero-features-list {
    justify-content: center;
  }

  .bento-grid {
    grid-template-columns: 1fr;
  }

  .bento-card-large {
    grid-column: span 1;
    flex-direction: column;
  }

  .partners-wrapper,
  .footer-grid,
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .container {
    width: min(calc(100% - 32px), var(--container));
  }

  .site-nav {
    position: relative;
  }

  .nav-container {
    min-height: auto;
    flex-wrap: wrap;
    padding: 16px 0;
  }

  .nav-actions {
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .hero-section {
    padding-top: 52px;
  }

  .hero-content h1 {
    font-size: 40px;
  }

  .hero-description {
    font-size: 16px;
  }

  .hero-actions .btn {
    width: 100%;
  }

  .simulator-card,
  .cta-card {
    padding: 22px;
  }

  .sim-metrics,
  .partners-wrapper,
  .footer-grid,
  .footer-bottom {
    display: grid;
  }

  .upstream-list {
    grid-template-columns: 1fr;
  }

  .section-padding {
    padding: 68px 0;
  }

  .terminal-body {
    min-height: 360px;
    max-height: 360px;
  }

  .terminal-body code {
    font-size: 12px;
  }

  .payg-th,
  .payg-tr {
    min-width: 560px;
    padding-inline: 16px;
  }

  .cta-card h2,
  .section-header h2,
  .playground-info h2 {
    font-size: 32px;
  }
}
</style>
