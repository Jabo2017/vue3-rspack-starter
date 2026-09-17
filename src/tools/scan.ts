/**
 * 扫描内核的适配层：给 CLI 与网页提供同一份实现（scripts/scan-core.mjs），
 * 在这里补上显式类型，业务代码就不必关心内核是 JS 还是 TS。
 */
import {
  RULES as RAW_RULES,
  checkDeps as rawCheckDeps,
  scanText as rawScanText,
  summarize as rawSummarize,
} from '../../scripts/scan-core.mjs'

export type RuleLevel = 'high' | 'medium' | 'low'

export interface ScanRule {
  id: string
  title: string
  level: RuleLevel
  weight: number
  hint: string
  pattern: RegExp
}

export interface Finding {
  ruleId: string
  file: string
  line: number
  column: number
  snippet: string
}

export interface Summary {
  total: number
  byRule: Record<string, number>
  filesByRule: Record<string, string[]>
  mdi: number
  band: string
}

export interface DepRisk {
  name: string
  version: string
  tip: string
}

export const RULES = RAW_RULES as ScanRule[]

export const scanText = rawScanText as (code: string, file?: string) => Finding[]

export const summarize = rawSummarize as (findings: Finding[]) => Summary

export const checkDeps = rawCheckDeps as (pkg: {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}) => DepRisk[]
