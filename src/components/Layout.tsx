import { NavLink, Outlet } from 'react-router-dom'
import { Activity, Database, Sparkles, BarChart3, FileText, Settings, Radar, ChevronRight, Cpu, User } from 'lucide-react'

const NAV = [
  { to: '/', label: '总览驾驶舱', icon: Radar },
  { to: '/acquisition', label: '数据采集', icon: Database },
  { to: '/analysis', label: 'AI 智能分析', icon: Sparkles },
  { to: '/visualize', label: '缺陷可视化', icon: BarChart3 },
  { to: '/reports', label: '检测报表', icon: FileText },
  { to: '/settings', label: '系统设置', icon: Settings }
]

function isActive({ isActive }: { isActive: boolean }) {
  return isActive
}

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-steel-900 text-white">
      <aside className="w-60 shrink-0 border-r border-white/5 bg-[#081822] flex flex-col">
        <div className="px-5 pt-5 pb-4 flex items-center gap-2 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tech to-tech-dark flex items-center justify-center shadow-md">
            <Cpu size={18} />
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight">凝智 NDI</div>
            <div className="text-[10px] font-mono text-white/50 tracking-widest">QWEN3.7 · PLUS</div>
          </div>
        </div>
        <nav className="flex-1 pt-4 px-3 space-y-1">
          {NAV.map(n => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                    isActive
                      ? 'bg-tech/15 text-tech-light border border-tech/30 shadow-[0_0_0_1px_rgba(22,160,133,0.3)]'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={17} />
                <span className="flex-1">{n.label}</span>
                <ChevronRight size={14} className="opacity-30 group-hover:opacity-80 transition" />
              </NavLink>
            )
          })}
        </nav>
        <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-full bg-steel-500/70 grid place-items-center">
            <User size={14} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">王工</div>
            <div className="text-white/40 font-mono">检测工程师</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-tech pulse-dot" />
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-steel-800/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <Activity size={14} className="text-tech-light" />
            <span className="text-xs font-mono text-white/50">
              阿里云百炼 · qwen-plus · {new Date().toLocaleDateString('zh-CN')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-tech/10 border-tech/30 text-tech-light">
              <span className="w-1.5 h-1.5 rounded-full bg-tech pulse-dot" />
              模型在线
            </span>
            <span className="badge">v1.0.0</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[#081822] bg-grid-deep">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
