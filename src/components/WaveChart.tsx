import { useEffect, useRef } from 'react'
import type { WavePoint } from '@/types'

interface Props {
  data: WavePoint[]
  height?: number
  showAnomalies?: boolean
  stroke?: string
}

export default function WaveChart({ data, height = 240, showAnomalies = true, stroke = '#57E0C0' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const dpr = window.devicePixelRatio || 1
    const w = cvs.clientWidth
    cvs.width = w * dpr
    cvs.height = height * dpr
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, height)

    const pad = 24
    const plotW = w - pad * 2
    const plotH = height - pad * 2
    if (!data.length) return

    let minA = Infinity, maxA = -Infinity
    data.forEach(p => {
      if (p.amp < minA) minA = p.amp
      if (p.amp > maxA) maxA = p.amp
    })
    const range = Math.max(Math.abs(minA), Math.abs(maxA), 1)
    const toX = (i: number) => pad + (i / (data.length - 1)) * plotW
    const toY = (a: number) => pad + plotH / 2 - (a / range) * (plotH / 2)

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let y = 0; y <= 4; y++) {
      const yy = pad + (plotH / 4) * y
      ctx.beginPath()
      ctx.moveTo(pad, yy)
      ctx.lineTo(pad + plotW, yy)
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.moveTo(pad, pad + plotH / 2)
    ctx.lineTo(pad + plotW, pad + plotH / 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.4
    for (let i = 0; i < data.length; i++) {
      const p = data[i]
      const x = toX(i)
      const y = toY(p.amp)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    if (showAnomalies) {
      ctx.fillStyle = 'rgba(192,57,43,0.9)'
      for (let i = 0; i < data.length; i++) {
        if (data[i].abnormal) {
          ctx.beginPath()
          ctx.arc(toX(i), toY(data[i].amp), 3.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillText(`+${range.toFixed(1)}`, 4, pad + 4)
    ctx.fillText(`0`, 4, pad + plotH / 2 + 4)
    ctx.fillText(`-${range.toFixed(1)}`, 4, pad + plotH + 4)
    ctx.fillText('t (ms)', pad + plotW - 24, height - 4)
  }, [data, height, showAnomalies, stroke])

  return <canvas ref={ref} style={{ width: '100%', height }} />
}
