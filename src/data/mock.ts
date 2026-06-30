import type { Project, Task, AnalysisResult, Threshold, AuditEntry, WavePoint, Defect } from '@/types'

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()

function seedWave(n: number, seed = 1): WavePoint[] {
  const pts: WavePoint[] = []
  for (let i = 0; i < n; i++) {
    const t = i * 0.02
    let amp = Math.sin((i * seed) / 7) * 0.6 + Math.sin((i * seed) / 3) * 0.25
    amp += (Math.random() - 0.5) * 0.18
    pts.push({ t_ms: t, amp })
  }
  return pts
}

function injectAnomalies(wave: WavePoint[]): WavePoint[] {
  const out = wave.slice()
  const anomalies = [120, 260, 410, 620]
  anomalies.forEach((idx, i) => {
    if (out[idx]) {
      out[idx].amp = i === 0 ? -0.9 : i === 1 ? 0.82 : -0.75
      out[idx].abnormal = true
    }
  })
  return out
}

const mkDefects = (taskId: string): Defect[] => [
  {
    id: `${taskId}-d1`,
    taskId, type: 'honeycomb', severity: 'medium',
    depth_m: 0.18, x_m: 1.2, y_m: 0.3, confidence: 0.91,
    description: '距表面 18cm 处存在蜂窝状孔洞密集区，回波幅值衰减 28%',
    suggestion: '建议剔除该区域混凝土并用 C35 细石砼补浇，加强养护 14 天。',
    annotatedAt: daysAgo(1)
  },
  {
    id: `${taskId}-d2`,
    taskId, type: 'crack', severity: 'high',
    depth_m: 0.36, x_m: 2.4, y_m: 0.9, confidence: 0.86,
    description: '斜向裂缝，水平投影长度约 42cm，最大张开度估计 0.28mm，超声回波多次反射。',
    suggestion: '建议采用环氧树脂压力灌浆封闭后粘贴碳纤维补强。',
    annotatedAt: daysAgo(1)
  },
  {
    id: `${taskId}-d3`,
    taskId, type: 'void', severity: 'critical',
    depth_m: 0.55, x_m: 3.1, y_m: 1.5, confidence: 0.94,
    description: '构件底部存在 8~12cm 直径连通空洞区，回波时间差 ≥2.4μs',
    suggestion: '必须紧急开仓探查，清除松散物后分层浇注并振捣密实。',
    annotatedAt: daysAgo(1)
  }
]

export const projects: Project[] = [
  {
    id: 'P001', name: '滨江大桥·墩柱#12', structure: '矩形墩柱 1800×1800',
    materialGrade: 'C40', device: 'ultrasound', engineer: '王工',
    createdAt: daysAgo(30), status: 'reported', site: '滨江大桥北岸',
    sampleCount: 24, analyzedCount: 24
  },
  {
    id: 'P002', name: '总部大厦·B2层楼板', structure: '梁板结合楼板 220厚',
    materialGrade: 'C30', device: 'ultrasound', engineer: '李工',
    createdAt: daysAgo(14), status: 'analyzed', site: '总部大厦 B2',
    sampleCount: 18, analyzedCount: 15
  },
  {
    id: 'P003', name: '地铁18号线·隧道管片', structure: '预制管片 Φ11500',
    materialGrade: 'C50', device: 'gpr', engineer: '陈工',
    createdAt: daysAgo(5), status: 'testing', site: '18号线盾构区间',
    sampleCount: 96, analyzedCount: 42
  },
  {
    id: 'P004', name: '光伏电厂·基础承台', structure: '独立承台 3200×3200×800',
    materialGrade: 'C35', device: 'xray', engineer: '张工',
    createdAt: daysAgo(2), status: 'draft', site: '西部光伏 3# 区块',
    sampleCount: 12, analyzedCount: 0
  },
  {
    id: 'P005', name: '大学城隧道·二次衬砌', structure: '弧形衬砌 45厚',
    materialGrade: 'C35', device: 'ultrasound', engineer: '王工',
    createdAt: daysAgo(20), status: 'reported', site: '大学城隧道南洞',
    sampleCount: 36, analyzedCount: 36
  }
]

export const tasks: Record<string, Task[]> = {
  P001: [
    { id: 'P001-T01', projectId: 'P001', name: '墩柱#12 检测面 A', testedAt: daysAgo(28), position: 'A 面 0~2m', length_m: 4, width_m: 1.8, thickness_m: 1.8 },
    { id: 'P001-T02', projectId: 'P001', name: '墩柱#12 检测面 B', testedAt: daysAgo(27), position: 'B 面 0~2m', length_m: 4, width_m: 1.8, thickness_m: 1.8 },
    { id: 'P001-T03', projectId: 'P001', name: '墩柱#12 检测面 C', testedAt: daysAgo(26), position: 'C 面 0~2m', length_m: 4, width_m: 1.8, thickness_m: 1.8 },
    { id: 'P001-T04', projectId: 'P001', name: '墩柱#12 检测面 D', testedAt: daysAgo(25), position: 'D 面 0~2m', length_m: 4, width_m: 1.8, thickness_m: 1.8 }
  ],
  P002: [
    { id: 'P002-T01', projectId: 'P002', name: 'B2-楼板 轴网 3~5 / A~C', testedAt: daysAgo(13), position: 'x:1~6m y:0~4m', length_m: 6, width_m: 4, thickness_m: 0.22 }
  ],
  P003: [
    { id: 'P003-T01', projectId: 'P003', name: '管片 第1环', testedAt: daysAgo(4), position: '环1 拱顶', length_m: 36, width_m: 1.5, thickness_m: 0.5 }
  ],
  P004: [],
  P005: [
    { id: 'P005-T01', projectId: 'P005', name: '衬砌 区段 0+020', testedAt: daysAgo(19), position: '拱顶', length_m: 12, width_m: 11.5, thickness_m: 0.45 },
    { id: 'P005-T02', projectId: 'P005', name: '衬砌 区段 0+040', testedAt: daysAgo(18), position: '拱腰左', length_m: 12, width_m: 11.5, thickness_m: 0.45 }
  ]
}

export const analysisResults: Record<string, AnalysisResult> = {
  'P001-T01': {
    taskId: 'P001-T01',
    engineVersion: 'qwen-plus + rule-engine v1.2',
    createdAt: daysAgo(26),
    snr: 22.4,
    filteredAnomalies: 7,
    defects: mkDefects('P001-T01'),
    summary: '整体检测面 24 个测点中有效测点 22 个，发现蜂窝 1 处、裂缝 1 处、空洞 1 处。严重级别分布：极重 1，严重 1，中等 1。结构综合评分 78/100。',
    recommendations: [
      '对极重缺陷（空洞）进行紧急开仓探查并分层 C35 细石砼补浇',
      '裂缝采用 E44 环氧树脂灌浆，压力 0.3MPa',
      '所有修复部位 7 天后进行超声复检并记录对比数据',
      '建议加强该墩柱后续 3 个月沉降观测频率'
    ],
    rawWave: seedWave(800, 1.7),
    filteredWave: injectAnomalies(seedWave(800, 1.7)),
    confidenceAvg: 0.9
  },
  'P001-T02': {
    taskId: 'P001-T02', engineVersion: 'qwen-plus + rule-engine v1.2',
    createdAt: daysAgo(25), snr: 24.1, filteredAnomalies: 4,
    defects: mkDefects('P001-T02').slice(0, 2),
    summary: '检测面 B 整体质量良好，仅发现一处浅表蜂窝（轻微）及一处斜向裂缝（中等）。',
    recommendations: ['蜂窝 10×10cm，人工剔凿后用环氧砂浆找平', '裂缝 0.12mm 建议封闭即可'],
    rawWave: seedWave(800, 2.1),
    filteredWave: injectAnomalies(seedWave(800, 2.1)),
    confidenceAvg: 0.86
  },
  'P002-T01': {
    taskId: 'P002-T01', engineVersion: 'qwen-plus + rule-engine v1.2',
    createdAt: daysAgo(12), snr: 19.8, filteredAnomalies: 11,
    defects: mkDefects('P002-T01'),
    summary: 'B2 楼板多处存在分层离析痕迹，结合探地雷达切片确认为浮浆层 2~5cm，建议后期粘贴楼板底面碳纤维网补强。',
    recommendations: ['浮浆层采用高压水冲洗 + 聚合物改性砂浆找平', '粘贴 200g/m2 单层碳纤维布', '增加该楼板区域挠度测点 3 个'],
    rawWave: seedWave(800, 0.9),
    filteredWave: injectAnomalies(seedWave(800, 0.9)),
    confidenceAvg: 0.88
  },
  'P005-T01': {
    taskId: 'P005-T01', engineVersion: 'qwen-plus + rule-engine v1.2',
    createdAt: daysAgo(18), snr: 27.3, filteredAnomalies: 3,
    defects: [],
    summary: '二次衬砌拱顶波速 4120m/s，接近设计值 4200m/s，未见明显缺陷。',
    recommendations: ['复检合格', '进入下一检测区段'],
    rawWave: seedWave(800, 3.1),
    filteredWave: seedWave(800, 3.1),
    confidenceAvg: 0.93
  }
}

export const thresholds: Threshold[] = [
  { grade: 'C25', vLow: 3600, vHigh: 4400, ampLow: 0.55, ampHigh: 0.95, backTimeMax: 2.2 },
  { grade: 'C30', vLow: 3700, vHigh: 4500, ampLow: 0.60, ampHigh: 0.95, backTimeMax: 2.2 },
  { grade: 'C35', vLow: 3800, vHigh: 4600, ampLow: 0.62, ampHigh: 0.96, backTimeMax: 2.1 },
  { grade: 'C40', vLow: 3900, vHigh: 4700, ampLow: 0.65, ampHigh: 0.97, backTimeMax: 2.0 },
  { grade: 'C50', vLow: 4000, vHigh: 4800, ampLow: 0.70, ampHigh: 0.98, backTimeMax: 1.8 }
]

export const audits: AuditEntry[] = [
  { id: 'A001', actor: '王工', action: 'analyze', target: 'P001-T01', meta: '{"engine":"qwen-plus"}', ts: daysAgo(26) },
  { id: 'A002', actor: '李工', action: 'analyze', target: 'P002-T01', meta: '{"engine":"qwen-plus"}', ts: daysAgo(12) },
  { id: 'A003', actor: '王工', action: 'report', target: 'P001-T01', meta: '{"pages":14}', ts: daysAgo(20) },
  { id: 'A004', actor: '系统', action: 'threshold_update', target: 'C40', meta: '{"field":"vLow","old":3850,"new":3900}', ts: daysAgo(1) }
]

export const kpi = {
  todayTests: 7,
  pendingSamples: 12,
  defectRate: 42.8,
  avgConfidence: 0.89,
  models: [
    { name: 'Qwen3.7-Plus', calls24h: 184, latencyMs: 486, uptime999: 99.95 },
    { name: '规则引擎 v1.2', calls24h: 184, latencyMs: 8, uptime999: 99.99 }
  ]
}

export const trend30d = (): Array<{ date: string; critical: number; high: number; medium: number; low: number }> => {
  const out = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    out.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      critical: Math.floor(Math.random() * 3),
      high: Math.floor(Math.random() * 6) + 1,
      medium: Math.floor(Math.random() * 8) + 2,
      low: Math.floor(Math.random() * 10) + 3
    })
  }
  return out
}

export const materialDist = [
  { name: 'C30', value: 38 },
  { name: 'C35', value: 27 },
  { name: 'C40', value: 18 },
  { name: 'C50', value: 17 }
]
