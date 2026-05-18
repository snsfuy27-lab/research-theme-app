'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { MeasurementCriteria } from '@/lib/types'
import { ChevronDown, Check, X } from 'lucide-react'

interface CompactMeasurementProps {
  criteria: MeasurementCriteria[]
}

export function CompactMeasurement({ criteria }: CompactMeasurementProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const passedCount = criteria.filter(c => c.passed).length
  const totalCount = criteria.length

  return (
    <div className="space-y-2">
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex w-full items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">測定可能性（参考）</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">成立 {passedCount}/{totalCount} 項目</span>
          <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
        </div>
      </button>

      <div className="flex gap-px">
        {criteria.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.01 }}
            className={cn('h-4 flex-1 rounded-[1px]', c.passed ? 'bg-success' : 'bg-error/30')}
            title={`${c.id} ${c.passed ? '成立' : '未成立'}`}
          />
        ))}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="max-h-48 space-y-1 overflow-y-auto pt-2">
              {criteria.map((c) => (
                <div key={c.id} className={cn('flex items-center gap-1.5 rounded px-2 py-1 text-xs', c.passed ? 'bg-success/5' : 'bg-error/5')}>
                  {c.passed ? <Check className="h-3 w-3 shrink-0 text-success" /> : <X className="h-3 w-3 shrink-0 text-error" />}
                  <span className="w-5 font-mono text-[10px] text-muted-foreground">{c.id}</span>
                  <span className={cn('flex-1 truncate', c.passed ? 'text-foreground' : 'text-muted-foreground')}>{c.question}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
