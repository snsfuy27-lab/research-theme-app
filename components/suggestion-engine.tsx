'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getSuggestionsForWord, detectAbstractWords } from '@/lib/evaluation-utils'
import { abstractWords } from '@/lib/research-data'
import { Lightbulb, ArrowRight } from 'lucide-react'

interface SuggestionEngineProps {
  text: string
  onSuggestionClick: (suggestion: string, originalWord: string) => void
}

export function SuggestionEngine({ text, onSuggestionClick }: SuggestionEngineProps) {
  const detectedWords = detectAbstractWords(text)
  
  if (detectedWords.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">測定語サジェスト</h2>
        <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            抽象語が検出されると、測定可能な代替語を提案します
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">測定語サジェスト</h2>
        <Lightbulb className="h-4 w-4 text-warning" />
      </div>
      
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {detectedWords.map((word, wordIndex) => {
            const suggestions = getSuggestionsForWord(word)
            const wordData = abstractWords.find(a => a.word === word)
            
            return (
              <motion.div
                key={word}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: wordIndex * 0.1 }}
                className="rounded-lg border border-warning/30 bg-warning/5 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-2 py-0.5 text-sm font-medium text-warning">
                    {word}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  {wordData && (
                    <span className="text-xs text-muted-foreground">
                      カテゴリ: {wordData.category}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 15).map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: wordIndex * 0.1 + index * 0.02 }}
                      onClick={() => onSuggestionClick(suggestion, word)}
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                        'bg-card border border-border text-foreground',
                        'hover:bg-success/10 hover:border-success/30 hover:text-success',
                        'transition-all cursor-pointer'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
