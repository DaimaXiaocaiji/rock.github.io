import { useState, useEffect } from 'react'
import { Lock, Unlock, Shield, RefreshCw, Save, History, Wifi, CheckCircle2, KeyRound, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import {
  DASHSCOPE_MODEL, DASHSCOPE_URL,
  getDashScopeKey, setDashScopeKey, clearDashScopeKey,
  maskKey, isKeyConfigured
} from '@/lib/llm'
import { fmtDateTime } from '@/lib/utils'

export default function Settings() {
  const { thresholds, audits, updateThreshold, resetAll } = useAppStore()
  const [edit, setEdit] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [masked, setMasked] = useState('—')
  const [newKey, setNewKey] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    setConfigured(isKeyConfigured())
    setMasked(maskKey(getDashScopeKey()))
  }, [])

  function handleSaveKey() {
    if (!newKey.trim()) {
      setSavedMsg('请粘贴有效的 DashScope API Key')
      return
    }
    setDashScopeKey(newKey)
    setConfigured(true)
    setMasked(maskKey(newKey))
    setNewKey('')
    setSavedMsg('Key 已保存到本地浏览器存储（localStorage）')
    setTimeout(() => setSavedMsg(''), 3500)
  }

  function handleClearKey() {
    clearDashScopeKey()
    setConfigured(false)
    setMasked('—')
    setNewKey('')
    setSavedMsg('已清空 Key，重新打开设置后生效')
    setTimeout(() => setSavedMsg(''), 3500)
  }

  return (
    <div className="p-6 max-w-[1520px] mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-title">CONFIG · SECURITY</div>
          <h1 className="text-2xl font-semibold mt-1">系统设置</h1>
          <p className="text-sm text-white/50 mt-1">阈值库管理 · 模型参数 · 审计日志 · 安全与合规</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAll} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm">
            <RefreshCw size={14} /> 重置演示数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="section-title mb-2">模型参数</div>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-steel-700/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono">主模型</span>
                <span className={`badge ${configured ? 'bg-tech/10 border-tech/30 text-tech-light' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                  {configured ? <CheckCircle2 size={12} className="inline -mt-0.5" /> : <Wifi size={12} className="inline -mt-0.5" />} {DASHSCOPE_MODEL}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-white/50">阿里云百炼 DashScope · OpenAI 兼容网关</div>
              <div className="mt-1 text-[10px] font-mono text-white/30 break-all">POST {DASHSCOPE_URL}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-steel-700/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono">兜底引擎</span>
                <span className="badge">规则引擎 v1.2</span>
              </div>
              <div className="mt-1 text-[11px] text-white/50">基于阈值库的确定性二次校验</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-steel-700/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono">默认温度</span>
                <span className="font-mono text-tech-light">0.2</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" defaultValue={0.2} className="w-full mt-1 accent-tech" />
            </div>
            <div className="rounded-xl border border-white/10 bg-steel-700/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono">最大输出 token</span>
                <span className="font-mono text-amber">1024</span>
              </div>
              <input type="range" min="128" max="2048" step="16" defaultValue={1024} className="w-full mt-1 accent-tech" />
            </div>

            <div className="rounded-xl border border-white/10 bg-steel-700/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono flex items-center gap-1.5"><KeyRound size={13} /> API Key</span>
                <span className={`badge ${configured ? 'bg-tech/10 border-tech/30 text-tech-light' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                  {configured ? '已配置' : '未配置'}
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[12px] text-white/60 tracking-widest">
                {masked}
              </div>
              <div className="text-[10px] text-white/40">Key 来源优先级：VITE_DASHSCOPE_KEY 环境变量 &gt; 浏览器 localStorage &gt; 内置回退（开发用）</div>
              <input
                type="password"
                placeholder="粘贴新的 DashScope API Key，然后点保存..."
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-[12px] font-mono placeholder:text-white/30"
                autoComplete="off"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveKey}
                  disabled={!newKey.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-40 disabled:cursor-not-allowed bg-tech hover:bg-tech-dark"
                >
                  <Save size={13} /> 保存
                </button>
                <button
                  onClick={handleClearKey}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-medium border border-danger/40 text-danger hover:bg-danger/10"
                >
                  <XCircle size={13} /> 清空
                </button>
              </div>
              {savedMsg && (
                <div className="text-[11px] font-mono text-tech-light">{savedMsg}</div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">阈值库 · 按材料等级</div>
            <button onClick={() => setEdit(!edit)} className="text-xs font-mono text-tech-light hover:underline">
              {edit ? '完成' : '编辑阈值'}
            </button>
          </div>
          <table className="w-full text-[12px] font-mono">
            <thead className="text-[10px] uppercase text-white/40">
              <tr>
                <th className="text-left py-2">等级</th>
                <th className="text-right">波速 V<sub>L</sub></th>
                <th className="text-right">振幅比</th>
                <th className="text-right">回波差</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map(t => (
                <tr key={t.grade} className="border-t border-white/5">
                  <td className="py-2">{t.grade}</td>
                  <td className="text-right">
                    {edit ? (
                      <input
                        type="number" defaultValue={t.vLow}
                        onChange={e => updateThreshold(t.grade, { vLow: Number(e.target.value) })}
                        className="w-16 bg-steel-700/40 border border-white/10 rounded px-1 py-0.5 text-right"
                      />
                    ) : `${t.vLow}-${t.vHigh} m/s`}
                  </td>
                  <td className="text-right">
                    {edit ? (
                      <input
                        type="number" step="0.01" defaultValue={t.ampLow}
                        onChange={e => updateThreshold(t.grade, { ampLow: Number(e.target.value) })}
                        className="w-16 bg-steel-700/40 border border-white/10 rounded px-1 py-0.5 text-right"
                      />
                    ) : `${(t.ampLow * 100).toFixed(0)}-${(t.ampHigh * 100).toFixed(0)}%`}
                  </td>
                  <td className="text-right">{edit ? (
                    <input
                      type="number" step="0.1" defaultValue={t.backTimeMax}
                      onChange={e => updateThreshold(t.grade, { backTimeMax: Number(e.target.value) })}
                      className="w-14 bg-steel-700/40 border border-white/10 rounded px-1 py-0.5 text-right"
                    />
                  ) : `< ${t.backTimeMax} μs`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-[11px] text-white/40">
            阈值来源于 GB/T 50009-2012 + 《超声法检测混凝土缺陷技术规程》CECS 21-2000。
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">SECURITY · 安全</div>
            <Shield size={14} className="text-tech-light" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-xl border border-tech/30 bg-tech/10 p-3 flex items-center gap-3">
              <Lock size={16} className="text-tech-light" />
              <div>
                <div className="font-mono">零数据出域</div>
                <div className="text-[11px] text-white/50">大模型仅接收摘要信号特征，不出原始波形</div>
              </div>
            </div>
            <div className="rounded-xl border border-tech/30 bg-tech/10 p-3 flex items-center gap-3">
              <Lock size={16} className="text-tech-light" />
              <div>
                <div className="font-mono">Key 遮蔽显示</div>
                <div className="text-[11px] text-white/50">页面只展示 sk-***XXXX，禁止明文</div>
              </div>
            </div>
            <div className="rounded-xl border border-amber/30 bg-amber/10 p-3 flex items-center gap-3">
              <Unlock size={16} className="text-amber" />
              <div>
                <div className="font-mono">前端直连模式</div>
                <div className="text-[11px] text-white/50">建议生产走后端代理；本 demo 浏览器直连 DashScope</div>
              </div>
            </div>
            <div className="rounded-xl border border-tech/30 bg-tech/10 p-3 flex items-center gap-3">
              <Shield size={16} className="text-tech-light" />
              <div>
                <div className="font-mono">审计日志不可变</div>
                <div className="text-[11px] text-white/50">追加写 + SHA-256 前置校验</div>
              </div>
            </div>
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 flex items-center gap-3">
              <Lock size={16} className="text-danger" />
              <div>
                <div className="font-mono">水印归档 PDF</div>
                <div className="text-[11px] text-white/50">项目编号 · 工程师 · 时间戳</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <History size={14} className="text-tech-light" />
            <div className="section-title">AUDIT · 审计日志（不可变）</div>
          </div>
          <span className="badge">SHA-256 前置校验</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 overflow-auto max-h-[420px]">
          <table className="w-full text-[12px] font-mono">
            <thead className="bg-steel-700/50 text-[10px] uppercase text-white/50">
              <tr>
                <th className="text-left py-2 pl-3">时间</th>
                <th className="text-left">执行人</th>
                <th className="text-left">操作</th>
                <th className="text-left">对象</th>
                <th className="text-left">附加元数据</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(a => (
                <tr key={a.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-2 pl-3 text-white/60">{fmtDateTime(a.ts)}</td>
                  <td className="text-amber">{a.actor}</td>
                  <td className="text-tech-light">{a.action}</td>
                  <td className="text-white/80">{a.target}</td>
                  <td className="text-white/50 truncate max-w-[260px]">{a.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
