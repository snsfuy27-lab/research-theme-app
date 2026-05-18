'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { ResearchTypeSelector } from '@/components/research-type-selector'
import { ProvisionalThemeInput } from '@/components/provisional-theme-input'
import { TitleBuilder } from '@/components/title-builder'
import { CompactRubric } from '@/components/compact-rubric'
import { AdminDatabasePanel } from '@/components/admin-database-panel'
import type { ResearchType, TitleFields, RubricScore, MeasurementCriteria, EvaluationHistoryEntry, DecisionRecord } from '@/lib/types'
import {
  generateTitle,
  evaluateRubric,
  evaluateMeasurability,
  generateAICommentary,
  detectAbstractWords,
  detectSubjectBoundaryTerms,
  calculateRubricScore,
  rubricSummary,
} from '@/lib/evaluation-utils'
import { FlaskConical, LockKeyhole, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

const initialFields: TitleFields = {
  researchTarget: '',
  condition: '',
  manipulatedVariable: '',
  measuredVariable: '',
  comparisonA: '',
  comparisonB: '',
  classificationCriteria: '',
  usageScene: '',
  developmentPurpose: '',
  developmentTarget: '',
  evaluationContent: '',
}

const DB_RECORDS_KEY = 'research-theme-decision-records-v1'
const DB_HISTORY_KEY = 'research-theme-input-history-v1'

function loadArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveArray<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxzUElaKbrWYSy06eR77uOWyPWHX2Z1YsMkv1QX7tcFiRL2nm4yQouw0tR66GlosYtKRQ/exec'

function isValidResearchTerm(value: string): boolean {
  const s = String(value || '').trim()
  if (s.length < 2) return false
  if (/^[0-9０-９]+$/.test(s)) return false
  if (/^[a-zA-Z]+$/.test(s)) return false
  return true
}

function requiredStructuredFields(type: ResearchType, fields: TitleFields): { label: string; value: string }[] {
  switch (type) {
    case 'causal':
      return [
        { label: 'C1 研究対象', value: fields.researchTarget },
        { label: 'C2 操作変数', value: fields.manipulatedVariable },
        { label: 'C3 測定変数', value: fields.measuredVariable },
      ]
    case 'comparative':
      return [
        { label: 'C1 研究対象', value: fields.researchTarget },
        { label: 'C2 比較対象A', value: fields.comparisonA },
        { label: 'C2 比較対象B', value: fields.comparisonB },
        { label: 'C3 測定・観察するもの', value: fields.measuredVariable },
      ]
    case 'classification':
      return [
        { label: 'C1 研究対象', value: fields.researchTarget },
        { label: 'C2 分類基準', value: fields.classificationCriteria },
      ]
    case 'development':
      return [
        { label: 'C1 開発対象', value: fields.developmentTarget },
        { label: 'C2 開発目的', value: fields.developmentPurpose },
        { label: 'C3 評価対象', value: fields.evaluationContent },
      ]
  }
}


function formatHistoryTime(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

function fieldSummaryByType(type: ResearchType, fields: TitleFields): string {
  if (type === 'causal') {
    return `対象=${fields.researchTarget || '未入力'}／条件=${fields.condition || '未入力'}／操作=${fields.manipulatedVariable || '未入力'}／測定=${fields.measuredVariable || '未入力'}`
  }
  if (type === 'comparative') {
    return `対象=${fields.researchTarget || '未入力'}／条件=${fields.condition || '未入力'}／比較=${fields.comparisonA || '未入力'} vs ${fields.comparisonB || '未入力'}／測定=${fields.measuredVariable || '未入力'}`
  }
  if (type === 'classification') {
    return `対象=${fields.researchTarget || '未入力'}／条件=${fields.condition || '未入力'}／分類観点=${fields.classificationCriteria || '未入力'}`
  }
  return `場面=${fields.usageScene || '未入力'}／目的=${fields.developmentPurpose || '未入力'}／開発対象=${fields.developmentTarget || '未入力'}／評価=${fields.evaluationContent || '未入力'}`
}

function compactChangeLabel(previous: EvaluationHistoryEntry | undefined, currentTitle: string, currentScore: number): string {
  if (!previous) {
    return `初回記録：タイトル「${currentTitle || '未入力'}」、ルーブリック${currentScore}点。`
  }

  const previousTitle = previous.provisionalTheme || previous.generatedTitle || ''
  const previousScore = previous.rubricScore ?? 0
  const titleChanged = previousTitle !== currentTitle
  const scoreDelta = currentScore - previousScore
  const scoreText = scoreDelta === 0 ? '変化なし' : scoreDelta > 0 ? `+${scoreDelta}` : `${scoreDelta}`

  return `前回からの変化：タイトル${titleChanged ? '変更あり' : '変更なし'}、ルーブリック${previousScore}点→${currentScore}点（${scoreText}）。`
}

function buildTransitionMemo(params: {
  history: EvaluationHistoryEntry[]
  records: DecisionRecord[]
  researchType: ResearchType
  fields: TitleFields
  displayedTitle: string
  generatedTitle: string
  rubricScore: number
  measurementScore: number
  rubricScores: RubricScore[]
  measurementCriteria: MeasurementCriteria[]
  abstractWords: string[]
  subjectTerms: string[]
}): string {
  const recentHistory = params.history.slice(-5)
  const previous = recentHistory.length ? recentHistory[recentHistory.length - 1] : undefined
  const passedMeasurementCount = params.measurementCriteria.filter(item => item.passed).length
  const trialNumber = params.records.length + 1
  const currentInputNumber = (params.history.at(-1)?.inputCount || 0) + 1

  const historyLines = recentHistory.map(entry => {
    const title = entry.provisionalTheme || entry.generatedTitle || '未入力'
    return `${entry.inputCount}回目 ${formatHistoryTime(entry.timestamp)}：R${entry.rubricScore ?? 0}点／M${entry.measurementScore ?? 0}点／${title}`
  })

  return [
    `登録試行=${trialNumber}回目`,
    `入力履歴=${currentInputNumber}回目相当`,
    compactChangeLabel(previous, params.displayedTitle, params.rubricScore),
    `現在の構造：${fieldSummaryByType(params.researchType, params.fields)}`,
    `現在の生成タイトル：${params.generatedTitle || '未生成'}`,
    `現在の登録タイトル：${params.displayedTitle || '未入力'}`,
    `現在の評価：ルーブリック${params.rubricScore}点／測定可能性${passedMeasurementCount}/${params.measurementCriteria.length}（${params.measurementScore}点）／${rubricSummary(params.rubricScores)}`,
    `抽象語候補：${params.abstractWords.length ? params.abstractWords.join('、') : 'なし'}`,
    `対象語の境界化候補：${params.subjectTerms.length ? params.subjectTerms.join('、') : 'なし'}`,
    `直近履歴：${historyLines.length ? historyLines.join(' ｜ ') : 'なし'}`,
  ].join('\n')
}

function gasPayloadFromFields(type: ResearchType, fields: TitleFields, studentId: string, displayedTitle: string) {
  if (type === 'causal') {
    return {
      studentId,
      researchType: '因果型',
      title: displayedTitle,
      c1: fields.researchTarget,
      c2: fields.manipulatedVariable,
      c3: fields.measuredVariable,
      c4: fields.condition,
      hypothesis: '',
      memo: '',
    }
  }
  if (type === 'comparative') {
    return {
      studentId,
      researchType: '比較型',
      title: displayedTitle,
      c1: fields.researchTarget,
      c2: `${fields.comparisonA} / ${fields.comparisonB}`,
      c3: fields.measuredVariable,
      c4: fields.condition,
      hypothesis: '',
      memo: '',
    }
  }
  if (type === 'classification') {
    return {
      studentId,
      researchType: '分類型',
      title: displayedTitle,
      c1: fields.researchTarget,
      c2: fields.classificationCriteria,
      c3: fields.classificationCriteria,
      c4: fields.condition,
      hypothesis: '',
      memo: '',
    }
  }
  return {
    studentId,
    researchType: '開発型',
    title: displayedTitle,
    c1: fields.developmentTarget,
    c2: fields.developmentPurpose,
    c3: fields.evaluationContent,
    c4: fields.usageScene,
    hypothesis: '',
    memo: '',
  }
}

export default function ResearchEvaluationPage() {
  const [researchType, setResearchType] = useState<ResearchType>('causal')
  const [fields, setFields] = useState<TitleFields>(initialFields)
  const [provisionalTheme, setProvisionalTheme] = useState('')
  const [title, setTitle] = useState('')
  const [rubricScores, setRubricScores] = useState<RubricScore[]>([])
  const [measurementCriteria, setMeasurementCriteria] = useState<MeasurementCriteria[]>([])
  const [aiComments, setAiComments] = useState<string[]>(['フィールドを入力すると評価が表示されます。'])
  const [history, setHistory] = useState<EvaluationHistoryEntry[]>([])
  const [records, setRecords] = useState<DecisionRecord[]>([])
  const [showAdmin, setShowAdmin] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [studentId, setStudentId] = useState('')
  const [userEditedTitle, setUserEditedTitle] = useState(false)

  const historyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSnapshotRef = useRef('')
  const inputCountRef = useRef(0)

  useEffect(() => {
    const storedHistory = loadArray<EvaluationHistoryEntry>(DB_HISTORY_KEY)
    setHistory(storedHistory)
    setRecords(loadArray<DecisionRecord>(DB_RECORDS_KEY))
    inputCountRef.current = storedHistory.reduce((max, entry) => Math.max(max, entry.inputCount || 0), 0)
  }, [])

  const handleFieldChange = useCallback((field: keyof TitleFields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }))
    setUserEditedTitle(false)
  }, [])

  const handleProvisionalChange = useCallback((value: string) => {
    setUserEditedTitle(true)
    setProvisionalTheme(value)
  }, [])

  useEffect(() => {
    const newTitle = generateTitle(researchType, fields)
    setTitle(newTitle)

    if (!userEditedTitle) {
      setProvisionalTheme(newTitle)
    }

    const newRubricScores = evaluateRubric(researchType, fields)
    setRubricScores(newRubricScores)

    const textForEvaluation = `${newTitle} ${userEditedTitle ? provisionalTheme : ''}`
    const newMeasurementCriteria = evaluateMeasurability(textForEvaluation)
    setMeasurementCriteria(newMeasurementCriteria)
    setAiComments(generateAICommentary(researchType, fields, newRubricScores, newMeasurementCriteria))

    if (historyTimerRef.current) clearTimeout(historyTimerRef.current)

    const snapshotKey = JSON.stringify({ researchType, fields, provisionalTheme: userEditedTitle ? provisionalTheme : newTitle })
    const hasAnyInput = Object.values(fields).some(v => v.trim()) || newTitle.trim() || provisionalTheme.trim()

    if (hasAnyInput && snapshotKey !== lastSnapshotRef.current) {
      historyTimerRef.current = setTimeout(() => {
        const passedCount = newMeasurementCriteria.filter(m => m.passed).length
        const measurementScore = newMeasurementCriteria.length ? Math.round((passedCount / newMeasurementCriteria.length) * 100) : 0
        const rubricScore = calculateRubricScore(newRubricScores)
        inputCountRef.current += 1

        const entry: EvaluationHistoryEntry = {
          id: `${Date.now()}-${inputCountRef.current}`,
          timestamp: new Date().toISOString(),
          inputCount: inputCountRef.current,
          researchType,
          fields,
          provisionalTheme: userEditedTitle ? provisionalTheme : newTitle,
          generatedTitle: newTitle,
          measurementScore,
          rubricScore,
          rubricSummary: rubricSummary(newRubricScores),
          abstractWords: detectAbstractWords(textForEvaluation),
          subjectTerms: detectSubjectBoundaryTerms(fields.researchTarget || fields.developmentTarget),
        }

        setHistory(prev => {
          const next = [...prev, entry]
          saveArray(DB_HISTORY_KEY, next)
          return next
        })
        lastSnapshotRef.current = snapshotKey
      }, 800)
    }

    return () => {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current)
    }
  }, [researchType, fields, provisionalTheme, userEditedTitle])

  const handleSaveDecision = async () => {
    if (!/^\d{5}.+/.test(studentId.trim())) {
      window.alert('番号と氏名を入力してください。例：20140静北太郎')
      return
    }

    const invalidFields = requiredStructuredFields(researchType, fields).filter(item => !isValidResearchTerm(item.value))
    if (invalidFields.length > 0) {
      window.alert(`${invalidFields[0].label}を2文字以上の具体的な語で入力してください。英字のみ・数字のみは登録できません。`)
      return
    }

    const passedCount = measurementCriteria.filter(m => m.passed).length
    const measurementScore = measurementCriteria.length ? Math.round((passedCount / measurementCriteria.length) * 100) : 0
    const displayedTitle = provisionalTheme || title
    const combinedText = `${title} ${displayedTitle}`
    const rubricScore = calculateRubricScore(rubricScores)
    const record: DecisionRecord = {
      id: `${Date.now()}-decision`,
      timestamp: new Date().toISOString(),
      inputCount: history.length + 1,
      trialNumber: records.length + 1,
      decisionLabel: '決定',
      researchType,
      fields,
      provisionalTheme: displayedTitle,
      generatedTitle: title,
      measurementScore,
      rubricScore,
      rubricSummary: rubricSummary(rubricScores),
      abstractWords: detectAbstractWords(combinedText),
      subjectTerms: detectSubjectBoundaryTerms(fields.researchTarget || fields.developmentTarget),
    }

    setRecords(prev => {
      const next = [...prev, record]
      saveArray(DB_RECORDS_KEY, next)
      return next
    })

    try {
      const abstractWords = detectAbstractWords(combinedText)
      const subjectTerms = detectSubjectBoundaryTerms(fields.researchTarget || fields.developmentTarget)
      const transitionMemo = buildTransitionMemo({
        history,
        records,
        researchType,
        fields,
        displayedTitle,
        generatedTitle: title,
        rubricScore,
        measurementScore,
        rubricScores,
        measurementCriteria,
        abstractWords,
        subjectTerms,
      })
      const payload = {
        ...gasPayloadFromFields(researchType, fields, studentId.trim(), displayedTitle),
        hypothesis: '',
        memo: transitionMemo,
      }

      // GitHub Pages から Apps Script へ送る場合、通常の JSON POST は CORS で失敗しやすい。
      // text/plain の no-cors POST に統一し、GAS 側 doPost(e) で e.postData.contents を JSON.parse する。
      // no-cors ではレスポンス本文を読めないため、成否の最終確認は Spreadsheet 側で行う。
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-store',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          ...payload,
          clientTimestamp: new Date().toISOString(),
          trialNumber: records.length + 1,
          rubricScore,
          measurementScore,
        }),
      })

      setSaveMessage(`スプレッドシートへ送信しました。Spreadsheet側で行追加を確認してください（試行${records.length + 1}回目、ルーブリック${rubricScore}点）。`)
    } catch (error) {
      console.error(error)
      setSaveMessage('Google Spreadsheetへの送信を開始できませんでした。ネットワーク、GAS URL、デプロイ設定を確認してください。')
    }

    window.setTimeout(() => setSaveMessage(''), 2500)
  }

  const handleAdminClick = () => {
    const password = window.prompt('管理画面のパスワードを入力してください。')
    if (password === '表示') {
      setShowAdmin(true)
    } else if (password !== null) {
      window.alert('パスワードが違います。')
    }
  }

  const handleClearDatabase = () => {
    if (!window.confirm('ブラウザ内データベースを全削除しますか。')) return
    setRecords([])
    setHistory([])
    saveArray(DB_RECORDS_KEY, [])
    saveArray(DB_HISTORY_KEY, [])
    inputCountRef.current = 0
  }

  const currentRubricScore = calculateRubricScore(rubricScores)
  const passedMeasurementCount = measurementCriteria.filter(m => m.passed).length
  const maxHistoryScore = Math.max(100, ...history.map(entry => entry.rubricScore || 0))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative flex min-h-14 items-center justify-center px-4 py-2">
          <div className="flex flex-col items-center gap-0.5 text-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FlaskConical className="h-4 w-4" />
              </div>
              <h1 className="text-sm font-semibold text-foreground">課題研究テーマ 支援システム</h1>
            </div>
            <p className="text-[10px] text-muted-foreground">powered by 学校法人静岡理工科大学 静岡北中学校・高等学校</p>
          </div>
          <button type="button" onClick={handleAdminClick} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">
            <LockKeyhole className="mr-1 inline h-3 w-3" />管理
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <ResearchTypeSelector selectedType={researchType} onTypeChange={(type) => { setResearchType(type); setUserEditedTitle(false) }} />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="space-y-3">
            <TitleBuilder type={researchType} fields={fields} rubricScores={rubricScores} onFieldChange={handleFieldChange} />
            <div className="border-t border-border pt-2">
              <div className="mb-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] text-muted-foreground">
                研究タイトル（仮）は、ワークシートの研究型・研究構造と一致するように入力してください。
              </div>
              <ProvisionalThemeInput value={provisionalTheme} onChange={handleProvisionalChange} />
              <div className="mt-2">
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="番号と氏名を入力してください。例：20140静北太郎"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={handleSaveDecision} className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90">
                  <Save className="mr-1 inline h-3 w-3" />決定して登録
                </button>
                <span className="text-[11px] text-muted-foreground">ルーブリック {currentRubricScore}点</span>
                <span className="text-[10px] text-muted-foreground">測定可能性 {passedMeasurementCount}/{measurementCriteria.length}</span>
              </div>
              {saveMessage && <p className="mt-1 text-[11px] text-primary">{saveMessage}</p>}
            </div>
            <div className="border-t border-border pt-2">
              <CompactRubric scores={rubricScores} numericScore={currentRubricScore} measurementCriteria={measurementCriteria} comments={aiComments} />
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground">入力回数とルーブリックスコアの履歴</h2>
            <span className="text-[11px] text-muted-foreground">入力回数 {history.length}</span>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">入力すると履歴が記録されます。</p>
          ) : (
            <div className="rounded-lg border border-border p-2">
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>横軸：入力回数</span>
                <span>縦軸：ルーブリックスコア</span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex h-44 min-w-max items-end gap-2 border-l border-b border-border px-2 pt-3">
                  {history.slice(-24).map((entry) => {
                    const score = entry.rubricScore ?? 0
                    const filledSegments = Math.ceil(score / 20)
                    return (
                      <div key={`${entry.id}-bar`} className="flex w-8 shrink-0 flex-col items-center justify-end gap-1">
                        <div className="text-[9px] leading-none text-muted-foreground">{score}</div>
                        <div className="flex h-32 w-6 flex-col-reverse overflow-hidden rounded-t border border-border bg-muted" title={`${entry.inputCount}回目：${score}点`}>
                          {[1, 2, 3, 4, 5].map((segment) => (
                            <div
                              key={segment}
                              className={cn('flex-1 border-t border-background first:border-t-0', segment <= filledSegments ? 'bg-primary/70' : 'bg-transparent')}
                            />
                          ))}
                        </div>
                        <div className="text-[9px] leading-none text-muted-foreground">{entry.inputCount}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </main>

      {showAdmin && <AdminDatabasePanel records={records} history={history} onClose={() => setShowAdmin(false)} onClear={handleClearDatabase} />}
    </div>
  )
}
