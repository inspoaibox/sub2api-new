import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const backendDir = path.join(repoRoot, 'backend')
const frontendDir = path.join(repoRoot, 'frontend')
const args = new Set(process.argv.slice(2))

const backendOnly = args.has('--backend-only')
const frontendOnly = args.has('--frontend-only')
const isWindows = process.platform === 'win32'

const backendPort = process.env.BACKEND_PORT || process.env.SERVER_PORT || '8080'
const frontendPort = process.env.FRONTEND_PORT || process.env.VITE_DEV_PORT || '3000'
const backendHost = process.env.SERVER_HOST || '0.0.0.0'
const publicBackendHost = backendHost === '0.0.0.0' ? 'localhost' : backendHost
const backendUrl = process.env.VITE_DEV_PROXY_TARGET || `http://${publicBackendHost}:${backendPort}`

const watchExtensions = new Set(['.go', '.yaml', '.yml', '.json', '.toml', '.sql'])
const watchFiles = new Set(['VERSION', 'go.mod', 'go.sum'])
const ignoredDirs = new Set([
  '.git',
  '.gocache',
  '.vite',
  'bin',
  'data',
  'dist',
  'node_modules',
  'release',
  'tmp',
  'temp',
  'vendor',
])
const ignoredFileExtensions = new Set([
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.test',
  '.out',
  '.log',
  '.tmp',
])

const children = new Set()
let backendProcess = null
let stopping = false
let restarting = false
let restartTimer = null
let watcherRefreshTimer = null
const watchers = new Map()
const fileSignatures = new Map()

function log(scope, message) {
  process.stdout.write(`[${scope}] ${message}\n`)
}

function prefixStream(stream, scope, target) {
  let buffered = ''
  stream.on('data', (chunk) => {
    buffered += chunk.toString()
    const lines = buffered.split(/\r?\n/)
    buffered = lines.pop() ?? ''
    for (const line of lines) {
      target.write(`[${scope}] ${line}\n`)
    }
  })
  stream.on('end', () => {
    if (buffered) {
      target.write(`[${scope}] ${buffered}\n`)
      buffered = ''
    }
  })
}

function spawnManaged(scope, command, commandArgs, options = {}) {
  const child = spawn(command, commandArgs, {
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
    shell: options.shell || false,
    detached: !isWindows,
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  children.add(child)
  prefixStream(child.stdout, scope, process.stdout)
  prefixStream(child.stderr, scope, process.stderr)

  child.on('error', (error) => {
    log(scope, `启动失败: ${error.message}`)
  })

  child.on('exit', (code, signal) => {
    children.delete(child)
    if (!stopping) {
      const reason = signal ? `signal ${signal}` : `code ${code}`
      log(scope, `进程已退出 (${reason})`)
    }
  })

  return child
}

function backendEnv() {
  return {
    ...process.env,
    SERVER_HOST: backendHost,
    SERVER_PORT: backendPort,
    GIN_MODE: process.env.GIN_MODE || 'debug',
  }
}

function frontendEnv() {
  return {
    ...process.env,
    VITE_DEV_PORT: frontendPort,
    VITE_DEV_PROXY_TARGET: backendUrl,
  }
}

function existingFile(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function candidatePnpmEntrypoints() {
  const candidates = []

  if (process.env.npm_execpath) {
    candidates.push(process.env.npm_execpath)
  }

  for (const entry of (process.env.PATH || '').split(path.delimiter)) {
    if (!entry) {
      continue
    }
    const dir = path.resolve(repoRoot, entry)
    candidates.push(path.join(dir, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'))
    candidates.push(path.join(dir, '..', 'pnpm', 'bin', 'pnpm.cjs'))
  }

  return candidates
}

function pnpmCommand(commandArgs) {
  const entrypoint = candidatePnpmEntrypoints().find((candidate) => {
    const normalized = candidate.toLowerCase()
    return normalized.endsWith('pnpm.cjs') && existingFile(candidate)
  })

  if (entrypoint) {
    return {
      command: process.execPath,
      args: [entrypoint, ...commandArgs],
      shell: false,
    }
  }

  return {
    command: 'pnpm',
    args: commandArgs,
    shell: isWindows,
  }
}

function startBackend() {
  log('backend', `启动 Go 服务: http://${publicBackendHost}:${backendPort}`)
  backendProcess = spawnManaged('backend', 'go', ['run', './cmd/server'], {
    cwd: backendDir,
    env: backendEnv(),
  })
}

function startFrontend() {
  log('frontend', `启动 Vite: http://localhost:${frontendPort}，API 代理到 ${backendUrl}`)
  const command = pnpmCommand(['--dir', frontendDir, 'dev'])
  spawnManaged('frontend', command.command, command.args, {
    cwd: repoRoot,
    env: frontendEnv(),
    shell: command.shell,
  })
}

function isIgnoredDir(dirPath) {
  const name = path.basename(dirPath)
  if (ignoredDirs.has(name)) {
    return true
  }

  const relative = path.relative(backendDir, dirPath)
  if (!relative || relative.startsWith('..')) {
    return false
  }

  const parts = relative.split(path.sep)
  return (
    parts.includes('data') ||
    parts.includes('node_modules') ||
    relative.startsWith(path.join('internal', 'web', 'dist'))
  )
}

function shouldTriggerRestart(filePath) {
  const name = path.basename(filePath)
  const ext = path.extname(name)
  if (ignoredFileExtensions.has(ext)) {
    return false
  }
  return watchFiles.has(name) || watchExtensions.has(ext)
}

function fileSignature(filePath) {
  try {
    const stats = fs.statSync(filePath)
    if (!stats.isFile()) {
      return null
    }
    return `${stats.mtimeMs}:${stats.size}`
  } catch {
    return null
  }
}

function hasFileActuallyChanged(filePath) {
  const signature = fileSignature(filePath)
  const previous = fileSignatures.get(filePath)

  if (signature === null) {
    fileSignatures.delete(filePath)
    return previous !== undefined
  }

  fileSignatures.set(filePath, signature)
  return previous === undefined || previous !== signature
}

function listWatchDirectories(rootDir) {
  const directories = []
  const pending = [rootDir]

  while (pending.length) {
    const current = pending.pop()
    if (!current || isIgnoredDir(current)) {
      continue
    }

    directories.push(current)
    let entries = []
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        pending.push(path.join(current, entry.name))
      }
    }
  }

  return directories
}

function rememberWatchFileSignatures(directories) {
  for (const dir of directories) {
    let entries = []
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue
      }
      const filePath = path.join(dir, entry.name)
      if (shouldTriggerRestart(filePath)) {
        const signature = fileSignature(filePath)
        if (signature !== null) {
          fileSignatures.set(filePath, signature)
        }
      }
    }
  }
}

function refreshWatchers() {
  const nextDirs = new Set(listWatchDirectories(backendDir))
  rememberWatchFileSignatures(nextDirs)

  for (const [dir, watcher] of watchers) {
    if (!nextDirs.has(dir)) {
      watcher.close()
      watchers.delete(dir)
    }
  }

  for (const dir of nextDirs) {
    if (watchers.has(dir)) {
      continue
    }

    try {
      const watcher = fs.watch(dir, { persistent: true }, (_eventType, filename) => {
        if (!filename || stopping) {
          return
        }

        const fullPath = path.join(dir, filename.toString())
        scheduleWatcherRefresh()

        if (shouldTriggerRestart(fullPath) && hasFileActuallyChanged(fullPath)) {
          scheduleBackendRestart(path.relative(backendDir, fullPath))
        }
      })

      watcher.on('error', () => {
        watchers.delete(dir)
      })
      watchers.set(dir, watcher)
    } catch {
      // Directory may disappear during refactors; the next refresh will reconcile it.
    }
  }
}

function scheduleWatcherRefresh() {
  clearTimeout(watcherRefreshTimer)
  watcherRefreshTimer = setTimeout(refreshWatchers, 500)
}

function scheduleBackendRestart(relativeFile) {
  clearTimeout(restartTimer)
  restartTimer = setTimeout(() => {
    void restartBackend(relativeFile)
  }, 350)
}

async function restartBackend(relativeFile) {
  if (stopping) {
    return
  }

  if (restarting) {
    scheduleBackendRestart(relativeFile)
    return
  }

  restarting = true
  log('backend', `检测到 ${relativeFile} 变更，重启后端...`)

  if (backendProcess) {
    await stopProcess(backendProcess, 2500)
    backendProcess = null
  }

  if (!stopping) {
    startBackend()
  }
  restarting = false
}

function waitForExit(child, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve(false)
      }
    }, timeoutMs)

    child.once('exit', () => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        resolve(true)
      }
    })
  })
}

async function stopProcess(child, timeoutMs = 2000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return
  }

  try {
    if (isWindows) {
      child.kill('SIGINT')
    } else {
      process.kill(-child.pid, 'SIGINT')
    }
  } catch {
    // The process may already be gone.
  }

  const exited = await waitForExit(child, timeoutMs)
  if (exited) {
    return
  }

  try {
    if (isWindows) {
      await new Promise((resolve) => {
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
          stdio: 'ignore',
          shell: false,
        })
        killer.on('exit', resolve)
        killer.on('error', resolve)
      })
    } else {
      process.kill(-child.pid, 'SIGTERM')
    }
  } catch {
    // Best-effort cleanup on shutdown.
  }
}

async function shutdown() {
  if (stopping) {
    return
  }
  stopping = true
  clearTimeout(restartTimer)
  clearTimeout(watcherRefreshTimer)
  log('dev', '正在关闭开发服务...')

  for (const watcher of watchers.values()) {
    watcher.close()
  }
  watchers.clear()

  await Promise.all([...children].map((child) => stopProcess(child)))
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})
process.on('SIGTERM', () => {
  void shutdown()
})
process.on('uncaughtException', (error) => {
  log('dev', `未捕获异常: ${error.stack || error.message}`)
  void shutdown()
})

if ([backendOnly, frontendOnly].filter(Boolean).length > 1) {
  log('dev', '不能同时使用多个 only 参数')
  process.exit(1)
}

if (!frontendOnly) {
  startBackend()
  refreshWatchers()
  log('backend', `已监听 ${watchers.size} 个目录，保存后自动重启`)
}

if (!backendOnly) {
  startFrontend()
}

if (!backendOnly && !frontendOnly) {
  log('dev', `打开 http://localhost:${frontendPort} 进行本地开发，API 代理到 ${backendUrl}`)
}
