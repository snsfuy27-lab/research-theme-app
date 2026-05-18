'use client'

import { useMemo, useState } from 'react'
import { X, Database, Trash2, Download } from 'lucide-react'

interface AdminDatabasePanelProps {
  records: any[]
  history: any[]
  onClose: () => void
  onClear: () => void
}

export function AdminDatabasePanel({ records, history, onClose, onClear }: AdminDatabasePanelProps) {
  const [tab, setTab] = useState<'records' | 'history' | 'json'>('records')

  const jsonText = useMemo(() => JSON.stringify({ records, history }, null, 2), [records, history])

  const downloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-theme-database-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 p-3">
      <div className="mx-auto flex h-full max-w-5xl flex-col rounded-xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">管理：ブラウザ内データベース</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">
            <X className="inline h-3.5 w-3.5" /> 閉じる
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2">
          <div className="flex gap-1">
            <button type="button" onClick={() => setTab('records')} className={`rounded-md px-2 py-1 text-xs ${tab === 'records' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>決定データ {records.length}</button>
            <button type="button" onClick={() => setTab('history')} className={`rounded-md px-2 py-1 text-xs ${tab === 'history' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>変遷履歴 {history.length}</button>
            <button type="button" onClick={() => setTab('json')} className={`rounded-md px-2 py-1 text-xs ${tab === 'json' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>JSON</button>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={downloadJson} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">
              <Download className="inline h-3.5 w-3.5" /> JSON保存
            </button>
            <button type="button" onClick={onClear} className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
              <Trash2 className="inline h-3.5 w-3.5" /> 全削除
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {tab === 'records' && (
            <div className="space-y-2">
              {records.length === 0 ? <p className="text-xs text-muted-foreground">決定データはまだ登録されていません。</p> : records.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-3 text-xs">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span>#{r.trialNumber}</span><span>{new Date(r.timestamp).toLocaleString('ja-JP')}</span><span>{r.researchType}</span><span>ルーブリック {r.rubricScore ?? 0}点</span><span>測定可能性 {r.measurementScore}%</span>
                  </div>
                  <p className="font-medium">{r.provisionalTheme || r.generatedTitle}</p>
                  <p className="mt-1 text-muted-foreground">{r.rubricSummary}</p>
                  <p className="mt-1 text-muted-foreground">抽象語: {(r.abstractWords || []).join('、') || 'なし'}</p>
                  <p className="mt-1 text-muted-foreground">研究対象候補: {(r.subjectTerms || []).join('、') || 'なし'}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 ? <p className="text-xs text-muted-foreground">変遷履歴はまだありません。</p> : history.slice().reverse().map((h) => (
                <div key={h.id} className="rounded-lg border border-border p-3 text-xs">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span>入力{h.inputCount}回目</span><span>{new Date(h.timestamp).toLocaleString('ja-JP')}</span><span>ルーブリック {h.rubricScore ?? 0}点</span><span>測定可能性 {h.measurementScore}%</span>
                  </div>
                  <p className="font-medium">{h.provisionalTheme || h.generatedTitle}</p>
                  <p className="mt-1 text-muted-foreground">{h.rubricSummary}</p>
                  <p className="mt-1 text-muted-foreground">単語: {(h.abstractWords || []).join('、') || 'なし'}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'json' && (
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-[11px] leading-relaxed">{jsonText}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
