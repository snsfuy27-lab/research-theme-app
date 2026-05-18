'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { RubricScore, MeasurementCriteria } from '@/lib/types'
import { CheckCircle2, AlertTriangle, Info, Bot, ChevronDown, ChevronUp } from 'lucide-react'

interface CompactRubricProps {
  scores: RubricScore[]
  numericScore?: number
  measurementCriteria?: MeasurementCriteria[]
  comments?: string[]
}

const scoreConfig = {
  valid: { label: '達成', point: 2, bar: 'bg-success', text: 'text-success' },
  weak: { label: '部分', point: 1, bar: 'bg-warning', text: 'text-warning' },
  invalid: { label: '未達', point: 0, bar: 'bg-error/45', text: 'text-error' },
}

export function rubricPoint(score?: RubricScore) {
  if (!score) return { label: '未判定', point: 0, text: 'text-muted-foreground' }
  return scoreConfig[score.score]
}

function getCommentType(comment: string): 'success' | 'warning' | 'info' {
  if (comment.includes('適切') || comment.includes('妥当') || comment.includes('明確')) return 'success'
  if (comment.includes('抽象') || comment.includes('不十分') || comment.includes('未定義') || comment.includes('できません')) return 'warning'
  return 'info'
}

function getIcon(type: 'success' | 'warning' | 'info') {
  if (type === 'success') return <CheckCircle2 className="h-3 w-3 text-success" />
  if (type === 'warning') return <AlertTriangle className="h-3 w-3 text-warning" />
  return <Info className="h-3 w-3 text-primary" />
}

export function CompactRubric({ scores, numericScore = 0, measurementCriteria = [], comments = [] }: CompactRubricProps) {
  const [showMeasurementDetail, setShowMeasurementDetail] = useState(false)
  const total = scores.length || 1
  const validCount = scores.filter(s => s.score === 'valid').length
  const weakCount = scores.filter(s => s.score === 'weak').length
  const invalidCount = scores.filter(s => s.score === 'invalid').length
  const passedMeasurementCount = measurementCriteria.filter(c => c.passed).length
  const displayedComments = comments.slice(0, 3)

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-muted/10 p-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-foreground">ルーブリック評価・フィードバック</div>
          <div className="text-[10px] text-muted-foreground">
            達成 {validCount} / 部分 {weakCount} / 未達 {invalidCount}
          </div>
        </div>
        <div className={cn('shrink-0 text-xs font-semibold', numericScore >= 80 ? 'text-success' : numericScore >= 50 ? 'text-warning' : 'text-error')}>
          {numericScore}点
        </div>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full border border-border bg-muted">
        {scores.map((score, index) => {
          const config = scoreConfig[score.score]
          return (
            <motion.div
              key={score.id}
              initial={{ width: 0 }}
              animate={{ width: `${100 / total}%` }}
              transition={{ delay: index * 0.03 }}
              className={cn('h-full border-r border-background last:border-r-0', config.bar)}
              title={`${score.id} ${score.name}: ${config.label} ${config.point}/2`}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap gap-1">
        {scores.map((score) => {
          const config = scoreConfig[score.score]
          return (
            <span key={score.id} className={cn('rounded bg-card px-1 py-[1px] text-[9px]', config.text)}>
              {score.id} {config.label} {config.point}/2
            </span>
          )
        })}
      </div>

      {measurementCriteria.length > 0 && (
        <div className="space-y-1 border-t border-border pt-1.5">
          <button
            type="button"
            onClick={() => setShowMeasurementDetail(prev => !prev)}
            className="flex w-full items-center justify-between rounded-md px-1 py-0.5 text-left text-[11px] text-muted-foreground hover:bg-muted"
          >
            <span>測定可能性（参考）成立 {passedMeasurementCount}/{measurementCriteria.length} 項目</span>
            {showMeasurementDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <div className="flex gap-px" aria-label="測定可能性の成立項目数">
            {measurementCriteria.map((c, index) => (
              <motion.div
                key={c.id}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.005 }}
                className={cn('h-2 flex-1 rounded-[1px]', c.passed ? 'bg-primary/70' : 'bg-muted')}
                title={`${c.id} ${c.passed ? '成立' : '未成立'}：${c.question}`}
              />
            ))}
          </div>
          <AnimatePresence initial={false}>
            {showMeasurementDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {measurementCriteria.map((c) => (
                    <div key={`${c.id}-detail`} className={cn('rounded border px-2 py-1 text-[10px]', c.passed ? 'border-primary/25 bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground')}>
                      <span className="font-mono">{c.id}</span> {c.passed ? '成立' : '未成立'}｜{c.question}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {displayedComments.length > 0 && (
        <div className="space-y-0.5 border-t border-border pt-1.5">
          <div className="flex items-center gap-1.5">
            <Bot className="h-3 w-3 text-primary" />
            <h2 className="text-xs font-medium text-muted-foreground">フィードバック</h2>
          </div>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {displayedComments.map((comment) => {
                const type = getCommentType(comment)
                return (
                  <motion.div
                    key={comment}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className={cn(
                      'flex items-start gap-1 rounded px-1.5 py-0.5 text-[11px]',
                      type === 'success' && 'bg-success/5',
                      type === 'warning' && 'bg-warning/5',
                      type === 'info' && 'bg-primary/5'
                    )}
                  >
                    <span className="mt-0.5 shrink-0">{getIcon(type)}</span>
                    <span className="text-foreground">{comment}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
