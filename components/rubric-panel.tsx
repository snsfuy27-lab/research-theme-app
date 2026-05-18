'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { RubricScore } from '@/lib/types'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface RubricPanelProps {
  scores: RubricScore[]
}

const scoreConfig = {
  valid: {
    icon: CheckCircle,
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    textColor: 'text-success',
    label: '適切',
  },
  weak: {
    icon: AlertCircle,
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    textColor: 'text-warning',
    label: '要改善',
  },
  invalid: {
    icon: XCircle,
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
    textColor: 'text-error',
    label: '未達',
  },
}

export function RubricPanel({ scores }: RubricPanelProps) {
  const validCount = scores.filter(s => s.score === 'valid').length
  const totalCount = scores.length
  const percentage = Math.round((validCount / totalCount) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">ルーブリック評価</h2>
        <motion.div
          key={percentage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            percentage >= 75 ? 'bg-success/10 text-success' :
            percentage >= 50 ? 'bg-warning/10 text-warning' :
            'bg-error/10 text-error'
          )}
        >
          {validCount}/{totalCount} 適切
        </motion.div>
      </div>
      
      <div className="space-y-2">
        {scores.map((score, index) => {
          const config = scoreConfig[score.score]
          const Icon = config.icon
          
          return (
            <motion.div
              key={score.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'rounded-lg border p-3 transition-all',
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.1, type: 'spring' }}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5', config.textColor)} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{score.id}</span>
                    <h3 className="text-sm font-medium text-foreground">{score.name}</h3>
                    <span className={cn('ml-auto text-xs font-medium', config.textColor)}>
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{score.feedback}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
