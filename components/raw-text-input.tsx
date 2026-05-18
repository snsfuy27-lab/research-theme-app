'use client'

import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { detectAbstractWords } from '@/lib/evaluation-utils'

interface RawTextInputProps {
  value: string
  onChange: (value: string) => void
}

export function RawTextInput({ value, onChange }: RawTextInputProps) {
  const abstractWords = detectAbstractWords(value)
  
  // テキストをハイライト付きで表示するためのHTML生成
  const highlightText = (text: string): React.ReactNode => {
    if (!text || abstractWords.length === 0) return text
    
    let result = text
    const highlighted: string[] = []
    
    abstractWords.forEach(word => {
      if (result.includes(word) && !highlighted.includes(word)) {
        highlighted.push(word)
      }
    })
    
    return text
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="raw-text" className="text-sm font-medium text-muted-foreground">
          自由入力欄
        </Label>
        {abstractWords.length > 0 && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs text-warning"
          >
            {abstractWords.length}個の抽象語を検出
          </motion.span>
        )}
      </div>
      
      <div className="relative">
        <Textarea
          id="raw-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="研究アイデアを自由に入力してください（例：「植物の成長」「集中力」「泡立ち」「快適」「環境にやさしい」）"
          className="min-h-[100px] resize-none text-sm"
        />
      </div>
      
      {abstractWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-wrap gap-1.5"
        >
          {abstractWords.map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              {word}
            </motion.span>
          ))}
        </motion.div>
      )}
    </div>
  )
}
