export type ResearchType = 'causal' | 'comparative' | 'classification' | 'development'

export interface ResearchTypeInfo {
  id: ResearchType
  name: string
  icon: string
  structure: string
  description: string
  fields: FieldConfig[]
}

export interface FieldConfig {
  id: string
  label: string
  placeholder: string
}

export interface TitleFields {
  researchTarget: string
  condition: string
  manipulatedVariable: string
  measuredVariable: string
  comparisonA: string
  comparisonB: string
  classificationCriteria: string
  usageScene: string
  developmentPurpose: string
  developmentTarget: string
  evaluationContent: string
}

export interface RubricScore {
  id: string
  name: string
  description: string
  score: 'valid' | 'weak' | 'invalid'
  feedback: string
}

export interface MeasurementCriteria {
  id: string
  question: string
  passed: boolean
}

export interface HistoryEntry {
  id: string
  timestamp: Date
  title: string
  rubricScores: RubricScore[]
  measurementScore: number
  abstractWords: string[]
}

export interface AbstractWordSuggestion {
  word: string
  suggestions: string[]
  category: string
}

export interface EvaluationHistoryEntry {
  id: string
  timestamp: string
  inputCount: number
  researchType: ResearchType
  fields: TitleFields
  provisionalTheme: string
  generatedTitle: string
  measurementScore: number
  rubricScore: number
  rubricSummary: string
  abstractWords: string[]
  subjectTerms: string[]
}

export interface DecisionRecord extends EvaluationHistoryEntry {
  trialNumber: number
  decisionLabel: string
}
