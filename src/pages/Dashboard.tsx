import { useMemo } from 'react'
import { Activity, Database, Target, TrendingUp, HardDrive, Cpu } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import { trend30d, materialDist, kpi } from '@/data/mock'
import { DeviceLabel } from '@/types'
import { fmtDate } from '@/lib/utils'
import KpiCard from '@/components/KpiCard'

export default function Dashboard() {
  const { projects, audits } = useAppStore()
  const trend = useMemo(() => trend30d(), [])
  const totalSamples = projects.reduce((s, p) => s + p.sampleCount, 0)
  const analyzedSamples = projects.reduce((s, p) => s + p.analyzedCount, 0)
  const statusMap = {
    draft: { name: '草稿', color: '#6FA8C8' },
    testing: { name: '采集中', color: '#F39C12' },
    analyzed: { name: '已分析', color: '#16A085' },
    reported: { name: '已报告', color: '#57E0C0' }
  }

  return (
    <div className="p-6 max-w-[1520px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-title">OPERATIONS COMMAND</div>
          <h1 className="text-2xl font-semibold mt-1">总览驾驶舱</h1>
          <p className="text-sm text-white/50 mt-1">模型: Qwen3.7-Plus · 规则引擎 v1.2 · 全部检测数据已本地化存储</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Cpu size={14} className="text-tech-light" />
          <span className="font-mono text-tech-light">模型调用 184 次 · P95 延迟 486ms</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="今日检测样本" value={kpi.todayTests} delta="较昨日 +2" icon={<Activity size={18} />} color="#16A085" />
        <KpiCard label="待分析样本" value={kpi.pendingSamples} delta="含新上传 4 份" icon={<Database size={18} />} color="#F39C12" />
        <KpiCard label="缺陷检出率" value={`${kpi.defectRate}%`} delta="近 30 天趋势稳定" icon={<Target size={18} />} color="#C0392B" />
        <KpiCard label="平均置信度" value={kpi.avgConfidence} delta="综合评估" icon={<TrendingUp size={18} />} color="#57E0C0" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">DEFECT · 30 天趋势</div>
            <span className="badge">缺陷级别堆叠</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6B0F1A" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6B0F1A" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C0392B" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#C0392B" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gMid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F39C12" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#F39C12" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A085" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#16A085" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F2837', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  labelStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}
                />
                <Area type="monotone" dataKey="critical" stackId="s" stroke="#6B0F1A" fill="url(#gCrit)" />
                <Area type="monotone" dataKey="high" stackId="s" stroke="#C0392B" fill="url(#gHigh)" />
                <Area type="monotone" dataKey="medium" stackId="s" stroke="#F39C12" fill="url(#gMid)" />
                <Area type="monotone" dataKey="low" stackId="s" stroke="#16A085" fill="url(#gLow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="section-title mb-2">MATERIAL · 分布</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ background: '#0F2837', border: '1px solid rgba(255,255,255,0.08)' }} />
                <Pie data={materialDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  <Cell key="c1" fill="#16A085" />
                  <Cell key="c2" fill="#F39C12" />
                  <Cell key="c3" fill="#3D7AA1" />
                  <Cell key="c4" fill="#C0392B" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {materialDist.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: ['#16A085', '#F39C12', '#3D7AA1', '#C0392B'][i] }} />
                <span className="font-mono text-white/70">{m.name}</span>
                <span className="ml-auto font-mono text-white/50">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title">PROJECTS · 项目总览</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-white/50">累计样本</span>
              <span className="font-mono text-tech-light">{analyzedSamples}/{totalSamples}</span>
            </div>
          </div>
          <div className="overflow-auto max-h-[360px]">
            <table className="w-full text-sm">
              <thead className="text-[11px] font-mono uppercase text-white/40">
                <tr>
                  <th className="text-left py-2">项目</th>
                  <th className="text-left">材料</th>
                  <th className="text-left">设备</th>
                  <th className="text-right">样本</th>
                  <th className="text-right">已分析</th>
                  <th className="text-right">状态</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-white/40 font-mono">{p.site}</div>
                    </td>
                    <td className="font-mono text-white/70">{p.materialGrade}</td>
                    <td className="font-mono text-white/70">{DeviceLabel[p.device]}</td>
                    <td className="text-right font-mono">{p.sampleCount}</td>
                    <td className="text-right font-mono">{p.analyzedCount}</td>
                    <td className="text-right">
                      <span className="badge" style={{ borderColor: `${statusMap[p.status].color}55` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusMap[p.status].color }} />
                        {statusMap[p.status].name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">ENGINE · 实时状态</div>
            <HardDrive size={14} className="text-white/40" />
          </div>
          <div className="space-y-2">
            {kpi.models.map((m, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-steel-700/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{m.name}</span>
                  <span className="badge bg-tech/10 border-tech/30 text-tech-light">
                    <span className="w-1.5 h-1.5 rounded-full bg-tech pulse-dot" /> running
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 text-[11px]">
                  <div>
                    <div className="text-white/40">24h 调用</div>
                    <div className="font-mono">{m.calls24h}</div>
                  </div>
                  <div>
                    <div className="text-white/40">P95 延迟</div>
                    <div className="font-mono text-amber">{m.latencyMs}ms</div>
                  </div>
                  <div>
                    <div className="text-white/40">可用率</div>
                    <div className="font-mono text-tech-light">{m.uptime999}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="section-title mb-2">AUDIT · 最近审计</div>
            <div className="space-y-1.5 text-xs">
              {audits.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-center gap-2 border-l-2 border-tech/40 pl-2">
                  <span className="font-mono text-white/40 w-20">{new Date(a.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-mono text-amber">{a.actor}</span>
                  <span className="text-white/70">{a.action}</span>
                  <span className="font-mono text-tech-light">{a.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
