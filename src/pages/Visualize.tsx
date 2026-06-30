import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { DefectTypeLabel, SeverityLabel } from '@/types'
import { severityColor } from '@/lib/utils'

function DefectSlice({ defects, width = 520, height = 320 }: { defects: any[]; width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const dpr = window.devicePixelRatio || 1
    cvs.width = width * dpr
    cvs.height = height * dpr
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#0F2837'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let gx = 0; gx <= width; gx += 32) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke()
    }
    for (let gy = 0; gy <= height; gy += 32) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(87,224,192,0.6)'
    ctx.lineWidth = 1.2
    ctx.strokeRect(40, 40, width - 80, height - 80)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillText('表面 (0)', width / 2 - 12, 30)
    ctx.fillText('深度方向', 10, height / 2)
    ctx.fillText('X 方向', width - 60, height - 12)
    ctx.fillText('构件切片 (x-z 剖面)', width / 2 - 40, height - 6)

    if (!defects.length) {
      ctx.fillStyle = 'rgba(87,224,192,0.45)'
      ctx.font = '12px JetBrains Mono, monospace'
      ctx.fillText('未检出缺陷 · 超声波速分布均匀', 140, height / 2)
      return
    }

    for (const d of defects) {
      const cx = 40 + ((d.x_m % 4) / 4) * (width - 80)
      const cy = 40 + (d.depth_m / 1.8) * (height - 80)
      const radius = 14 + d.confidence * 22
      const col = severityColor(d.severity)

      const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius)
      grd.addColorStop(0, col + 'CC')
      grd.addColorStop(0.4, col + '66')
      grd.addColorStop(1, col + '00')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = col
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = '10px JetBrains Mono, monospace'
      ctx.fillText(`${DefectTypeLabel[d.type]}${(d.confidence * 100).toFixed(0)}%`, cx - 22, cy - radius - 4)
    }
  }, [defects, width, height])
  return <canvas ref={ref} style={{ width, height }} />
}

function HeatMap({ defects, width = 520, height = 320 }: { defects: any[]; width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const dpr = window.devicePixelRatio || 1
    cvs.width = width * dpr
    cvs.height = height * dpr
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const binsX = 20, binsY = 12
    const grid: number[][] = []
    for (let i = 0; i < binsY; i++) grid.push(new Array(binsX).fill(0))
    defects.forEach(d => {
      const xi = Math.min(binsX - 1, Math.max(0, Math.floor(((d.x_m % 4) / 4) * binsX)))
      const yi = Math.min(binsY - 1, Math.max(0, Math.floor(((d.y_m % 2) / 2) * binsY)))
      const weight = d.severity === 'critical' ? 4 : d.severity === 'high' ? 3 : d.severity === 'medium' ? 2 : 1
      grid[yi][xi] += weight
    })

    let max = 0
    grid.forEach(r => r.forEach(v => { if (v > max) max = v }))
    if (max === 0) max = 1

    const w = width / binsX, h = height / binsY
    for (let iy = 0; iy < binsY; iy++) {
      for (let ix = 0; ix < binsX; ix++) {
        const v = grid[iy][ix] / max
        let r = Math.round(22 + v * 233), g = Math.round(160 - v * 121), b = Math.round(133 - v * 118)
        ctx.fillStyle = `rgba(${r},${g},${b},${0.2 + v * 0.75})`
        ctx.fillRect(ix * w + 1, iy * h + 1, w - 2, h - 2)
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillText('检测面 x/y 缺陷强度热力图', 10, height - 6)
  }, [defects, width, height])
  return <canvas ref={ref} style={{ width, height }} />
}

function SeverityBar({ defects }: { defects: any[] }) {
  const hist = useMemo(() => {
    const m: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    defects.forEach(d => { m[d.severity] = (m[d.severity] || 0) + 1 })
    return m
  }, [defects])
  const total = defects.length || 1
  const W = 360, H = 200
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {(['critical', 'high', 'medium', 'low'] as const).map((s, i) => {
        const col = severityColor(s)
        const h = (hist[s] / total) * (H - 40) + 4
        return (
          <g key={s}>
            <rect x={24 + i * 72} y={H - 20 - h} width={56} height={h} rx={4} fill={col} opacity={0.85} />
            <text x={24 + i * 72 + 28} y={H - 26} textAnchor="middle" fontSize={12} fontFamily="JetBrains Mono" fill="white">{hist[s]}</text>
            <text x={24 + i * 72 + 28} y={H - 8} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" fill="rgba(255,255,255,0.55)">{SeverityLabel[s]}</text>
          </g>
        )
      })}
      <text x={16} y={16} fontSize={10} fontFamily="JetBrains Mono" fill="rgba(255,255,255,0.5)">SEVERITY · 分布</text>
    </svg>
  )
}

export default function Visualize() {
  const { projects, tasks, results, setSelectedProject, setSelectedTask, selectedProjectId, selectedTaskId } = useAppStore()

  const proj = projects.find(p => p.id === selectedProjectId) || projects[0]
  const taskList = proj ? (tasks[proj.id] ?? []) : []
  const task = taskList.find(t => t.id === selectedTaskId) || taskList[0]
  const result = task ? results[task.id] : undefined

  const defects = result?.defects ?? []
  const [probe, setProbe] = useState(0)
  useEffect(() => {
    if (result?.filteredWave && result.filteredWave.length > 0) {
      const t = setInterval(() => setProbe(p => (p + 1) % result!.filteredWave.length), 80)
      return () => clearInterval(t)
    }
  }, [result])

  return (
    <div className="p-6 max-w-[1520px] mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-title">VISUALIZE · MULTI-D</div>
          <h1 className="text-2xl font-semibold mt-1">缺陷多维度可视化</h1>
          <p className="text-sm text-white/50 mt-1">构件切片 · 热力图 · 严重级别分布 · 波速/振幅剖面</p>
        </div>
      </div>

      <div className="card flex items-center gap-4 flex-wrap">
        <select
          value={proj?.id ?? ''}
          onChange={e => { const p = projects.find(x => x.id === e.target.value); if (p) { setSelectedProject(p.id); const t = (tasks[p.id] ?? [])[0]; if (t) setSelectedTask(t.id) } }}
          className="bg-steel-700/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-w-[260px]"
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={task?.id ?? ''}
          onChange={e => setSelectedTask(e.target.value)}
          className="bg-steel-700/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-w-[260px]"
        >
          {taskList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {proj && <span className="badge">构件 {proj.structure} · {proj.materialGrade} · {proj.engineer}</span>}
        {result && (
          <>
            <span className="badge bg-tech/10 border-tech/30 text-tech-light">SNR {result.snr.toFixed(1)} dB</span>
            <span className="badge bg-amber/10 border-amber/30 text-amber">置信度 {result.confidenceAvg}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">构件切片 · XZ 剖面</div>
            <span className="badge">检测面 z=0→表面</span>
          </div>
          <DefectSlice defects={defects} />
          <div className="mt-3 flex flex-wrap gap-2">
            {defects.map(d => (
              <span key={d.id} className="badge" style={{ borderColor: `${severityColor(d.severity)}66`, color: severityColor(d.severity) }}>
                {DefectTypeLabel[d.type]} · {SeverityLabel[d.severity]} · {(d.confidence * 100).toFixed(0)}%
              </span>
            ))}
            {!defects.length && <span className="badge">无缺陷</span>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">热力图 · XY 检测面</div>
            <span className="badge">颜色=严重程度</span>
          </div>
          <HeatMap defects={defects} />
          <div className="mt-2 grid grid-cols-4 text-[10px] font-mono">
            <div><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#16A085' }}/>轻微</div>
            <div><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#F39C12' }}/>中等</div>
            <div><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#C0392B' }}/>严重</div>
            <div><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#6B0F1A' }}/>极重</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">波速 / 振幅剖面 · 随时间采样</div>
            {result?.filteredWave && result.filteredWave[probe] && (
              <span className="badge font-mono">
                t={result.filteredWave[probe].t_ms.toFixed(2)}ms amp={result.filteredWave[probe].amp.toFixed(2)}
              </span>
            )}
          </div>
          <svg viewBox="0 0 780 200" className="w-full h-[220px]">
            <defs>
              <linearGradient id="wv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#57E0C0" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#57E0C0" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <rect width="780" height="200" fill="#0F2837" rx="8" />
            <line x1="0" y1="100" x2="780" y2="100" stroke="rgba(255,255,255,0.15)" />
            {result?.filteredWave?.slice(0, 400).map((p, i) => {
              const x = (i / 400) * 780
              const y = 100 - p.amp * 70
              return <circle key={i} cx={x} cy={y} r={0.9} fill="#57E0C0" />
            })}
            {result?.filteredWave?.slice(0, 400).map((p, i) => {
              if (!p.abnormal) return null
              const x = (i / 400) * 780
              const y = 100 - p.amp * 70
              return <circle key={'a' + i} cx={x} cy={y} r={3.5} fill="#C0392B" />
            })}
            {result?.filteredWave && result.filteredWave[probe] && (
              <line x1={(probe / result.filteredWave.length) * 780} y1={0} x2={(probe / result.filteredWave.length) * 780} y2={200} stroke="#F39C12" strokeDasharray="4 3" />
            )}
          </svg>
          <div className="mt-2 text-[11px] text-white/50 font-mono">红色圆点=自动判定异常点 · 琥珀虚线=当前采样探头位置</div>
        </div>
        <div className="card">
          <div className="section-title mb-1">缺陷严重级别分布</div>
          <SeverityBar defects={defects} />
          <div className="mt-3 rounded-xl border border-white/10 p-3 text-[12px] text-white/80">
            <div className="font-mono text-white/40 mb-1">Qwen3.7-Plus 总结</div>
            {result?.summary || '暂无分析，请在"AI 智能分析"中运行。'}
          </div>
        </div>
      </div>
    </div>
  )
}
