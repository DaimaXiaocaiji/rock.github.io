export type DefectType = 'honeycomb' | 'crack' | 'void' | 'delamination' | 'segregation'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type DeviceType = 'ultrasound' | 'gpr' | 'xray'
export type ProjectStatus = 'draft' | 'testing' | 'analyzed' | 'reported'

export const DefectTypeLabel: Record<DefectType, string> = {
  honeycomb: '蜂窝',
  crack: '裂缝',
  void: '空洞',
  delamination: '分层',
  segregation: '离析'
}

export const SeverityLabel: Record<Severity, string> = {
  low: '轻微',
  medium: '中等',
  high: '严重',
  critical: '极重'
}

export const SeverityColor: Record<Severity, string> = {
  low: '#16A085',
  medium: '#F39C12',
  high: '#C0392B',
  critical: '#6B0F1A'
}

export const DeviceLabel: Record<DeviceType, string> = {
  ultrasound: '超声波',
  gpr: '探地雷达',
  xray: 'X 射线'
}

export interface Project {
  id: string
  name: string
  structure: string
  materialGrade: string
  device: DeviceType
  engineer: string
  createdAt: string
  status: ProjectStatus
  site: string
  sampleCount: number
  analyzedCount: number
}

export interface Task {
  id: string
  projectId: string
  name: string
  testedAt: string
  position: string
  length_m: number
  width_m: number
  thickness_m: number
}

export interface WavePoint {
  t_ms: number
  amp: number
  v_ms?: number
  abnormal?: boolean
}

export interface Defect {
  id: string
  taskId: string
  type: DefectType
  severity: Severity
  depth_m: number
  x_m: number
  y_m: number
  confidence: number
  description: string
  suggestion: string
  annotatedAt: string
}

export interface AnalysisResult {
  taskId: string
  engineVersion: string
  createdAt: string
  snr: number
  filteredAnomalies: number
  defects: Defect[]
  summary: string
  recommendations: string[]
  rawWave: WavePoint[]
  filteredWave: WavePoint[]
  confidenceAvg: number
}

export interface Threshold {
  grade: string
  vLow: number
  vHigh: number
  ampLow: number
  ampHigh: number
  backTimeMax: number
}

export interface AuditEntry {
  id: string
  actor: string
  action: string
  target: string
  meta: string
  ts: string
}
