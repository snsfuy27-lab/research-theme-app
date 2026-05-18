'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { HistoryEntry } from '@/lib/types'
import { History, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface EvolutionTimelineProps {
  history: HistoryEntry[]
}

export function EvolutionTimeline({ history }: EvolutionTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (history.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">思考進化タイムライン</h2>
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            入力履歴がここに表示されます
          </p>
        </div>
      </div>
    )
  }
  
  // チャートデータの準備
  const chartData = history.map((entry, index) => ({
    index: index + 1,
    score: entry.measurementScore,
    rubric: entry.rubricScores.filter(r => r.score === 'valid').length,
    abstract: entry.abstractWords.length,
    time: new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
  }))
  
  const latestScore = history[history.length - 1]?.measurementScore || 0
  const previousScore = history[history.length - 2]?.measurementScore || 0
  const trend = latestScore > previousScore ? 'up' : latestScore < previousScore ? 'down' : 'stable'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">思考進化タイムライン</h2>
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                trend === 'up' && 'bg-success/10 text-success',
                trend === 'down' && 'bg-error/10 text-error',
                trend === 'stable' && 'bg-muted text-muted-foreground'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'stable' && <Minus className="h-3 w-3" />}
              {trend === 'up' ? '改善中' : trend === 'down' ? '注意' : '安定'}
            </motion.div>
          )}
          <span className="text-xs text-muted-foreground">{history.length}件の履歴</span>
        </div>
      </div>
      
      {/* ミニチャート */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    score: '測定スコア',
                    rubric: 'ルーブリック適合',
                    abstract: '抽象語数',
                  }
                  return [value, labels[name] || name]
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--success)"
                strokeWidth={2}
                dot={{ fill: 'var(--success)', strokeWidth: 0, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 w-full h-7 text-xs text-muted-foreground"
        >
          {isExpanded ? '履歴を閉じる' : '履歴を表示'}
          <ChevronDown className={cn(
            'ml-1 h-3 w-3 transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </Button>
      </div>
      
      {/* 詳細履歴 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {[...history].reverse().map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-lg border border-border bg-card/50 p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString('ja-JP')}
                    </span>
                    <span className={cn(
                      'text-xs font-medium',
                      entry.measurementScore >= 70 ? 'text-success' :
                      entry.measurementScore >= 40 ? 'text-warning' :
                      'text-error'
                    )}>
                      {entry.measurementScore}%
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{entry.title || '(未入力)'}</p>
                  {entry.abstractWords.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.abstractWords.slice(0, 3).map(word => (
                        <span key={word} className="text-xs text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                          {word}
                        </span>
                      ))}
                      {entry.abstractWords.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{entry.abstractWords.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
