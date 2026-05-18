'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { detectAbstractWords } from '@/lib/evaluation-utils'

interface TitlePreviewProps {
  title: string
}

export function TitlePreview({ title }: TitlePreviewProps) {
  const abstractWords = detectAbstractWords(title)
  
  // テキストを抽象語でハイライト
  const renderHighlightedTitle = () => {
    if (!title) {
      return (
        <span className="text-muted-foreground">
          フィールドに入力すると、研究タイトルがここに表示されます...
        </span>
      )
    }
    
    if (abstractWords.length === 0) {
      return <span>{title}</span>
    }
    
    let result: React.ReactNode[] = []
    let remainingText = title
    let keyIndex = 0
    
    while (remainingText.length > 0) {
      let foundWord = ''
      let foundIndex = -1
      
      for (const word of abstractWords) {
        const index = remainingText.indexOf(word)
        if (index !== -1 && (foundIndex === -1 || index < foundIndex)) {
          foundWord = word
          foundIndex = index
        }
      }
      
      if (foundIndex === -1) {
        result.push(<span key={keyIndex++}>{remainingText}</span>)
        break
      }
      
      if (foundIndex > 0) {
        result.push(<span key={keyIndex++}>{remainingText.substring(0, foundIndex)}</span>)
      }
      
      result.push(
        <span
          key={keyIndex++}
          className="rounded px-0.5 bg-error/20 text-error underline decoration-error decoration-wavy"
        >
          {foundWord}
        </span>
      )
      
      remainingText = remainingText.substring(foundIndex + foundWord.length)
    }
    
    return result
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">
          生成タイトル
        </h2>
        <AnimatePresence>
          {title && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                abstractWords.length > 0 
                  ? 'bg-warning/10 text-warning' 
                  : 'bg-success/10 text-success'
              }`}
            >
              {abstractWords.length > 0 
                ? `${abstractWords.length}個の抽象語` 
                : '測定可能'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.p
          key={title || 'empty'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm font-medium leading-relaxed text-foreground"
        >
          {renderHighlightedTitle()}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
