import { useState } from 'react'
import { Sparkles, ArrowRight, Send, CheckCircle, Zap } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import WaveChart from '@/components/WaveChart'
import { DefectTypeLabel, SeverityLabel, SeverityColor } from '@/types'
import { fmtDateTime, severityColor } from '@/lib/utils'

export default function Analysis() {
  const {
    projects, tasks, results, analyzeTask, cancelAnalysis,
    setSelectedProject, setSelectedTask,
    selectedProjectId, selectedTaskId, llmReady
  } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [phase, setPhase] = useState<string>('')

  const proj = projects.find(p => p.id === selectedProjectId) || projects[0]
  const taskList = proj ? (tasks[proj.id] ?? []) : []
  const task = taskList.find(t => t.id === selectedTaskId) || taskList[0]
  const result = task ? results[task.id] : undefined

  async function runAnalysis() {
    if (!task || !proj) return
    setLoading(true)
    setStreamText('')
    setPhase('预处理 · 构造检测输入...')
    setStreamText('>[Qwen3.7-Plus] 连接阿里云百炼 DashScope OpenAI 兼容网关...\n')
    await new Promise(r => setTimeout(r, 300))
    setPhase('发送流式推理请求...')
    await new Promise(r => setTimeout(r, 200))

    try {
      await analyzeTask(task.id, proj.id, (_delta, full) => {
        setStreamText(full)
        const c = full.length
        if (c < 400) setPhase('Qwen 正在理解构件信息...')
        else if (c < 1200) setPhase('正在判断缺陷类型与定位...')
        else setPhase('综合结论 · 建议生成中...')
      })
    } catch (err: any) {
      setStreamText(s => s + `\n[analyzeTask 失败：${err?.message || err}]`)
    }
    setPhase('完成')
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-[1520px] mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-title">ANALYSIS · QWEN3.7-PLUS</div>
          <h1 className="text-2xl font-semibold mt-1">AI 智能判读工作台</h1>
          <p className="text-sm text-white/50 mt-1">阿里云百炼 Qwen3.7-Plus + 规则引擎 v1.2 双引擎融合</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge border ${llmReady ? 'bg-tech/10 border-tech/30 text-tech-light' : 'bg-danger/10 border-danger/30 text-danger'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-tech pulse-dot" />
            {llmReady ? 'DashScope · qwen-plus · ONLINE' : 'LLM OFFLINE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-4">
        <div className="card p-0">
          <div className="p-4 border-b border-white/5">
            <div className="section-title mb-2">选择构件</div>
            <select
              value={proj?.id ?? ''}
              onChange={e => { const p = projects.find(x => x.id === e.target.value); if (p) { setSelectedProject(p.id); const t = (tasks[p.id] ?? [])[0]; if (t) setSelectedTask(t.id) } }}
              className="w-full bg-steel-700/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="max-h-[480px] overflow-auto">
            {taskList.map(t => {
              const active = t.id === (task?.id ?? '')
              const hasRes = results[t.id]
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t.id)}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer ${active ? 'bg-tech/10 border-l-2 border-l-tech' : 'hover:bg-white/5'}`}
                >
                  <div className="font-mono text-xs text-white/50">{t.id}</div>
                  <div className="font-medium text-sm truncate">{t.name}</div>
                  <div className="mt-1 text-[10px] font-mono text-white/40">{t.position}</div>
                  {hasRes && (
                    <div className="mt-2 text-[10px] flex items-center gap-1 font-mono text-tech-light">
                      <CheckCircle size={11} /> 已有分析
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="section-title mb-1">输入信号</div>
                <div className="font-semibold">{task?.name || '-'}</div>
                <div className="text-xs font-mono text-white/40">
                  构件位置 {task?.position || '-'} · 厚度 {task?.thickness_m ?? 0} m
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loading && (
                  <button onClick={() => cancelAnalysis()} className="px-3 py-2 rounded-xl border border-danger/40 text-danger text-sm hover:bg-danger/10">
                    取消
                  </button>
                )}
                <button
                  onClick={runAnalysis}
                  disabled={!task || loading || !llmReady}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${loading || !task || !llmReady ? 'bg-steel-600/60 cursor-wait' : 'bg-tech hover:bg-tech-dark'}`}
                >
                  {loading ? (<><Zap size={14} className="animate-pulse" />{phase}</>) : (<><Sparkles size={16} />一键 AI 分析</>)}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-1">原始波形</div>
                <WaveChart data={result?.rawWave ?? []} stroke="#6FA8C8" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-1">预处理后（去噪+异常过滤）</div>
                <WaveChart data={result?.filteredWave ?? []} stroke="#F39C12" showAnomalies />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Send size={14} className="text-tech-light" />
                <div className="section-title">Qwen 推理流 · 实时</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3 min-h-[260px] font-mono text-[12px] leading-relaxed text-white/80 whitespace-pre-wrap">
                {streamText || (loading ? '' : (
                  llmReady
                    ? '点击"一键 AI 分析"后，这里将实时显示 Qwen3.7-Plus 与规则引擎的协同推理流。\n\n使用模型：qwen-plus（Qwen3.7-Plus）\nEndpoint: DashScope OpenAI 兼容网关'
                    : '⚠️ LLM 未就绪。请在 src/lib/llm.ts 配置可用的 API Key。'
                ))}
                {loading && <span className="inline-block w-1.5 h-4 bg-tech ml-1 animate-pulse" />}
              </div>
              {result && (
                <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
                  <div className="rounded-lg border border-white/10 p-2">
                    <div className="text-white/40">SNR (dB)</div>
                    <div className="font-mono text-amber">{result.snr.toFixed(1)}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 p-2">
                    <div className="text-white/40">异常过滤</div>
                    <div className="font-mono">{result.filteredAnomalies}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 p-2">
                    <div className="text-white/40">平均置信度</div>
                    <div className="font-mono text-tech-light">{(result.confidenceAvg * 100).toFixed(0)}%</div>
                  </div>
                  <div className="rounded-lg border border-white/10 p-2">
                    <div className="text-white/40">引擎</div>
                    <div className="font-mono text-[10px]">{result.engineVersion}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-tech-light" />
                <div className="section-title">缺陷定位 · 结果</div>
              </div>
              {result && result.defects.length ? (
                <div className="space-y-2">
                  {result.defects.map(d => (
                    <div key={d.id} className="rounded-xl border border-white/10 bg-steel-700/40 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-mono border" style={{ borderColor: `${severityColor(d.severity)}66`, background: `${severityColor(d.severity)}22`, color: severityColor(d.severity) }}>
                            {SeverityLabel[d.severity]}
                          </span>
                          <span className="font-mono text-sm">{DefectTypeLabel[d.type]}</span>
                        </div>
                        <span className="text-[11px] font-mono text-white/50">置信度 {(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 text-[12px] text-white/80">{d.description}</div>
                      <div className="mt-1 text-[11px] font-mono text-white/40">
                        X {d.x_m}m · Y {d.y_m}m · 深度 {d.depth_m}m
                      </div>
                      <div className="mt-1.5 rounded-lg border border-tech/30 bg-tech/10 text-[12px] text-tech-light px-3 py-1.5">
                        建议：{d.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] grid place-items-center text-white/40 text-sm">
                  {result ? '未检出明显缺陷' : '请先运行 AI 分析'}
                </div>
              )}
              {result && (
                <div className="mt-3 rounded-xl border border-white/10 p-3 text-[12px] text-white/80">
                  <div className="font-mono text-white/40 mb-1">综合结论</div>
                  {result.summary}
                  {result.recommendations.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[12px] text-tech-light/90">
                      {result.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  )}
                  <div className="mt-2 text-[11px] font-mono text-white/40">分析时间 {fmtDateTime(result.createdAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
