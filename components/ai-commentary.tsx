'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Bot, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

interface AICommentaryProps {
  comments: string[]
}

export function AICommentary({ comments }: AICommentaryProps) {
  const getCommentType = (comment: string): 'success' | 'warning' | 'info' => {
    if (comment.includes('適切') || comment.includes('妥当') || comment.includes('明確')) {
      return 'success'
    }
    if (comment.includes('抽象') || comment.includes('不十分') || comment.includes('未定義') || comment.includes('できません')) {
      return 'warning'
    }
    return 'info'
  }
  
  const getIcon = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-3 w-3 text-success" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-warning" />
      case 'info':
        return <Info className="h-3 w-3 text-primary" />
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Bot className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-medium text-muted-foreground">フィードバック</h2>
      </div>
      
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {comments.map((comment, index) => {
            const type = getCommentType(comment)
            
            return (
              <motion.div
                key={comment}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'flex items-start gap-1.5 rounded px-2 py-1.5 text-xs',
                  type === 'success' && 'bg-success/5',
                  type === 'warning' && 'bg-warning/5',
                  type === 'info' && 'bg-primary/5'
                )}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {getIcon(type)}
                </span>
                <span className="text-foreground">{comment}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
