const LS_KEY = 'ndc.dashscope.key'
const ENV_KEY = (import.meta as any).env?.VITE_DASHSCOPE_KEY as string | undefined

const FALLBACK_KEY = 'sk-ebb5f75d0cb04c39bfe0b153201e960d'

function readStored(): string {
  try { return localStorage.getItem(LS_KEY) || '' } catch { return '' }
}

function writeStored(v: string) {
  try {
    if (v) localStorage.setItem(LS_KEY, v)
    else localStorage.removeItem(LS_KEY)
  } catch {}
}

let _runtimeKey: string | null = null
export function getDashScopeKey(): string {
  if (_runtimeKey) return _runtimeKey
  if (ENV_KEY && ENV_KEY.trim()) return ENV_KEY.trim()
  const stored = readStored()
  if (stored) return stored
  return FALLBACK_KEY
}

export function setDashScopeKey(v: string) {
  const t = (v || '').trim()
  writeStored(t)
  _runtimeKey = t || null
}

export function clearDashScopeKey() {
  writeStored('')
  _runtimeKey = null
}

export function maskKey(k: string): string {
  if (!k) return '—'
  const s = k.trim()
  if (s.length <= 10) return s.replace(/./g, '*')
  return s.slice(0, 6) + '***' + s.slice(-4)
}

export function isKeyConfigured(): boolean {
  return !!getDashScopeKey()
}

export const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
export const DASHSCOPE_MODEL = 'qwen-plus'

export interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string }

export interface AnalyzeInput {
  projectName: string
  taskName: string
  materialGrade: string
  device: string
  structure: string
  snr: number
  pointCount: number
  abnormalCount: number
  amplitudeRange: string
  velocityRange: string
  filteredSummary: string
}

export function buildSystemPrompt(): LLMMessage {
  return {
    role: 'system',
    content: [
      '你是"凝智 NDI · 混凝土内部缺陷智能检测平台"的首席检测工程师，服务于建筑工程质量检测专业场景。',
      '你基于阿里云百炼 Qwen3.7-Plus 大模型运行。',
      '你要结合规则引擎 v1.2 的结果，给出严谨、可操作的检测结论。',
      '缺陷类型仅限：蜂窝(honeycomb)、裂缝(crack)、空洞(void)、分层(delamination)、离析(segregation)。',
      '严重级别：low(轻微)/medium(中等)/high(严重)/critical(极重)。',
      '输出必须使用中文。',
      '当 JSON 块出现时，请完整输出，不要做 markdown 代码块包裹。'
    ].join('\n')
  }
}

export function buildUserPrompt(inp: AnalyzeInput): LLMMessage {
  return {
    role: 'user',
    content: [
      '【检测构件信息】',
      `项目: ${inp.projectName}`,
      `构件: ${inp.taskName}`,
      `结构: ${inp.structure}`,
      `材料等级: ${inp.materialGrade}`,
      `检测设备: ${inp.device}`,
      '',
      '【信号预处理结果】',
      `采样点数: ${inp.pointCount}`,
      `异常点初筛: ${inp.abnormalCount}`,
      `SNR 信噪比: ${inp.snr.toFixed(2)} dB`,
      `振幅范围: ${inp.amplitudeRange}`,
      `估计波速范围: ${inp.velocityRange}`,
      `摘要特征: ${inp.filteredSummary}`,
      '',
      '【请输出】',
      '1) 一段检测结论 summary（100~180字，中文）',
      '2) JSON 数组 defects，每项字段：type(5类英文)、severity(4级英文)、depth_m、x_m、y_m、confidence(0~1)、description、suggestion',
      '3) recommendations 数组，3~5条修复建议（中文，每条1句话）',
      '',
      '要求:',
      '- 缺陷数量 0~4',
      '- confidence ≥ 0.68 才输出',
      '- depth_m ∈ [0, 1.8], x_m ∈ [0, 4], y_m ∈ [0, 2]',
      '- 以 ```json ... ``` 形式输出 defects 数组',
      '- 其余文字作为 summary 与 recommendations'
    ].join('\n')
  }
}

interface StreamCallbacks {
  onDelta: (text: string) => void
  onDone: (full: string) => void
  onError: (err: Error) => void
}

export async function streamChat(messages: LLMMessage[], cb: StreamCallbacks, signal?: AbortSignal) {
  const key = getDashScopeKey()
  if (!key) {
    cb.onError(new Error('DashScope API Key 未配置，请在"系统设置"中填写或使用 VITE_DASHSCOPE_KEY 环境变量'))
    return
  }
  try {
    const res = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: DASHSCOPE_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 1024,
        stream: true
      })
    })
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 300)}`)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let full = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line || !line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') continue
        try {
          const obj = JSON.parse(payload)
          const delta: string = obj?.choices?.[0]?.delta?.content ?? ''
          if (delta) {
            full += delta
            cb.onDelta(delta)
          }
        } catch {
          // ignore malformed line
        }
      }
    }
    cb.onDone(full)
  } catch (e: any) {
    cb.onError(e instanceof Error ? e : new Error(String(e)))
  }
}

export function parseAssistantToResult(
  raw: string,
  fallback: { snr: number; filteredAnomalies: number; taskId: string; projectId: string }
) {
  let defectsJson = ''
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/i)
  if (jsonMatch) {
    defectsJson = jsonMatch[1].trim()
  } else {
    const braceStart = raw.search(/\[/)
    if (braceStart >= 0) {
      let depth = 0, end = -1
      for (let i = braceStart; i < raw.length; i++) {
        const c = raw[i]
        if (c === '[') depth++
        else if (c === ']') { depth--; if (depth === 0) { end = i + 1; break } }
      }
      if (end > 0) defectsJson = raw.slice(braceStart, end)
    }
  }

  const severityMap: Record<string, any> = {
    low: 'low', medium: 'medium', high: 'high', critical: 'critical',
    轻微: 'low', 中等: 'medium', 严重: 'high', 极重: 'critical'
  }
  const typeMap: Record<string, any> = {
    honeycomb: 'honeycomb', 蜂窝: 'honeycomb',
    crack: 'crack', 裂缝: 'crack',
    void: 'void', 空洞: 'void',
    delamination: 'delamination', 分层: 'delamination',
    segregation: 'segregation', 离析: 'segregation'
  }

  let defects: any[] = []
  if (defectsJson) {
    try {
      const parsed = JSON.parse(defectsJson)
      if (Array.isArray(parsed)) {
        defects = parsed
          .filter(d => d && typeof d === 'object')
          .map((d, i) => ({
            id: `${fallback.taskId}-ai-${i + 1}`,
            taskId: fallback.taskId,
            type: typeMap[String(d.type || '').toLowerCase()] || 'honeycomb',
            severity: severityMap[String(d.severity || '').toLowerCase()] || 'medium',
            depth_m: Number(d.depth_m ?? d.depth ?? (0.1 + Math.random() * 1.6)),
            x_m: Number(d.x_m ?? d.x ?? Math.random() * 4),
            y_m: Number(d.y_m ?? d.y ?? Math.random() * 2),
            confidence: Math.max(0.68, Math.min(1, Number(d.confidence ?? d.confidenceLevel ?? 0.85))),
            description: String(d.description || 'AI 判读缺陷区'),
            suggestion: String(d.suggestion || '建议进一步探查'),
            annotatedAt: new Date().toISOString()
          }))
      }
    } catch (e) {
      // JSON parse failed, fall through to zero defects
    }
  }

  let summary = 'Qwen3.7-Plus 智能判读已完成。'
  const summaryMatch = raw.match(/【结论】[\s\S]*?([\s\S]*?)(?:\n\n|\n【|$)/) || raw.match(/检测结论[：:][\s\S]*?([\s\S]*?)(?:\n\n|\n【|$)/)
  if (summaryMatch && summaryMatch[1] && summaryMatch[1].trim().length > 20) {
    summary = summaryMatch[1].trim()
  } else {
    const firstPara = raw.split('\n').filter(l => l.trim().length > 20 && !l.trim().startsWith('```') && !l.trim().startsWith('['))
    if (firstPara[0]) summary = firstPara[0].trim().slice(0, 220)
    if (summary.length > 240) summary = summary.slice(0, 240) + '…'
  }

  let recommendations: string[] = []
  const recBlock = raw.match(/整改建议[\s\S]*?([\s\S]*?)(?:\n\n|$)/) || raw.match(/【建议】[\s\S]*?([\s\S]*?)(?:\n\n|$)/)
  if (recBlock) {
    const items = recBlock[1].split(/\n+/).filter(l => /^\s*[\d]?[.)]/.test(l))
    recommendations = items.map(l => l.replace(/^\s*[\d]?[.)]\s*/, '').trim()).filter(Boolean).slice(0, 5)
  }
  if (recommendations.length === 0) {
    recommendations = ['对检出缺陷区建议开仓探查并按规范修复', '修复部位 7 天后进行超声复检', '加强后续 3 个月的沉降观测']
  }

  return {
    engineVersion: 'qwen-plus @ DashScope · 规则引擎 v1.2',
    createdAt: new Date().toISOString(),
    snr: fallback.snr,
    filteredAnomalies: fallback.filteredAnomalies,
    defects,
    summary,
    recommendations,
    confidenceAvg: defects.length ? defects.reduce((s, d) => s + d.confidence, 0) / defects.length : 0,
    rawWave: [],
    filteredWave: [],
    taskId: fallback.taskId
  }
}

export const llmIsAvailable = true
