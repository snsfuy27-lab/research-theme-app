'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ResearchType, TitleFields, RubricScore } from '@/lib/types'
import { researchTypes } from '@/lib/research-data'
import { detectAbstractWords, getSuggestionsForWord, getSubjectBoundarySuggestions } from '@/lib/evaluation-utils'
import { abstractWords } from '@/lib/research-data'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TitleBuilderProps {
  type: ResearchType
  fields: TitleFields
  rubricScores?: RubricScore[]
  onFieldChange: (field: keyof TitleFields, value: string) => void
}

function rubricCodeForField(type: ResearchType, fieldId: string): string {
  if (fieldId === 'researchTarget' || fieldId === 'developmentTarget') return 'C1'
  if (type === 'causal' && fieldId === 'manipulatedVariable') return 'C2'
  if (type === 'comparative' && (fieldId === 'comparisonA' || fieldId === 'comparisonB')) return 'C2'
  if (type === 'classification' && fieldId === 'classificationCriteria') return 'C2/C3'
  if (type === 'development' && fieldId === 'developmentPurpose') return 'C2'
  if (fieldId === 'measuredVariable' || fieldId === 'evaluationContent') return 'C3'
  if (fieldId === 'condition' || fieldId === 'usageScene') return 'C4'
  return 'C4'
}

function replaceAllOrSet(current: string, original: string, replacement: string): string {
  if (!current.trim()) return replacement
  if (!original || !current.includes(original)) return current
  return current.split(original).join(replacement)
}

function scoreText(score?: RubricScore) {
  if (!score) return '未判定 0/2'
  if (score.score === 'valid') return '達成 2/2'
  if (score.score === 'weak') return '部分 1/2'
  return '未達 0/2'
}

function scoreClass(score?: RubricScore) {
  if (!score) return 'text-muted-foreground'
  if (score.score === 'valid') return 'text-success'
  if (score.score === 'weak') return 'text-warning'
  return 'text-error'
}

export function TitleBuilder({ type, fields, rubricScores = [], onFieldChange }: TitleBuilderProps) {
  const typeInfo = researchTypes.find(t => t.id === type)!

  const getFieldValue = (fieldId: string): string => fields[fieldId as keyof TitleFields] || ''
  const hasAbstractWord = (value: string): boolean => detectAbstractWords(value).length > 0
  const isSubjectField = (fieldId: string): boolean => fieldId === 'researchTarget' || fieldId === 'developmentTarget'
  const isMeasurementField = (fieldId: string): boolean => fieldId === 'measuredVariable' || fieldId === 'evaluationContent' || fieldId === 'classificationCriteria'
  const suggestionRoleForField = (fieldId: string): 'target' | 'measurement' | 'condition' | 'comparison' => {
    if (isSubjectField(fieldId)) return 'target'
    if (isMeasurementField(fieldId)) return 'measurement'
    if (fieldId === 'comparisonA' || fieldId === 'comparisonB') return 'comparison'
    return 'condition'
  }

  const applyMeasurementSuggestion = (fieldId: string, originalWord: string, suggestion: string) => {
    const key = fieldId as keyof TitleFields
    const current = fields[key] || ''
    onFieldChange(key, replaceAllOrSet(current, originalWord, suggestion))
  }

  const applySubjectSuggestion = (fieldId: string, suggestion: string) => {
    const key = fieldId as keyof TitleFields
    // 研究対象の境界化では、部分置換ではなく入力欄全体を候補語で置換する。
    // これにより「植物」→「ミニトマト」→「ミニミニトマト」のような連結バグを防ぐ。
    onFieldChange(key, suggestion)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-medium text-muted-foreground">研究テーマを構造化</h2>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{typeInfo.name}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {typeInfo.fields.map((field, index) => {
            const value = getFieldValue(field.id)
            const isAbstract = hasAbstractWord(value)
            const canShowMeasurementSuggestions = isMeasurementField(field.id) && isAbstract
            const subjectMatches = isSubjectField(field.id) ? getSubjectBoundarySuggestions(value) : []
            const rubricCode = rubricCodeForField(type, field.id)
            const linkedRubricCodes = rubricCode.split('/')
            const linkedRubrics = linkedRubricCodes.map(code => rubricScores.find(score => score.id === code)).filter(Boolean) as RubricScore[]

            return (
              <motion.div key={field.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="space-y-1">
                <div className="space-y-0.5">
                  <Label htmlFor={field.id} className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{rubricCode}</span>
                    <span>{field.label}</span>
                  </Label>
                  <div className="flex gap-1.5 overflow-x-auto pl-0.5 text-[10px]">
                    {linkedRubrics.length > 0 ? linkedRubrics.map((score) => (
                      <span key={`${field.id}-${score.id}`} className={cn('shrink-0 whitespace-nowrap', scoreClass(score))}>
                        {score.id}: {score.name}｜{scoreText(score)}
                      </span>
                    )) : (
                      <span className="shrink-0 whitespace-nowrap text-muted-foreground">{rubricCode}: 未判定 0/2</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id={field.id}
                    value={value}
                    onChange={(e) => onFieldChange(field.id as keyof TitleFields, e.target.value)}
                    placeholder={field.placeholder}
                    className={cn('h-9 text-sm transition-all', canShowMeasurementSuggestions ? 'border-warning bg-warning/5 focus-visible:ring-warning' : 'border-input')}
                  />
                  {canShowMeasurementSuggestions && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <span className="text-xs text-warning">抽象語</span>
                    </motion.div>
                  )}
                </div>

                {canShowMeasurementSuggestions && (
                  <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lightbulb className="h-3 w-3 text-warning" />
                      <span>{rubricCode} 測定・分類に使える語へ置換</span>
                    </div>
                    {detectAbstractWords(value).map((word) => {
                      const suggestions = getSuggestionsForWord(word, suggestionRoleForField(field.id))
                      const wordData = abstractWords.find(a => a.word === word)
                      return (
                        <div key={word} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-medium text-warning">
                              {word}<ArrowRight className="h-3 w-3" />
                            </span>
                            {wordData && <span className="text-[10px] text-muted-foreground">{wordData.category}</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.slice(0, 10).map((suggestion) => (
                              <button
                                key={`${field.id}-${word}-${suggestion}`}
                                type="button"
                                onClick={() => applyMeasurementSuggestion(field.id, word, suggestion)}
                                className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px]', 'border border-border bg-card text-foreground', 'transition-all hover:border-success/30 hover:bg-success/10 hover:text-success active:scale-95')}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {subjectMatches.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lightbulb className="h-3 w-3 text-primary" />
                      <span>{rubricCode} 研究対象が総称の可能性があります。対象を境界化してください。</span>
                    </div>
                    {subjectMatches.slice(0, 2).map((match) => (
                      <div key={match.term} className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{match.term}</span>
                          <span className="text-[10px] text-muted-foreground">{match.category}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">{match.question}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.candidates.slice(0, 10).map((candidate) => (
                            <button
                              key={`${match.term}-${candidate}`}
                              type="button"
                              onClick={() => applySubjectSuggestion(field.id, candidate)}
                              className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px]', 'border border-border bg-card text-foreground', 'transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary active:scale-95')}
                            >
                              {candidate}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
