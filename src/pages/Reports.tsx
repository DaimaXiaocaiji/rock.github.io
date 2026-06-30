import { useMemo, useState } from 'react'
import { FileDown, Eye, Share2, FileText } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { fmtDate, severityColor } from '@/lib/utils'
import { DefectTypeLabel, SeverityLabel, DeviceLabel } from '@/types'

export default function Reports() {
  const { projects, tasks, results } = useAppStore()
  const [activeTaskId, setActiveTaskId] = useState<string>('P001-T01')

  const entries = useMemo(() => {
    const out: Array<{ taskId: string; projectId: string; reportNo: string; project: any; task: any; result: any }> = []
    Object.keys(results).forEach(taskId => {
      const result = results[taskId]
      const task = Object.values(tasks).flat().find(t => t.id === taskId)
      if (!task) return
      const project = projects.find(p => p.id === task.projectId)
      if (!project) return
      out.push({
        taskId, projectId: task.projectId,
        reportNo: `RPT-${project.id}-${task.id}`,
        project, task, result
      })
    })
    return out.sort((a, b) => (b.result?.createdAt || '').localeCompare(a.result?.createdAt || ''))
  }, [projects, tasks, results])

  const current = entries.find(e => e.taskId === activeTaskId) || entries[0]
  const r = current?.result
  const pr = current?.project
  const tk = current?.task

  function downloadPdf() {
    const content = buildReportText(current)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${current?.reportNo || 'RPT'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function buildReportText(e?: any) {
    if (!e) return ''
    const r = e.result, pr = e.project, tk = e.task
    const lines: string[] = []
    lines.push('==================================================================')
    lines.push('    凝智 NDI · 混凝土内部缺陷智能检测报告')
    lines.push('    REQ: GB/T 50107-2010 · 检测标准规范')
    lines.push('==================================================================')
    lines.push('')
    lines.push(`报告编号 : ${e.reportNo}`)
    lines.push(`项目名称 : ${pr.name}`)
    lines.push(`构件部位 : ${tk.name}`)
    lines.push(`构件位置 : ${tk.position}`)
    lines.push(`结构形式 : ${pr.structure}`)
    lines.push(`材料等级 : ${pr.materialGrade}`)
    lines.push(`检测设备 : ${DeviceLabel[pr.device]}`)
    lines.push(`检测日期 : ${fmtDate(tk.testedAt)}`)
    lines.push(`检测工程师 : ${pr.engineer}`)
    lines.push(`分析引擎 : ${r.engineVersion}`)
    lines.push('')
    lines.push('---------------------- 检测结论 ----------------------')
    lines.push(r.summary)
    lines.push(`SNR: ${r.snr.toFixed(1)} dB   置信度: ${r.confidenceAvg}   异常过滤: ${r.filteredAnomalies}`)
    lines.push('')
    lines.push('---------------------- 缺陷清单 ----------------------')
    r.defects.forEach((d: any, i: number) => {
      lines.push(`${i + 1}. [${SeverityLabel[d.severity]}] ${DefectTypeLabel[d.type]} 置信度 ${(d.confidence * 100).toFixed(0)}%`)
      lines.push(`   位置  X=${d.x_m}m  Y=${d.y_m}m  深度=${d.depth_m}m`)
      lines.push(`   描述  ${d.description}`)
      lines.push(`   建议  ${d.suggestion}`)
      lines.push('')
    })
    if (!r.defects.length) lines.push('本次检测未检出明显缺陷，构件内部质量可判为合格。')
    lines.push('---------------------- 整改建议 ----------------------')
    r.recommendations.forEach((rec: string, i: number) => lines.push(`${i + 1}. ${rec}`))
    lines.push('')
    lines.push('==================================================================')
    lines.push('本报告由阿里云百炼 Qwen3.7-Plus 智能判读 + 规则引擎 v1.2 双引擎生成')
    lines.push('报告自动归档，归档人：检测工程师，归档日期：' + fmtDate(r.createdAt))
    lines.push('==================================================================')
    return lines.join('\n')
  }

  return (
    <div className="p-6 max-w-[1520px] mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-title">REPORT · GBT 50107</div>
          <h1 className="text-2xl font-semibold mt-1">检测报表中心</h1>
          <p className="text-sm text-white/50 mt-1">可导出 PDF（当前演示走 TXT / 打印版），自动带水印与签名</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm">
            <Share2 size={14} /> 分享链接
          </button>
          <button onClick={downloadPdf} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tech hover:bg-tech-dark text-sm font-medium">
            <FileDown size={14} /> 导出 PDF/TXT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-4">
        <div className="card p-0">
          <div className="p-4 border-b border-white/5">
            <div className="section-title">报告列表 · {entries.length}</div>
          </div>
          <div className="max-h-[560px] overflow-auto">
            {entries.map(e => {
              const active = e.taskId === activeTaskId
              return (
                <div
                  key={e.taskId}
                  onClick={() => setActiveTaskId(e.taskId)}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer transition ${active ? 'bg-tech/10 border-l-2 border-l-tech' : 'hover:bg-white/5'}`}
                >
                  <div className="font-mono text-xs text-tech-light">{e.reportNo}</div>
                  <div className="font-medium text-sm">{e.project.name}</div>
                  <div className="text-[11px] text-white/50">{e.task.name}</div>
                  <div className="mt-1 flex gap-1">
                    {e.result.defects.slice(0, 3).map((d: any, i: number) => (
                      <span key={i} className="badge" style={{ borderColor: `${severityColor(d.severity)}66`, color: severityColor(d.severity) }}>
                        {DefectTypeLabel[d.type]}
                      </span>
                    ))}
                    <span className="badge">{fmtDate(e.result.createdAt)}</span>
                  </div>
                </div>
              )
            })}
            {!entries.length && <div className="p-8 text-center text-white/40 text-sm">暂无报告</div>}
          </div>
        </div>

        <div className="card">
          {r && pr && tk ? (
            <div className="grid grid-cols-[1fr_400px] gap-4">
              <div className="rounded-2xl border border-white/10 bg-white text-steel-900 p-6 min-h-[620px]" style={{ background: 'linear-gradient(180deg,#fff 0%,#f7f7fb 100%)' }}>
                <div className="flex items-start justify-between border-b border-gray-300 pb-3">
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.3em] text-gray-500">CONCRETE INTERNAL DEFECT · INSPECTION REPORT</div>
                    <div className="text-2xl font-bold mt-1">混凝土内部缺陷智能检测报告</div>
                    <div className="text-[11px] font-mono text-gray-600 mt-0.5">REQ: GB/T 50107-2010 / 智能判读: 阿里云百炼 Qwen3.7-Plus</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-gray-500">NO.</div>
                    <div className="font-mono text-sm text-steel-900">{current?.reportNo}</div>
                    <div className="mt-2 text-[10px] text-gray-500">页 1 / 1</div>
                  </div>
                </div>

                <table className="w-full text-[12px] mt-4">
                  <tbody>
                    <tr><td className="w-28 py-1.5 text-gray-500">项目名称</td><td className="font-semibold">{pr.name}</td><td className="w-28 text-gray-500">构件部位</td><td className="font-semibold">{tk.name}</td></tr>
                    <tr><td className="py-1.5 text-gray-500">结构形式</td><td>{pr.structure}</td><td className="text-gray-500">材料等级</td><td>{pr.materialGrade}</td></tr>
                    <tr><td className="py-1.5 text-gray-500">检测设备</td><td>{DeviceLabel[pr.device]}</td><td className="text-gray-500">检测日期</td><td>{fmtDate(tk.testedAt)}</td></tr>
                    <tr><td className="py-1.5 text-gray-500">检测工程师</td><td>{pr.engineer}</td><td className="text-gray-500">报告日期</td><td>{fmtDate(r.createdAt)}</td></tr>
                  </tbody>
                </table>

                <div className="mt-5 text-[13px] font-semibold border-l-4 pl-2" style={{ borderColor: severityColor(r.defects[0]?.severity || 'medium') }}>
                  检测结论
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-gray-800">{r.summary}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-[12px]">
                  <div className="rounded-lg border border-gray-300 py-2"><div className="text-gray-500">SNR (dB)</div><div className="font-mono font-bold">{r.snr.toFixed(1)}</div></div>
                  <div className="rounded-lg border border-gray-300 py-2"><div className="text-gray-500">平均置信度</div><div className="font-mono font-bold">{r.confidenceAvg}</div></div>
                  <div className="rounded-lg border border-gray-300 py-2"><div className="text-gray-500">异常过滤</div><div className="font-mono font-bold">{r.filteredAnomalies}</div></div>
                </div>

                <div className="mt-5 text-[13px] font-semibold border-l-4 pl-2 border-amber">缺陷清单</div>
                {r.defects.length ? (
                  <table className="w-full text-[12px] mt-2 border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr className="text-left">
                        <th className="px-2 py-1">#</th>
                        <th className="px-2 py-1">类型</th>
                        <th className="px-2 py-1">级别</th>
                        <th className="px-2 py-1">位置 X/Y/深</th>
                        <th className="px-2 py-1">置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.defects.map((d: any, i: number) => (
                        <tr key={d.id} className="border-t border-gray-200">
                          <td className="px-2 py-1.5 font-mono">{i + 1}</td>
                          <td className="px-2 py-1.5">{DefectTypeLabel[d.type]}</td>
                          <td className="px-2 py-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: severityColor(d.severity) + '22', color: severityColor(d.severity), border: `1px solid ${severityColor(d.severity)}66` }}>
                              {SeverityLabel[d.severity]}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 font-mono">{d.x_m}m / {d.y_m}m / {d.depth_m}m</td>
                          <td className="px-2 py-1.5 font-mono">{(d.confidence * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-2 text-[12.5px] text-gray-700">本次检测未检出明显缺陷。</p>
                )}

                <div className="mt-5 text-[13px] font-semibold border-l-4 pl-2 border-tech">整改建议</div>
                <ol className="mt-2 text-[12.5px] text-gray-800 list-decimal pl-6">
                  {r.recommendations.map((rec: string, i: number) => <li key={i} className="mb-1">{rec}</li>)}
                </ol>

                <div className="mt-8 text-[10px] font-mono text-gray-500 border-t border-gray-300 pt-2 flex items-center justify-between">
                  <span>水印 · {pr.engineer} · {fmtDate(r.createdAt)} · 报告 {current?.reportNo}</span>
                  <span>凝智 NDI · Qwen3.7-Plus · {r.engineVersion}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 p-3">
                  <div className="section-title mb-2">PDF 预览</div>
                  <div className="h-[520px] rounded-lg border border-white/10 bg-black/40 overflow-auto text-[11px] font-mono text-white/70 p-3 whitespace-pre-wrap">{buildReportText(current)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadPdf} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-tech hover:bg-tech-dark text-sm font-medium">
                    <FileDown size={14} /> 导出
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm">
                    <Eye size={14} /> 预览
                  </button>
                </div>
                <div className="text-[11px] text-white/40 font-mono leading-relaxed">
                  <div>注意: 演示环境以 TXT/打印视图替代 PDF</div>
                  <div>生产环境通过 Express + pdfkit 生成标准 PDF</div>
                  <div>签名校验 · SHA-256 流水号</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[560px] grid place-items-center text-white/40 text-sm">暂无报告，请先完成"数据采集 → AI 智能分析"</div>
          )}
        </div>
      </div>
    </div>
  )
}
