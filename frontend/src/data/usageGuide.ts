export type UsageGuideCategory = 'clients' | 'coding' | 'sdk'

export type UsageGuideValue = 'baseRoot' | 'openAiBase' | 'apiKey' | 'model' | 'literal'

export interface UsageGuideField {
  label: string
  value: UsageGuideValue
  literal?: string
}

export interface UsageGuideSnippet {
  id: string
  label: string
  language: string
  code: string
}

export interface UsageGuideSoftware {
  id: string
  category: UsageGuideCategory
  name: string
  summary: string
  badges: string[]
  steps: string[]
  fields?: UsageGuideField[]
  snippets?: UsageGuideSnippet[]
  notes?: string[]
}

export interface UsageGuideContent {
  badge: string
  heading: string
  lead: string
  searchPlaceholder: string
  searchLabel: string
  noResults: string
  copy: string
  copied: string
  exactValue: string
  toc: Array<{ id: string; label: string }>
  quickStart: {
    title: string
    description: string
    steps: Array<{ title: string; description: string; action?: string; to?: string }>
  }
  essentials: {
    title: string
    description: string
    items: Array<{ term: string; description: string }>
  }
  endpoints: {
    title: string
    description: string
    defaultLabel: string
    openAiLabel: string
    rootLabel: string
    defaultHint: string
    customHint: string
  }
  firstRequest: {
    title: string
    description: string
    beforeTitle: string
    checklist: string[]
    requestTitle: string
    successTitle: string
    successItems: string[]
  }
  software: {
    title: string
    description: string
    categories: Array<{ id: UsageGuideCategory; label: string }>
    fieldTitle: string
    stepsTitle: string
    notesTitle: string
  }
  troubleshooting: {
    title: string
    description: string
    items: Array<{ symptom: string; cause: string; solution: string }>
    symptomLabel: string
    causeLabel: string
    solutionLabel: string
  }
  security: {
    title: string
    description: string
    items: string[]
  }
  softwareGuides: UsageGuideSoftware[]
}

const sharedSnippets = {
  curl: `curl "{OPENAI_BASE_URL}/chat/completions" \\
  -H "Authorization: Bearer {API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "{MODEL}",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'`,
  python: `from openai import OpenAI

client = OpenAI(
    api_key="{API_KEY}",
    base_url="{OPENAI_BASE_URL}",
)

response = client.chat.completions.create(
    model="{MODEL}",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)`,
  node: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "{API_KEY}",
  baseURL: "{OPENAI_BASE_URL}",
});

const response = await client.chat.completions.create({
  model: "{MODEL}",
  messages: [{ role: "user", content: "Hello" }],
});

console.log(response.choices[0].message.content);`,
  claudePowerShell: `$env:ANTHROPIC_BASE_URL="{BASE_ROOT}"
$env:ANTHROPIC_AUTH_TOKEN="{API_KEY}"
$env:ANTHROPIC_MODEL="{MODEL}"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"
claude`,
  claudeUnix: `export ANTHROPIC_BASE_URL="{BASE_ROOT}"
export ANTHROPIC_AUTH_TOKEN="{API_KEY}"
export ANTHROPIC_MODEL="{MODEL}"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"
claude`,
  codexPowerShell: `$env:AOKEDE_API_KEY="{API_KEY}"
codex`,
  codexConfig: `model_provider = "aokede"
model = "{MODEL}"

[model_providers.aokede]
name = "Aokede"
base_url = "{BASE_ROOT}"
env_key = "AOKEDE_API_KEY"
wire_api = "responses"
requires_openai_auth = false
supports_websockets = false`,
}

const zh: UsageGuideContent = {
  badge: '新手入门',
  heading: '从零开始连接你的第一个 AI 应用',
  lead: '不需要理解复杂的 API 概念。按照页面顺序准备密钥、确认模型、填写端点并发送一次测试请求，即可完成配置。',
  searchPlaceholder: '搜索软件、错误码或配置项',
  searchLabel: '搜索使用文档',
  noResults: '没有找到相关教程，请尝试搜索软件名称、错误码或“端点”。',
  copy: '复制配置',
  copied: '已复制',
  exactValue: '请完整填写，不要增加空格或重复的 /v1。',
  toc: [
    { id: 'quick-start', label: '5 分钟上手' },
    { id: 'essentials', label: '先认识 4 个概念' },
    { id: 'endpoints', label: '端点怎么填写' },
    { id: 'first-request', label: '发送首次请求' },
    { id: 'software', label: '热门软件配置' },
    { id: 'troubleshooting', label: '常见问题排查' },
    { id: 'security', label: '密钥安全' },
  ],
  quickStart: {
    title: '5 分钟完成首次配置',
    description: '第一次使用时按以下顺序操作，能够避开绝大多数配置问题。',
    steps: [
      {
        title: '创建 API 密钥',
        description: '进入 API 密钥页面创建密钥。密钥通常以 sk- 开头，请在创建后立即妥善保存。',
        action: '前往 API 密钥',
        to: '/keys',
      },
      {
        title: '确认可用模型',
        description: '在模型广场找到要使用的模型，复制准确的模型 ID。不要凭显示名称自行猜测。',
        action: '查看模型广场',
        to: '/model-plaza?embedded=1',
      },
      {
        title: '选择访问端点',
        description: '优先使用默认端点；网络连接不稳定时，可切换到管理员配置的备用端点。',
      },
      {
        title: '填写并测试',
        description: '在软件中选择 OpenAI 兼容接口，填写端点、密钥和模型 ID，保存后发送一句“你好”进行测试。',
      },
    ],
  },
  essentials: {
    title: '先认识 4 个配置项',
    description: '软件中的名称可能略有不同，但本质都对应下面四项。',
    items: [
      { term: 'API 端点', description: '请求发送到的服务器地址，也常写作 Base URL、API Host、接口地址或代理地址。' },
      { term: 'API 密钥', description: '用于识别账户并计费的访问凭证。它不是登录密码，也不能公开分享。' },
      { term: '模型 ID', description: '每个模型的准确调用名称，例如模型广场卡片中展示的 ID。大小写和符号必须完全一致。' },
      { term: '分组', description: '密钥绑定的可用资源范围。模型必须存在于该密钥所属分组中，否则请求无法调度。' },
    ],
  },
  endpoints: {
    title: '端点应该填写哪个地址',
    description: '先看软件字段要求：写着 OpenAI、Base URL 或 API Host 时通常填写带 /v1 的地址；写着服务器根地址或 Anthropic Base URL 时填写根地址。',
    defaultLabel: '默认端点',
    openAiLabel: 'OpenAI 兼容地址',
    rootLabel: '服务器根地址',
    defaultHint: '日常优先使用，适合网络连接稳定的环境。',
    customHint: '由管理员配置的自定义线路，可按需切换。',
  },
  firstRequest: {
    title: '先用一条请求验证密钥',
    description: '在配置复杂客户端之前，先验证端点、密钥和模型是否能够共同工作。这样出现问题时更容易定位。',
    beforeTitle: '发送前确认',
    checklist: [
      '把 sk-your-api-key 替换为刚创建的完整密钥。',
      '把 your-model-id 替换为模型广场中复制的准确模型 ID。',
      'Windows PowerShell 建议优先参考下方客户端配置，或在 Git Bash / WSL 中执行 cURL 示例。',
    ],
    requestTitle: 'OpenAI 兼容请求',
    successTitle: '怎样算配置成功',
    successItems: [
      'HTTP 状态码为 200，并且返回内容中包含模型回复。',
      '使用记录中出现本次请求，模型、消耗和状态均正常。',
      '开启 stream 后内容能够持续返回，而不是等待结束后一次性出现。',
    ],
  },
  software: {
    title: '热门软件配置教程',
    description: '先选择软件类型，再展开对应教程。字段名称可能随软件版本略有变化，以“OpenAI 兼容”或“自定义 API”为关键词查找即可。',
    categories: [
      { id: 'clients', label: '聊天与 Web 客户端' },
      { id: 'coding', label: '编程工具' },
      { id: 'sdk', label: '代码与 SDK' },
    ],
    fieldTitle: '需要填写',
    stepsTitle: '配置步骤',
    notesTitle: '注意事项',
  },
  troubleshooting: {
    title: '常见问题快速排查',
    description: '先根据状态码或页面提示定位，不要反复删除和重建密钥。',
    symptomLabel: '现象',
    causeLabel: '常见原因',
    solutionLabel: '处理方法',
    items: [
      { symptom: '401 / Unauthorized', cause: '密钥不完整、复制了多余空格、密钥已停用或已删除。', solution: '重新从 API 密钥页面复制；确认没有引号和首尾空格；检查密钥状态。' },
      { symptom: '403 / Forbidden', cause: '密钥分组无权使用该模型，或账户余额、订阅权限不足。', solution: '检查密钥分组与模型广场中的分组；必要时更换分组或完成充值。' },
      { symptom: '404 / Not Found', cause: '端点路径填写错误，最常见的是出现 /v1/v1 或软件已自动追加路径。', solution: '查看软件要求的是根地址还是 OpenAI 地址；删除重复路径后重试。' },
      { symptom: '429 / Too Many Requests', cause: '触发并发、RPM/TPM 限制，或短时间请求过多。', solution: '降低并发与请求频率，稍后重试；在使用记录中确认是否连续触发限流。' },
      { symptom: 'No available compatible accounts', cause: '当前密钥分组内没有支持该模型且可调度的账号。', solution: '核对模型 ID 和密钥分组；更换该分组已展示的模型，或联系管理员检查账号状态。' },
      { symptom: 'stream disconnected / decoding response body', cause: '反向代理压缩、HTTP 协议转换或网络链路中断了流式响应。', solution: '切换备用端点；自建 Caddy/Nginx 时关闭该 API 路径压缩，并保持流式响应直传。' },
      { symptom: 'model not found', cause: '模型 ID 拼写错误，使用了展示名称，或客户端缓存了旧模型列表。', solution: '从模型广场重新复制 ID，手动添加模型后重启客户端。' },
      { symptom: '请求成功但软件没有内容', cause: '客户端选择了不兼容的接口类型，或流式解析方式与模型端点不匹配。', solution: '优先选择 OpenAI Compatible；普通聊天使用 Chat Completions，Codex 使用 Responses。' },
    ],
  },
  security: {
    title: '保护你的 API 密钥',
    description: 'API 密钥产生的调用会计入你的账户，应该像支付密码一样保护。',
    items: [
      '不要把完整密钥发到群聊、工单截图、公开仓库或网页前端代码中。',
      '不同设备和软件分别创建密钥，并用清晰名称标记，泄露时可以单独停用。',
      '服务端程序使用环境变量保存密钥，不要直接写进 Git 管理的源代码。',
      '发现异常调用后立即停用旧密钥、创建新密钥，并在使用记录中检查来源和消耗。',
    ],
  },
  softwareGuides: [
    {
      id: 'cherry-studio',
      category: 'clients',
      name: 'Cherry Studio',
      summary: '适合桌面聊天、多模型切换和知识库使用。',
      badges: ['Windows / macOS / Linux', 'OpenAI Compatible'],
      fields: [
        { label: 'API 类型', value: 'literal', literal: 'OpenAI' },
        { label: 'API 地址', value: 'openAiBase' },
        { label: 'API 密钥', value: 'apiKey' },
        { label: '模型 ID', value: 'model' },
      ],
      steps: [
        '打开设置，进入“模型服务”或“服务商”页面。',
        '新增一个自定义服务商，类型选择 OpenAI。',
        '填写 API 地址和 API 密钥，关闭使用官方地址的选项。',
        '点击添加模型，粘贴模型广场中的准确模型 ID。',
        '保存后回到聊天页，选择刚添加的模型并发送测试消息。',
      ],
      notes: ['若测试提示 404，检查 Cherry Studio 是否又自动追加了一次 /v1。'],
    },
    {
      id: 'chatbox',
      category: 'clients',
      name: 'Chatbox',
      summary: '配置简单的跨平台桌面聊天客户端。',
      badges: ['桌面客户端', 'OpenAI API'],
      fields: [
        { label: '模型提供方', value: 'literal', literal: 'OpenAI API' },
        { label: 'API Host', value: 'openAiBase' },
        { label: 'API Key', value: 'apiKey' },
        { label: 'Model', value: 'model' },
      ],
      steps: [
        '打开 Chatbox 设置，选择“模型提供方”。',
        '选择 OpenAI API，并启用自定义 API Host。',
        '依次填写 API Host、API Key 和模型 ID。',
        '保存设置，新建会话并发送测试消息。',
      ],
      notes: ['旧版本如果没有自定义 Host，请先升级到支持自定义 OpenAI 地址的版本。'],
    },
    {
      id: 'open-webui',
      category: 'clients',
      name: 'Open WebUI',
      summary: '适合团队或个人自托管的浏览器聊天界面。',
      badges: ['Web', '自托管'],
      fields: [
        { label: 'Connection Type', value: 'literal', literal: 'OpenAI' },
        { label: 'URL', value: 'openAiBase' },
        { label: 'API Key', value: 'apiKey' },
      ],
      steps: [
        '使用管理员账号进入 Admin Panel。',
        '打开 Settings > Connections > OpenAI API。',
        '新增连接，填写 URL 和 API Key 后保存。',
        '刷新模型列表；若未自动出现，在模型设置中手动添加模型 ID。',
        '用普通用户会话选择模型并测试。',
      ],
      notes: ['服务器部署时应确认容器能够访问所填域名；浏览器能打开不代表容器网络一定可用。'],
    },
    {
      id: 'lobechat',
      category: 'clients',
      name: 'LobeChat',
      summary: '适合插件、Agent 和多模型工作流。',
      badges: ['Web / Desktop', 'OpenAI Proxy'],
      fields: [
        { label: 'Provider', value: 'literal', literal: 'OpenAI' },
        { label: 'Proxy URL', value: 'openAiBase' },
        { label: 'API Key', value: 'apiKey' },
        { label: 'Model ID', value: 'model' },
      ],
      steps: [
        '进入设置中的 Language Model / 模型服务商。',
        '选择 OpenAI，并开启自定义代理地址。',
        '填写 Proxy URL 和 API Key。',
        '在模型列表中启用或新增对应模型 ID。',
        '保存后创建新会话测试，旧会话可能仍保留原模型。',
      ],
      notes: ['自托管版本也可以通过环境变量配置，但不要把密钥提交到公开仓库。'],
    },
    {
      id: 'cline-roo',
      category: 'coding',
      name: 'Cline / Roo Code',
      summary: 'VS Code 中常用的 AI 编程扩展。',
      badges: ['VS Code', 'OpenAI Compatible'],
      fields: [
        { label: 'API Provider', value: 'literal', literal: 'OpenAI Compatible' },
        { label: 'Base URL', value: 'openAiBase' },
        { label: 'API Key', value: 'apiKey' },
        { label: 'Model ID', value: 'model' },
      ],
      steps: [
        '打开扩展设置或 Provider 配置页面。',
        'Provider 选择 OpenAI Compatible，不要选择网页登录。',
        '填写 Base URL、API Key 和模型 ID。',
        '上下文窗口不知道时先保留默认值，待模型说明明确后再调整。',
        '保存并新建任务，确认能够读取回复和工具调用结果。',
      ],
      notes: ['编程 Agent 消耗较高，建议为其单独创建密钥，方便限制和核对用量。'],
    },
    {
      id: 'claude-code',
      category: 'coding',
      name: 'Claude Code',
      summary: '通过 Anthropic 兼容接口连接 Claude Code。',
      badges: ['Terminal', 'Anthropic Compatible'],
      fields: [
        { label: 'ANTHROPIC_BASE_URL', value: 'baseRoot' },
        { label: 'ANTHROPIC_AUTH_TOKEN', value: 'apiKey' },
        { label: 'ANTHROPIC_MODEL', value: 'model' },
      ],
      steps: [
        '先确认密钥分组中存在可通过 Anthropic Messages 调用的模型。',
        '在启动 Claude Code 的同一个终端设置下面的环境变量。',
        '把模型占位符替换为模型广场中的准确 ID。',
        '运行 claude，发送一个简单问题确认连接。',
        '需要长期保存时写入 ~/.claude/settings.json 的 env 节点，不要上传该文件。',
      ],
      snippets: [
        { id: 'claude-powershell', label: 'Windows PowerShell', language: 'powershell', code: sharedSnippets.claudePowerShell },
        { id: 'claude-unix', label: 'macOS / Linux', language: 'shell', code: sharedSnippets.claudeUnix },
      ],
      notes: ['如果所选分组不支持 Anthropic Messages，请改用 Cline/Roo Code 的 OpenAI Compatible 配置。'],
    },
    {
      id: 'codex-cli',
      category: 'coding',
      name: 'Codex CLI',
      summary: '使用 Responses API 和 HTTP/SSE 连接 Codex。',
      badges: ['Terminal', 'Responses API'],
      fields: [
        { label: 'base_url', value: 'baseRoot' },
        { label: 'AOKEDE_API_KEY', value: 'apiKey' },
        { label: 'model', value: 'model' },
      ],
      steps: [
        '创建 ~/.codex/config.toml；Windows 路径为 %USERPROFILE%\\.codex\\config.toml。',
        '复制下面配置，并替换模型 ID。',
        '在启动 Codex 的终端设置 AOKEDE_API_KEY。',
        '启动 codex 后发送测试请求。若流式中断，先切换备用端点。',
      ],
      snippets: [
        { id: 'codex-config', label: 'config.toml', language: 'toml', code: sharedSnippets.codexConfig },
        { id: 'codex-powershell', label: 'PowerShell 启动', language: 'powershell', code: sharedSnippets.codexPowerShell },
      ],
      notes: ['本线路使用 HTTP/SSE，配置中保持 supports_websockets = false。'],
    },
    {
      id: 'curl',
      category: 'sdk',
      name: 'cURL',
      summary: '不安装 SDK，最快验证密钥和模型是否可用。',
      badges: ['命令行', 'Chat Completions'],
      steps: [
        '替换密钥和模型 ID。',
        '在 macOS、Linux、Git Bash 或 WSL 中执行。',
        '看到 HTTP 200 和回复内容后，再配置目标软件。',
      ],
      snippets: [{ id: 'curl-request', label: 'Terminal', language: 'bash', code: sharedSnippets.curl }],
    },
    {
      id: 'python-sdk',
      category: 'sdk',
      name: 'Python OpenAI SDK',
      summary: '使用官方 OpenAI Python SDK 调用兼容接口。',
      badges: ['Python', 'openai'],
      steps: [
        '运行 pip install -U openai 安装 SDK。',
        '替换示例中的密钥和模型 ID。',
        '生产环境将密钥放入环境变量，不要直接写在代码中。',
      ],
      snippets: [{ id: 'python-request', label: 'example.py', language: 'python', code: sharedSnippets.python }],
    },
    {
      id: 'node-sdk',
      category: 'sdk',
      name: 'Node.js OpenAI SDK',
      summary: '使用官方 OpenAI JavaScript SDK 调用兼容接口。',
      badges: ['Node.js', 'openai'],
      steps: [
        '运行 npm install openai 安装 SDK。',
        '项目使用 ESM，或将 import 改为当前项目支持的模块语法。',
        '生产环境从 process.env 读取密钥。',
      ],
      snippets: [{ id: 'node-request', label: 'example.mjs', language: 'javascript', code: sharedSnippets.node }],
    },
  ],
}

const en: UsageGuideContent = {
  ...zh,
  badge: 'GETTING STARTED',
  heading: 'Connect your first AI application from scratch',
  lead: 'Follow the page in order: create a key, confirm a model, choose an endpoint, and send one test request.',
  searchPlaceholder: 'Search software, error codes, or settings',
  searchLabel: 'Search usage guide',
  noResults: 'No matching guide. Try a software name, an error code, or “endpoint”.',
  copy: 'Copy configuration',
  copied: 'Copied',
  exactValue: 'Enter the complete value without extra spaces or a duplicated /v1.',
  toc: [
    { id: 'quick-start', label: '5-minute setup' },
    { id: 'essentials', label: 'Four essentials' },
    { id: 'endpoints', label: 'Endpoint format' },
    { id: 'first-request', label: 'First request' },
    { id: 'software', label: 'Popular software' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'security', label: 'Key security' },
  ],
  quickStart: {
    title: 'Complete your first setup in five minutes',
    description: 'Use this order for a new client to avoid the most common configuration errors.',
    steps: [
      { title: 'Create an API key', description: 'Create a key on the API Keys page and store the full sk- value securely.', action: 'Open API Keys', to: '/keys' },
      { title: 'Confirm the model', description: 'Copy the exact model ID from Model Plaza. Do not guess from the display name.', action: 'Open Model Plaza', to: '/model-plaza?embedded=1' },
      { title: 'Choose an endpoint', description: 'Use the default endpoint first. Switch to an administrator-configured backup when the network path is unstable.' },
      { title: 'Configure and test', description: 'Select an OpenAI-compatible provider, enter the endpoint, key, and model ID, then send a short test message.' },
    ],
  },
  essentials: {
    title: 'Understand four settings first',
    description: 'Client labels vary, but they map to the same four values.',
    items: [
      { term: 'API endpoint', description: 'The server address, also called Base URL, API Host, endpoint, or proxy URL.' },
      { term: 'API key', description: 'The credential used for authentication and billing. It is not your login password.' },
      { term: 'Model ID', description: 'The exact model identifier shown in Model Plaza. Case and punctuation must match.' },
      { term: 'Group', description: 'The resource scope assigned to the key. The requested model must be available in that group.' },
    ],
  },
  endpoints: {
    title: 'Which endpoint should I enter?',
    description: 'Fields labeled OpenAI, Base URL, or API Host usually need the /v1 URL. Server root and Anthropic Base URL fields use the root URL.',
    defaultLabel: 'Default endpoint',
    openAiLabel: 'OpenAI-compatible URL',
    rootLabel: 'Server root URL',
    defaultHint: 'Recommended for normal use on a stable network.',
    customHint: 'A custom route configured by the administrator.',
  },
  firstRequest: {
    title: 'Validate the key with one request',
    description: 'Test the endpoint, key, and model together before configuring a more complex client.',
    beforeTitle: 'Before sending',
    checklist: [
      'Replace sk-your-api-key with the complete key you created.',
      'Replace your-model-id with the exact ID copied from Model Plaza.',
      'On Windows, run the cURL sample in Git Bash or WSL, or use one of the client guides below.',
    ],
    requestTitle: 'OpenAI-compatible request',
    successTitle: 'A successful setup',
    successItems: [
      'The response has HTTP status 200 and contains model output.',
      'The request appears in Usage with the expected model and status.',
      'With streaming enabled, output arrives continuously instead of only at the end.',
    ],
  },
  software: {
    title: 'Popular software setup',
    description: 'Choose a category and expand a guide. Labels may differ by version; look for “OpenAI Compatible” or “Custom API”.',
    categories: [
      { id: 'clients', label: 'Chat and web clients' },
      { id: 'coding', label: 'Coding tools' },
      { id: 'sdk', label: 'Code and SDKs' },
    ],
    fieldTitle: 'Values to enter',
    stepsTitle: 'Steps',
    notesTitle: 'Notes',
  },
  troubleshooting: {
    title: 'Quick troubleshooting',
    description: 'Use the status code or client message to isolate the issue before recreating keys.',
    symptomLabel: 'Symptom',
    causeLabel: 'Likely cause',
    solutionLabel: 'Resolution',
    items: [
      { symptom: '401 / Unauthorized', cause: 'Incomplete, disabled, deleted, or whitespace-padded key.', solution: 'Copy the key again, remove quotes and spaces, and verify its status.' },
      { symptom: '403 / Forbidden', cause: 'The key group cannot use the model, or balance/subscription access is insufficient.', solution: 'Compare the key group with Model Plaza and change the group or recharge if required.' },
      { symptom: '404 / Not Found', cause: 'Wrong path, commonly /v1/v1 after the client appends its own prefix.', solution: 'Check whether the client expects a root URL or an OpenAI /v1 URL.' },
      { symptom: '429 / Too Many Requests', cause: 'Concurrency, RPM, or TPM limit reached.', solution: 'Reduce concurrency and request frequency, then retry later.' },
      { symptom: 'No available compatible accounts', cause: 'No schedulable account in the key group supports that model.', solution: 'Verify the model ID and group, select a listed model, or contact the administrator.' },
      { symptom: 'stream disconnected / decoding response body', cause: 'Proxy compression, protocol conversion, or the network path interrupted SSE.', solution: 'Use a backup endpoint; for your own proxy, disable compression and pass streaming responses through.' },
      { symptom: 'model not found', cause: 'Wrong model ID or a stale client-side model list.', solution: 'Copy the ID from Model Plaza, add it manually, and restart the client.' },
      { symptom: 'Successful request but blank client output', cause: 'The client selected an incompatible API type or parser.', solution: 'Use OpenAI Compatible and Chat Completions for chat; use Responses for Codex.' },
    ],
  },
  security: {
    title: 'Protect your API key',
    description: 'Requests made with the key are billed to your account, so treat it like a payment credential.',
    items: [
      'Never expose a full key in chats, screenshots, public repositories, or browser frontend code.',
      'Create a separate, clearly named key for each app or device so one key can be revoked independently.',
      'Use environment variables on servers instead of committing keys to source control.',
      'If usage looks suspicious, disable the old key immediately, create a replacement, and review Usage records.',
    ],
  },
  softwareGuides: zh.softwareGuides.map((guide) => ({ ...guide })),
}

const englishGuideText: Record<string, Pick<UsageGuideSoftware, 'summary' | 'steps' | 'notes'>> = {
  'cherry-studio': {
    summary: 'Desktop chat, model switching, and knowledge-base workflows.',
    steps: ['Open Settings and Model Services.', 'Add a custom provider and select OpenAI.', 'Enter the API URL and key.', 'Add the exact model ID from Model Plaza.', 'Save, select the model, and send a test message.'],
    notes: ['If the test returns 404, check whether Cherry Studio appended /v1 a second time.'],
  },
  chatbox: {
    summary: 'A simple cross-platform desktop chat client.',
    steps: ['Open Chatbox settings and Model Provider.', 'Select OpenAI API and enable a custom API Host.', 'Enter the host, key, and model ID.', 'Save and test in a new conversation.'],
    notes: ['Upgrade Chatbox if your version does not expose a custom API Host.'],
  },
  'open-webui': {
    summary: 'A self-hosted browser chat interface for individuals and teams.',
    steps: ['Open Admin Panel.', 'Go to Settings > Connections > OpenAI API.', 'Add the URL and key, then save.', 'Refresh models or add the model ID manually.', 'Test with a regular user conversation.'],
    notes: ['The server or container must be able to reach the endpoint independently of your browser.'],
  },
  lobechat: {
    summary: 'Chat, plugins, agents, and multi-model workflows.',
    steps: ['Open Language Model settings.', 'Select OpenAI and enable a custom proxy URL.', 'Enter the URL and key.', 'Enable or add the exact model ID.', 'Save and test in a new conversation.'],
    notes: ['For self-hosting, keep keys out of public repositories.'],
  },
  'cline-roo': {
    summary: 'Popular AI coding extensions for VS Code.',
    steps: ['Open provider settings.', 'Select OpenAI Compatible.', 'Enter Base URL, key, and model ID.', 'Keep the default context size until model limits are known.', 'Create a new task and verify text and tool calls.'],
    notes: ['Use a separate key for coding agents to track and limit their higher usage.'],
  },
  'claude-code': {
    summary: 'Connect Claude Code through an Anthropic-compatible endpoint.',
    steps: ['Confirm the key group supports an Anthropic Messages model.', 'Set the environment variables in the terminal that launches Claude Code.', 'Replace the model placeholder with the exact model ID.', 'Run claude and send a simple question.', 'For persistent settings, use the env section in ~/.claude/settings.json and keep it private.'],
    notes: ['If the group does not support Anthropic Messages, use the OpenAI-compatible Cline/Roo Code setup.'],
  },
  'codex-cli': {
    summary: 'Connect Codex through the Responses API over HTTP/SSE.',
    steps: ['Create ~/.codex/config.toml or %USERPROFILE%\\.codex\\config.toml on Windows.', 'Copy the config and replace the model ID.', 'Set AOKEDE_API_KEY in the terminal.', 'Launch Codex and test; switch to a backup endpoint if streaming is unstable.'],
    notes: ['Keep supports_websockets = false because this route uses HTTP/SSE.'],
  },
  curl: {
    summary: 'The fastest way to verify a key and model without installing an SDK.',
    steps: ['Replace the key and model ID.', 'Run in macOS, Linux, Git Bash, or WSL.', 'After HTTP 200 and a model reply, configure your target software.'],
  },
  'python-sdk': {
    summary: 'Call the compatible endpoint with the official OpenAI Python SDK.',
    steps: ['Run pip install -U openai.', 'Replace the key and model ID.', 'Use environment variables instead of hardcoding production keys.'],
  },
  'node-sdk': {
    summary: 'Call the compatible endpoint with the official OpenAI JavaScript SDK.',
    steps: ['Run npm install openai.', 'Use ESM or adapt the import to your project.', 'Read production keys from process.env.'],
  },
}

const englishFieldLabels: Record<string, string> = {
  'API 类型': 'API type',
  'API 地址': 'API URL',
  'API 密钥': 'API key',
  '模型 ID': 'Model ID',
  '模型提供方': 'Model provider',
}

const englishBadges: Record<string, string> = {
  '桌面客户端': 'Desktop',
  '自托管': 'Self-hosted',
  '命令行': 'Command line',
}

const englishSnippetLabels: Record<string, string> = {
  'PowerShell 启动': 'PowerShell launch',
}

en.softwareGuides = en.softwareGuides.map((guide) => ({
  ...guide,
  ...(englishGuideText[guide.id] ?? {}),
  badges: guide.badges.map((badge) => englishBadges[badge] ?? badge),
  fields: guide.fields?.map((field) => ({
    ...field,
    label: englishFieldLabels[field.label] ?? field.label,
  })),
  snippets: guide.snippets?.map((snippet) => ({
    ...snippet,
    label: englishSnippetLabels[snippet.label] ?? snippet.label,
  })),
}))

export const usageGuideContent = { zh, en } as const
