import { create } from 'zustand'
import type { Project, Task, AnalysisResult, Threshold, AuditEntry } from '@/types'
import { projects, tasks, analysisResults, thresholds, audits } from '@/data/mock'
import {
  streamChat, buildSystemPrompt, buildUserPrompt, parseAssistantToResult,
  llmIsAvailable, type AnalyzeInput
} from '@/lib/llm'

interface AppState {
  projects: Project[]
  tasks: Record<string, Task[]>
  results: Record<string, AnalysisResult>
  thresholds: Threshold[]
  audits: AuditEntry[]
  selectedTaskId: string | null
  selectedProjectId: string | null
  selectedProject: Project | null
  llmReady: boolean
  setSelectedTask: (id: string | null) => void
  setSelectedProject: (id: string | null) => void
  analyzeTask: (taskId: string, projectId: string, onDelta?: (chunk: string, full: string) => void) => Promise<AnalysisResult>
  cancelAnalysis: () => void
  updateThreshold: (grade: string, patch: Partial<Threshold>) => void
  resetAll: () => void
  _analysisAbort: AbortController | null
}

function makeWave(count = 800, seed = 1) {
  const out: import('@/types').WavePoint[] = []
  const rnd = (i: number) => {
    const x = Math.sin((i + seed) * 0.73) * 0.5 + Math.cos((i + seed) * 0.31) * 0.35
    return x + (Math.random() - 0.5) * 0.18
  }
  for (let i = 0; i < count; i++) {
    out.push({ t_ms: i * 0.02, amp: rnd(i) })
  }
  return out
}

function makeAnalysisInput(task: Task, project: Project): AnalyzeInput {
  const raw = makeWave(800, (task.id.charCodeAt(task.id.length - 1) || 48))
  const filtered = makeWave(800, (task.id.charCodeAt(task.id.length - 1) || 48))
  const abnormalIdx = new Set<number>()
  for (let i = 110; i < filtered.length - 20; i += 180 + Math.floor(Math.random() * 40)) {
    for (let j = -8; j <= 8; j++) abnormalIdx.add(i + j)
  }
  filtered.forEach((p, i) => {
    if (abnormalIdx.has(i)) {
      p.amp = -0.8 - Math.random() * 0.2
      ;(p as any).abnormal = true
    }
  })
  const amps = raw.map(p => p.amp)
  const sorted = [...amps].sort((a, b) => Math.abs(a) - Math.abs(b))
  const q = sorted[Math.floor(sorted.length * 0.05)]
  const nBelow = amps.filter(v => Math.abs(v) < Math.abs(q)).length
  const snr = 10 * Math.log10(nBelow / 10) + 15
  const abnCount = abnormalIdx.size
  const deviceMap: Record<string, string> = { ultrasound: '超声波 UT', gpr: '探地雷达 GPR', xray: 'X 射线' }
  return {
    projectName: project.name,
    taskName: task.name,
    materialGrade: project.materialGrade,
    device: deviceMap[project.device] || project.device,
    structure: project.structure,
    snr,
    pointCount: raw.length,
    abnormalCount: abnCount,
    amplitudeRange: `${amps.reduce((m, v) => Math.max(m, v), -Infinity).toFixed(2)} ~ ${amps.reduce((m, v) => Math.min(m, v), Infinity).toFixed(2)}`,
    velocityRange: `3400 ~ 4200 m/s`,
    filteredSummary: `去噪后异常点初筛 ${abnCount} 处，位于深度 0.1~1.6 m 之间`
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: projects.map(p => ({ ...p })),
  tasks: { ...tasks },
  results: { ...analysisResults },
  thresholds: thresholds.map(t => ({ ...t })),
  audits: audits.slice(),
  selectedTaskId: null,
  selectedProjectId: null,
  selectedProject: null,
  llmReady: llmIsAvailable,
  _analysisAbort: null,

  setSelectedTask: id => set({ selectedTaskId: id }),
  setSelectedProject: id => set({ selectedProjectId: id, selectedProject: get().projects.find(p => p.id === id) || null }),

  analyzeTask: async (taskId, projectId, onDelta) => {
    const { projects, tasks, results } = get()
    const proj = projects.find(p => p.id === projectId)
    const taskList = tasks[projectId] ?? []
    const task = taskList.find(t => t.id === taskId)
    if (!proj || !task) {
      throw new Error('project or task not found')
    }

    const rawWave = makeWave(800, (task.id.charCodeAt(task.id.length - 1) || 48))
    const filteredWave = makeWave(800, (task.id.charCodeAt(task.id.length - 1) || 48))
    const abnormalIdx = new Set<number>()
    for (let i = 110; i < filteredWave.length - 20; i += 180 + Math.floor(Math.random() * 40)) {
      for (let j = -8; j <= 8; j++) abnormalIdx.add(i + j)
    }
    filteredWave.forEach((p, i) => {
      if (abnormalIdx.has(i)) {
        p.amp = -0.85 - Math.random() * 0.15
        ;(p as any).abnormal = true
      }
    })

    const inp = makeAnalysisInput(task, proj)
    const ctrl = new AbortController()
    set({ _analysisAbort: ctrl })

    const messages = [buildSystemPrompt(), buildUserPrompt(inp)]

    let assistantText = ''
    await new Promise<void>(resolve => {
      streamChat(messages, {
        onDelta: delta => {
          assistantText += delta
          onDelta?.(delta, assistantText)
        },
        onDone: () => resolve(),
        onError: err => {
          onDelta?.(`\n[Qwen3.7-Plus 连接异常：${err.message}]`, assistantText + err.message)
          resolve()
        }
      }, ctrl.signal)
    })

    const parsed = parseAssistantToResult(assistantText, {
      snr: inp.snr,
      filteredAnomalies: abnormalIdx.size,
      taskId, projectId
    })
    const res: AnalysisResult = {
      ...parsed,
      rawWave,
      filteredWave,
      taskId
    }

    set(s => ({ results: { ...s.results, [taskId]: res } }))
    set(s => ({ audits: [{
      id: `A-${Date.now()}`,
      actor: '检测工程师',
      action: 'analyze',
      target: taskId,
      meta: JSON.stringify({
        engine: 'qwen-plus',
        chars: assistantText.length,
        defects: parsed.defects.length,
        confAvg: parsed.confidenceAvg
      }),
      ts: new Date().toISOString()
    }, ...s.audits] }))
    const ps = get().projects.map(p =>
      p.id === projectId && p.status !== 'reported' ? { ...p, status: 'analyzed' as const } : p
    )
    set({ projects: ps, _analysisAbort: null })
    return res
  },

  cancelAnalysis: () => {
    const a = get()._analysisAbort
    if (a) a.abort()
    set({ _analysisAbort: null })
  },

  updateThreshold: (grade, patch) => set(s => ({
    thresholds: s.thresholds.map(t => t.grade === grade ? { ...t, ...patch } : t)
  })),

  resetAll: () => set({
    projects: projects.map(p => ({ ...p })),
    tasks: { ...tasks },
    results: { ...analysisResults },
    thresholds: thresholds.map(t => ({ ...t })),
    audits: audits.slice()
  })
}))
