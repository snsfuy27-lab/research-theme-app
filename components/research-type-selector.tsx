'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ResearchType } from '@/lib/types'
import { researchTypes } from '@/lib/research-data'

interface ResearchTypeSelectorProps {
  selectedType: ResearchType
  onTypeChange: (type: ResearchType) => void
}

export function ResearchTypeSelector({ selectedType, onTypeChange }: ResearchTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-muted-foreground">研究タイプを選択</h2>
      <div className="grid grid-cols-2 gap-2">
        {researchTypes.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={cn(
              'relative flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all',
              'active:scale-[0.98]',
              selectedType === type.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-card'
            )}
          >
            {selectedType === type.id && (
              <motion.div
                layoutId="selected-indicator"
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="text-lg">{type.icon}</span>
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">{type.name}</h3>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{type.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
