'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'

interface ProvisionalThemeInputProps {
  value: string
  onChange: (value: string) => void
}

export function ProvisionalThemeInput({ value, onChange }: ProvisionalThemeInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4 text-primary" />
        <Label htmlFor="provisional-theme" className="text-sm font-medium">
          研究タイトル（仮）
        </Label>
        <span className="text-[11px] text-muted-foreground">編集可能</span>
      </div>

      <Input
        id="provisional-theme"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="研究の構造を入力すると、ここに研究タイトル（仮）が1行で表示されます"
        className="h-9 text-sm"
      />
    </div>
  )
}
