import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  delta?: string
  icon?: ReactNode
  color?: string
}

export default function KpiCard({ label, value, delta, icon, color = '#16A085' }: Props) {
  return (
    <div className="card relative overflow-hidden slide-up">
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono tracking-wider text-white/50">{label}</div>
        <div className="w-9 h-9 rounded-lg border border-white/10 grid place-items-center text-white/70">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-mono" style={{ color }}>{value}</div>
      {delta && <div className="mt-1 text-[11px] font-mono text-tech-light/80">{delta}</div>}
    </div>
  )
}
