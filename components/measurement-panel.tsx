'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { MeasurementCriteria } from '@/lib/types'
import { ChevronDown, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MeasurementPanelProps {
  criteria: MeasurementCriteria[]
}

export function MeasurementPanel({ criteria }: MeasurementPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const passedCount = criteria.filter(c => c.passed).length
  const totalCount = criteria.length
  const percentage = Math.round((passedCount / totalCount) * 100)
  
  // カテゴリ分け
  const categories = [
    { name: '基本測定', ids: ['M1', 'M2', 'M3', 'M4', 'M5'] },
    { name: '統計処理', ids: ['M6', 'M7', 'M8', 'M9', 'M10'] },
    { name: '定義・標準化', ids: ['M11', 'M12', 'M13', 'M14', 'M15'] },
    { name: '実験設計', ids: ['M16', 'M17', 'M18', 'M19', 'M20'] },
    { name: '高度分析', ids: ['M21', 'M22', 'M23', 'M24', 'M25'] },
    { name: '科学的妥当性', ids: ['M26', 'M27', 'M28', 'M29', 'M30'] },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">測定可能性分析 (M1-M30)</h2>
        <div className="flex items-center gap-2">
          <motion.div
            key={percentage}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              percentage >= 70 ? 'bg-success/10 text-success' :
              percentage >= 40 ? 'bg-warning/10 text-warning' :
              'bg-error/10 text-error'
            )}
          >
            {passedCount}/{totalCount} ({percentage}%)
          </motion.div>
        </div>
      </div>
      
      {/* サマリーバー */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-1">
          {criteria.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                'h-6 flex-1 rounded-sm transition-colors',
                c.passed ? 'bg-success' : 'bg-error/30'
              )}
              title={`${c.id}: ${c.question}`}
            />
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 w-full h-7 text-xs text-muted-foreground"
        >
          {isExpanded ? '詳細を閉じる' : '詳細を表示'}
          <ChevronDown className={cn(
            'ml-1 h-3 w-3 transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </Button>
      </div>
      
      {/* 詳細ビュー */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              {categories.map((category, catIndex) => {
                const categoryCriteria = criteria.filter(c => category.ids.includes(c.id))
                const catPassed = categoryCriteria.filter(c => c.passed).length
                
                return (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.05 }}
                    className="rounded-lg border border-border bg-card/50 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-foreground">{category.name}</h3>
                      <span className={cn(
                        'text-xs',
                        catPassed === categoryCriteria.length ? 'text-success' :
                        catPassed > 0 ? 'text-warning' : 'text-error'
                      )}>
                        {catPassed}/{categoryCriteria.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {categoryCriteria.map((c) => (
                        <div
                          key={c.id}
                          className={cn(
                            'flex items-center gap-2 rounded px-2 py-1 text-xs',
                            c.passed ? 'bg-success/5' : 'bg-error/5'
                          )}
                        >
                          {c.passed ? (
                            <Check className="h-3 w-3 text-success flex-shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-error flex-shrink-0" />
                          )}
                          <span className="font-mono text-muted-foreground w-6">{c.id}</span>
                          <span className={cn(
                            'flex-1',
                            c.passed ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {c.question}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
