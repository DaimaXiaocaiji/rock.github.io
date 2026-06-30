import { useMemo, useState } from 'react'
import { Search, Upload, Filter } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { fmtDate } from '@/lib/utils'
import { DeviceLabel, ProjectStatus } from '@/types'
import WaveChart from '@/components/WaveChart'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: '草稿', testing: '采集中', analyzed: '已分析', reported: '已报告'
}
const STATUS_COLOR: Record<ProjectStatus, string> = {
  draft: '#6FA8C8', testing: '#F39C12', analyzed: '#16A085', reported: '#57E0C0'
}

export default function Acquisition() {
  const { projects, tasks, results, setSelectedProject, setSelectedTask, selectedProjectId, selectedTaskId } = useAppStore()
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all')

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchQ = !q || p.name.includes(q) || p.id.toLowerCase().includes(q.toLowerCase())
      const matchS = filterStatus === 'all' || p.status === filterStatus
      return matchQ && matchS
    })
  }, [q, filterStatus, projects])

  const proj = projects.find(p => p.id === selectedProjectId) || filteredProjects[0]
  const taskList = proj ? (tasks[proj.id] ?? []) : []
  const currentTask = taskList.find(t => t.id === selectedTaskId) || taskList[0]
  const res = currentTask ? results[currentTask.id] : undefined

  return (
    <div className="p-6 max-w-[1520px] mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-title">ACQUISITION · RAW DATA</div>
          <h1 className="text-2xl font-semibold mt-1">数据采集管理</h1>
          <p className="text-sm text-white/50 mt-1">原始超声/探地雷达/X 射线检测曲线与异常点标注</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm">
            <Upload size={15} /> 上传原始数据
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tech text-sm font-medium hover:bg-tech-dark">
            新增项目
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-4">
        <div className="card p-0">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="搜索项目名称或编号"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-steel-700/40 border border-white/10 focus:border-tech/60 outline-none text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`text-[11px] px-2 py-1 rounded-full border ${filterStatus === 'all' ? 'border-tech/40 bg-tech/15 text-tech-light' : 'border-white/10 text-white/60'}`}
              >全部</button>
              {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-[11px] px-2 py-1 rounded-full border ${filterStatus === s ? 'border-tech/40 bg-tech/15 text-tech-light' : 'border-white/10 text-white/60'}`}
                >{STATUS_LABEL[s]}</button>
              ))}
            </div>
          </div>
          <div className="max-h-[560px] overflow-auto">
            {filteredProjects.map(p => {
              const active = p.id === (proj?.id ?? '')
              return (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProject(p.id); const first = (tasks[p.id] ?? [])[0]; if (first) setSelectedTask(first.id) }}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer transition ${active ? 'bg-tech/10 border-l-2 border-l-tech' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{p.name}</div>
                    <span className="badge">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[p.status] }} />
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-white/50 flex items-center gap-3">
                    <span>{p.id}</span>
                    <span>{p.materialGrade}</span>
                    <span>{DeviceLabel[p.device]}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-white/40">{p.site} · {fmtDate(p.createdAt)}</div>
                  <div className="mt-1 text-[11px] font-mono text-white/50">
                    {p.analyzedCount}/{p.sampleCount} 已分析
                  </div>
                </div>
              )
            })}
            {!filteredProjects.length && <div className="p-8 text-center text-white/40 text-sm">无匹配项目</div>}
          </div>
        </div>

        <div className="card">
          {proj && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">{proj.name}</div>
                  <div className="text-[11px] font-mono text-white/40">
                    {proj.id} · {proj.site} · {DeviceLabel[proj.device]}
                  </div>
                </div>
                <div className="flex gap-1 text-xs">
                  <span className="badge">结构: {proj.structure}</span>
                  <span className="badge">材料: {proj.materialGrade}</span>
                  <span className="badge">工程师: {proj.engineer}</span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 mb-4">
                {taskList.map(t => {
                  const active = t.id === currentTask?.id
                  const hasRes = results[t.id]
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTask(t.id)}
                      className={`rounded-xl px-3 py-2 border text-left text-xs transition ${active ? 'bg-tech/15 border-tech/40' : 'border-white/10 hover:bg-white/5'}`}
                    >
                      <div className="font-mono text-white/50">{t.id}</div>
                      <div className="font-medium truncate">{t.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px]">
                        <span className="text-white/50">{fmtDate(t.testedAt)}</span>
                        <span className="ml-auto" style={{ color: hasRes ? '#16A085' : '#F39C12' }}>
                          {hasRes ? '已分析' : '待分析'}
                        </span>
                      </div>
                    </button>
                  )
                })}
                {!taskList.length && <div className="col-span-6 text-center text-white/40 py-6 text-sm">暂无检测任务，请先上传原始数据</div>}
              </div>

              {currentTask && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="section-title mb-2">原始检测波形</div>
                    <WaveChart data={res?.rawWave ?? []} stroke="#6FA8C8" />
                    <div className="mt-2 flex gap-3 text-[11px] font-mono text-white/50">
                      <span>X: {currentTask.length_m} m</span>
                      <span>Y: {currentTask.width_m} m</span>
                      <span>厚度: {currentTask.thickness_m} m</span>
                      <span className="ml-auto">位置: {currentTask.position}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="section-title">过滤后曲线</div>
                      {res && <span className="badge">异常过滤 {res.filteredAnomalies} 个 · SNR {res.snr.toFixed(1)}dB</span>}
                    </div>
                    <WaveChart data={res?.filteredWave ?? []} stroke="#F39C12" showAnomalies />
                    <div className="mt-2 text-[11px] text-white/40">红色圆点 = 疑似异常点。已按阈值库自动标红，可手动点击波形校正。</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
