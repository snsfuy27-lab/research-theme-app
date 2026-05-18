
import suggestionBundle from './dictionaries/suggestion_dictionary_bundle.json'

type AnyRecord = Record<string, any>

export type SuggestionAction =
  | 'show_suggestion'
  | 'suppress_suggestion'
  | 'show_weak_suggestion_or_confirmation'

export type SuggestionFieldRole =
  | 'target'
  | 'measurement'
  | 'condition'
  | 'comparison'
  | 'title'
  | 'unknown'

export interface SuggestionDecision {
  input: string
  normalized: string
  action: SuggestionAction
  source: 'abstract' | 'sensory' | 'generic' | 'specific' | 'unknown'
  termType?: string
  priority: number
  suggestions: string[]
  reason: string
  matchMode: 'exact_normalized' | 'unknown'
}

const bundle = suggestionBundle as AnyRecord

export const suggestionDecisionRules = bundle.decision_rules
export const suggestionGroups: Record<string, string[]> =
  bundle.abstract_sensory_suggestion_dictionary?.suggestion_groups || {}

const specificRecords: AnyRecord[] =
  bundle.specific_suppression_dictionary?.records || []
const abstractRecords: AnyRecord[] =
  bundle.abstract_sensory_suggestion_dictionary?.records || []

export const SPECIFIC_SUPPRESSION_TERM_COUNT = specificRecords.length
export const ABSTRACT_SENSORY_TERM_COUNT = abstractRecords.length

export function normalizeDictionaryTerm(input: string): string {
  return String(input || '')
    .trim()
    .replace(/　/g, ' ')
    .replace(/\s+/g, '')
    .replace(/ＣＯ２/g, 'CO2')
    .replace(/ＣＯ₂/g, 'CO2')
    .replace(/CO₂/g, 'CO2')
    .replace(/ｐＨ/g, 'pH')
    .replace(/ＰＨ/g, 'pH')
}

const specificMap = new Map<string, AnyRecord>()
const abstractMap = new Map<string, AnyRecord>()
const genericMap = new Map<string, AnyRecord>()

for (const record of specificRecords) {
  const key = normalizeDictionaryTerm(record.normalized || record.term)
  if (key && !specificMap.has(key)) specificMap.set(key, record)
}

for (const record of abstractRecords) {
  const key = normalizeDictionaryTerm(record.normalized || record.source_term)
  if (!key) continue
  const type = String(record.source_type || record.term_type || '')
  if (type === 'generic') {
    if (!genericMap.has(key)) genericMap.set(key, record)
  } else {
    if (!abstractMap.has(key)) abstractMap.set(key, record)
  }
}


const curatedSuggestionGroups: Record<string, string[]> = {
  appearance_impression: [
    '印象評価得点', '好意度', '選択率', '投票数', '順位', 'SD法得点', 'リカート尺度評定',
    '視線滞留時間', 'クリック率', '再選択率', '購入意向度', '推薦意向度', '色相', '彩度', '明度',
    'コントラスト比', '図形面積比', '余白率', '文字サイズ', '色数', '回答理由の分類'
  ],
  psychology_learning: [
    '正答率', '回答時間', '反応時間', '得点', '記憶率', '再生率', '理解度', '読解速度',
    '学習時間', '作業時間', '誤答数', '選択率', '評価点', 'アンケート得点', '尺度得点',
    '作業量', '休憩回数', '視線移動回数', '集中時間', '課題達成率'
  ],
  biological_growth: [
    '草丈', '茎長', '根長', '葉面積', '葉数', '発芽率', '発芽日数', '乾燥重量', '湿重量',
    '個体数', '生存率', '死亡率', '被覆率', 'クロロフィル濃度', '光合成速度'
  ],
  physical_size: [
    '長さ', '幅', '高さ', '厚さ', '直径', '半径', '面積', '体積', '粒径', '周長', '角度', '質量', '密度'
  ],
  color_light: [
    '色相', '彩度', '明度', 'RGB値', '色差', '照度', '輝度', '光沢度', '反射率', '透過率',
    '吸光度', '透明度', '濁度', '白色度', 'コントラスト比'
  ],
  food_sense: [
    '糖度', '酸度', 'pH', '塩分濃度', '水分率', '水分活性', '硬度', '粘度', '官能評価得点',
    '香気成分濃度', 'グルタミン酸濃度', 'イノシン酸濃度', '糖酸比', '咀嚼回数', '色度'
  ],
  environment_comfort: [
    '気温', '湿度', '照度', '騒音レベル', 'CO2濃度', '風速', '気圧', '表面温度', '水温',
    '酸素濃度', '粉じん濃度', '体感温度', '心拍数', '皮膚温度', '発汗量'
  ],
  generic_measurement: [
    '長さ', '質量', '時間', '温度', '濃度', 'pH', '速度', '面積', '体積', '密度', '照度',
    '湿度', '風速', '騒音レベル', '導電率', '吸光度', '個体数', '発芽率', '生存率', '正答率'
  ]
}

const termSuggestionOverrides: Record<string, string[]> = {
  'かっこいい': curatedSuggestionGroups.appearance_impression,
  'カッコいい': curatedSuggestionGroups.appearance_impression,
  'カッコイイ': curatedSuggestionGroups.appearance_impression,
  'かわいい': curatedSuggestionGroups.appearance_impression,
  '可愛い': curatedSuggestionGroups.appearance_impression,
  'カワイイ': curatedSuggestionGroups.appearance_impression,
  'きれい': curatedSuggestionGroups.color_light,
  '綺麗': curatedSuggestionGroups.color_light,
  'キレイ': curatedSuggestionGroups.color_light,
  '美しい': curatedSuggestionGroups.appearance_impression,
  '集中': curatedSuggestionGroups.psychology_learning,
  '集中力': curatedSuggestionGroups.psychology_learning,
  '理解力': curatedSuggestionGroups.psychology_learning,
  '記憶力': curatedSuggestionGroups.psychology_learning,
  '成長': curatedSuggestionGroups.biological_growth,
  '大きさ': curatedSuggestionGroups.physical_size,
  '大きい': curatedSuggestionGroups.physical_size,
  '小さい': curatedSuggestionGroups.physical_size,
  '明るい': curatedSuggestionGroups.color_light,
  '暗い': curatedSuggestionGroups.color_light,
  '美味しい': curatedSuggestionGroups.food_sense,
  'おいしい': curatedSuggestionGroups.food_sense,
  '快適': curatedSuggestionGroups.environment_comfort,
  '不快': curatedSuggestionGroups.environment_comfort,
}

const targetFieldBlockedMeasurementSuggestions = new Set(['target', 'condition', 'comparison'])

function fieldAllowsMeasurementSuggestion(role: SuggestionFieldRole): boolean {
  return role === 'measurement' || role === 'title' || role === 'unknown'
}

function suggestionsFromRecord(record?: AnyRecord): string[] {
  if (!record) return []
  const sourceTerm = String(record.source_term || record.term || '')
  if (sourceTerm && termSuggestionOverrides[sourceTerm]) return termSuggestionOverrides[sourceTerm]
  if (Array.isArray(record.suggestions)) return record.suggestions.filter(Boolean)
  const group = record.suggestion_group
  if (group && Array.isArray(suggestionGroups[group])) return suggestionGroups[group]
  return []
}

export function isAbstractOrSensoryTerm(input: string): boolean {
  const key = normalizeDictionaryTerm(input)
  return abstractMap.has(key)
}

export function isGenericTerm(input: string): boolean {
  const key = normalizeDictionaryTerm(input)
  return genericMap.has(key)
}

export function isSpecificSuppressionTerm(input: string): boolean {
  const key = normalizeDictionaryTerm(input)
  if (abstractMap.has(key) || genericMap.has(key)) return false
  return specificMap.has(key)
}

export function getSuggestionDecision(input: string): SuggestionDecision {
  const normalized = normalizeDictionaryTerm(input)
  if (!normalized) {
    return {
      input,
      normalized,
      action: 'show_weak_suggestion_or_confirmation',
      source: 'unknown',
      priority: 99,
      suggestions: [],
      reason: '入力が空です。',
      matchMode: 'unknown',
    }
  }

  const abstractRecord = abstractMap.get(normalized)
  if (abstractRecord) {
    return {
      input,
      normalized,
      action: 'show_suggestion',
      source: String(abstractRecord.source_type || '').includes('sensory') ? 'sensory' : 'abstract',
      termType: abstractRecord.source_type,
      priority: Number(abstractRecord.priority ?? 10),
      suggestions: suggestionsFromRecord(abstractRecord),
      reason: abstractRecord.reason || '抽象語・感覚語のため、具体的な測定語への変換候補を提示します。',
      matchMode: 'exact_normalized',
    }
  }

  const genericRecord = genericMap.get(normalized)
  if (genericRecord) {
    return {
      input,
      normalized,
      action: 'show_suggestion',
      source: 'generic',
      termType: genericRecord.source_type,
      priority: Number(genericRecord.priority ?? 20),
      suggestions: suggestionsFromRecord(genericRecord),
      reason: genericRecord.reason || '総称語のため、対象を境界化する候補を提示します。',
      matchMode: 'exact_normalized',
    }
  }

  const specificRecord = specificMap.get(normalized)
  if (specificRecord) {
    return {
      input,
      normalized,
      action: 'suppress_suggestion',
      source: 'specific',
      termType: specificRecord.term_type,
      priority: Number(specificRecord.priority ?? 30),
      suggestions: [],
      reason: specificRecord.note || '具体語・測定語として登録済みのため、サジェストを抑制します。',
      matchMode: 'exact_normalized',
    }
  }

  return {
    input,
    normalized,
    action: 'show_weak_suggestion_or_confirmation',
    source: 'unknown',
    priority: 40,
    suggestions: [],
    reason: '未登録語のため、必要に応じて弱い確認表示を行います。',
    matchMode: 'unknown',
  }
}

const sortedSuggestTerms = abstractRecords
  .map((record) => String(record.source_term || record.term || ''))
  .filter(Boolean)
  .sort((a, b) => b.length - a.length)

const negativeContexts: Record<string, string[]> = {
  におい: ['において', 'における'],
}

function includesWithoutNegativeContext(text: string, word: string): boolean {
  const negatives = negativeContexts[word] || []
  if (negatives.some((ng) => text.includes(ng))) {
    const reduced = negatives.reduce((acc, ng) => acc.split(ng).join(''), text)
    return reduced.includes(word)
  }
  return text.includes(word)
}

export function detectSuggestionSourceTerms(text: string): string[] {
  if (!text || !text.trim()) return []
  const normalizedText = normalizeDictionaryTerm(text)
  const detected: string[] = []

  // 完全一致がspecificなら、それ自体からは抽象語を検出しない。
  // 例: 「力の大きさ」はspecificなので、「大きさ」の部分一致を拾わない。
  const exactDecision = getSuggestionDecision(normalizedText)
  if (exactDecision.action === 'suppress_suggestion') return []

  for (const term of sortedSuggestTerms) {
    const normalizedTerm = normalizeDictionaryTerm(term)
    if (!normalizedTerm) continue

    // 部分一致は「抽象語・感覚語の検出」にのみ使う。
    // specific抑制には絶対に使わない。
    if (includesWithoutNegativeContext(normalizedText, normalizedTerm)) {
      detected.push(term)
    }
  }

  return Array.from(new Set(detected))
}


export function getContextualSuggestionsForTerm(term: string, role: SuggestionFieldRole = 'unknown'): string[] {
  if (targetFieldBlockedMeasurementSuggestions.has(role)) return []
  if (!fieldAllowsMeasurementSuggestion(role)) return []
  const normalized = normalizeDictionaryTerm(term)
  if (termSuggestionOverrides[normalized]) return termSuggestionOverrides[normalized]
  if (termSuggestionOverrides[term]) return termSuggestionOverrides[term]
  const record = abstractMap.get(normalized) || genericMap.get(normalized)
  const fromRecord = suggestionsFromRecord(record)
  if (fromRecord.length > 0) return fromRecord
  return []
}

export function getSpecificSuggestionsForTerm(term: string): string[] {
  const normalized = normalizeDictionaryTerm(term)
  if (termSuggestionOverrides[normalized]) return termSuggestionOverrides[normalized]
  if (termSuggestionOverrides[term]) return termSuggestionOverrides[term]
  const record = abstractMap.get(normalized) || genericMap.get(normalized)
  return suggestionsFromRecord(record)
}
