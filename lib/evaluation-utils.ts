import type { ResearchType, TitleFields, RubricScore, MeasurementCriteria } from './types'
import { abstractWords, measurementCriteria, rubricCriteria } from './research-data'
import { subjectBoundarySuggestions } from './subject-boundary-data'
import { detectSuggestionSourceTerms, getContextualSuggestionsForTerm, getSpecificSuggestionsForTerm, isSpecificSuppressionTerm, type SuggestionFieldRole } from './suggestion-dictionary'

const ignoredAbstractWords = new Set(['変化'])
const negativeAbstractContexts: Record<string, string[]> = {
  'におい': ['において', 'における'],
}

const abstractAliases: Record<string, string[]> = {
  '大きい': ['大きい', '大きく', '大きな', '大きめ', '大'],
  '小さい': ['小さい', '小さく', '小さな', '小さめ', '小'],
  '多い': ['多い', '多く', '多数'],
  '少ない': ['少ない', '少なく', '少数'],
  '速い': ['速い', '速く', '早い', '早く'],
  '遅い': ['遅い', '遅く'],
  '高い': ['高い', '高く'],
  '低い': ['低い', '低く'],
  '長い': ['長い', '長く'],
  '短い': ['短い', '短く'],
  '重い': ['重い', '重く'],
  '軽い': ['軽い', '軽く'],
  '明るい': ['明るい', '明るく'],
  '暗い': ['暗い', '暗く'],
}

function includesWithoutNegativeContext(text: string, word: string): boolean {
  const negatives = negativeAbstractContexts[word] || []
  if (negatives.some(ng => text.includes(ng))) {
    const reduced = negatives.reduce((acc, ng) => acc.split(ng).join(''), text)
    return reduced.includes(word)
  }
  return text.includes(word)
}

function matchesAbstractWord(text: string, word: string): boolean {
  if (ignoredAbstractWords.has(word)) return false
  const lowerText = text.toLowerCase()
  const lowerWord = word.toLowerCase()
  if (includesWithoutNegativeContext(lowerText, lowerWord)) return true
  const aliases = abstractAliases[word] || []
  return aliases.some(alias => includesWithoutNegativeContext(lowerText, alias.toLowerCase()))
}

export function detectAbstractWords(text: string): string[] {
  if (!text || !text.trim()) return []

  const dictionaryDetected = detectSuggestionSourceTerms(text)
  const detected = new Set<string>(dictionaryDetected)

  // 既存の手書き辞書も補助的に使う。ただし、入力全体がspecific語に完全一致する場合は、
  // 「力の大きさ」の中の「大きさ」のような部分一致を拾わない。
  if (isSpecificSuppressionTerm(text)) return []

  for (const item of abstractWords) {
    if (matchesAbstractWord(text, item.word)) {
      detected.add(item.word)
    }
  }

  const additionalPatterns = [
    '良い', '悪い', '多い', '少ない', '大きい', '小さい',
    '速い', '遅い', '高い', '低い', '長い', '短い',
    '重い', '軽い', '明るい', '暗い', '熱い', '冷たい',
    '新しい', '古い', '美しい', '醜い', '大きさ', '強さ', '速さ',
  ]

  for (const pattern of additionalPatterns) {
    if (matchesAbstractWord(text, pattern)) {
      detected.add(pattern)
    }
  }

  return Array.from(detected)
}

function normalizeSubjectText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s　]/g, '')
    .replace(/の(成長|高さ|長さ|重さ|質量|色|数|変化|違い|比較|影響)$/g, '')
}

export function detectSubjectBoundaryTerms(text: string): string[] {
  if (!text || !text.trim()) return []
  // 辞書登録語は、研究対象として十分な具体性をもつ例外語として扱う。
  // 例: 酸素、力の大きさ、ミドリゾウリムシ、線形回帰など。
  if (isSpecificSuppressionTerm(text)) return []
  const normalized = normalizeSubjectText(text)
  if (isSpecificSuppressionTerm(normalized)) return []
  const exactMatches = subjectBoundarySuggestions.filter(item => normalized === item.term.toLowerCase())
  if (exactMatches.length > 0) return exactMatches.map(item => item.term)

  return subjectBoundarySuggestions
    .filter(item => {
      const term = item.term.toLowerCase()
      // 総称語を含む短い入力だけを対象にし、具体語の内部一致による過剰サジェストを避ける。
      return normalized.includes(term) && normalized.length <= term.length + 2
    })
    .map(item => item.term)
}

export function getSubjectBoundarySuggestions(text: string) {
  if (!text || !text.trim()) return []
  const terms = detectSubjectBoundaryTerms(text)
  return terms
    .map(term => subjectBoundarySuggestions.find(item => item.term === term))
    .filter(Boolean)
}


export function getSuggestionsForWord(word: string, role: SuggestionFieldRole = 'unknown'): string[] {
  if (role === 'target' || role === 'condition' || role === 'comparison') return []
  const dictionarySuggestions = getContextualSuggestionsForTerm(word, role)
  if (dictionarySuggestions.length > 0) return dictionarySuggestions

  const item = abstractWords.find(a => a.word === word)
  if (item) return item.suggestions

  const defaultSuggestions: Record<string, string[]> = {
    'かっこいい': ['印象評価得点', '好意度', '選択率', '投票数', '順位', 'SD法得点', 'リカート尺度評定', '視線滞留時間', 'クリック率', '再選択率', '購入意向度', '推薦意向度', '色相', '彩度', '明度'],
    'カッコいい': ['印象評価得点', '好意度', '選択率', '投票数', '順位', 'SD法得点', 'リカート尺度評定', '視線滞留時間', 'クリック率', '再選択率', '購入意向度', '推薦意向度', '色相', '彩度', '明度'],
    'カッコイイ': ['印象評価得点', '好意度', '選択率', '投票数', '順位', 'SD法得点', 'リカート尺度評定', '視線滞留時間', 'クリック率', '再選択率', '購入意向度', '推薦意向度', '色相', '彩度', '明度'],
    '良い': ['正答率', '効率', '精度', '評価得点', '改善率'],
    '悪い': ['エラー率', '誤答数', '不良品率', '欠陥数', '故障頻度'],
    '多い': ['個数', '頻度', '出現回数', '密度', '濃度'],
    '少ない': ['個数', '減少率', '不足量', '出現頻度', '低濃度'],
    '大きい': ['長さ', '幅', '高さ', '厚さ', '直径', '半径', '面積', '体積', '粒径', '周長', '角度', '質量', '密度'],
    '小さい': ['長さ', '幅', '高さ', '厚さ', '直径', '半径', '面積', '体積', '粒径', '周長', '質量', '密度'],
    '速い': ['速度', '加速度', '反応時間', '処理速度', '到達時間'],
    '遅い': ['到達時間', '応答時間', '減速度', '半減期', '緩和時間'],
    '高い': ['高さ', '濃度', '割合', '得点', '指数'],
    '低い': ['高さ', '濃度', '割合', '得点', '指数'],
    '長い': ['長さ', '距離', '持続時間', '波長', '経過時間'],
    '短い': ['長さ', '距離', '持続時間', '波長', '経過時間'],
    '重い': ['質量', '重量', '密度', '比重', '必要荷重'],
    '軽い': ['質量', '重量', '密度', '比重', '必要荷重'],
    '明るい': ['照度', '輝度', '光束', '反射率', 'RGB値'],
    '暗い': ['照度', '輝度', '吸光度', '透過率', 'RGB値'],
    '熱い': ['温度', '熱量', '発熱量', '温度上昇率', '熱伝導率'],
    '冷たい': ['温度', '冷却速度', '氷点', '凝固点', '温度低下量'],
  }

  return defaultSuggestions[word] || ['測定値', '数値データ', '定量値', '指標', '変数値']
}

export function calculateRubricScore(scores: RubricScore[]): number {
  if (!scores.length) return 0
  const total = scores.reduce((sum, item) => {
    if (item.score === 'valid') return sum + 2
    if (item.score === 'weak') return sum + 1
    return sum
  }, 0)
  return Math.round((total / (scores.length * 2)) * 100)
}

export function rubricSummary(scores: RubricScore[]) {
  const valid = scores.filter(s => s.score === 'valid').length
  const weak = scores.filter(s => s.score === 'weak').length
  const invalid = scores.filter(s => s.score === 'invalid').length
  return `達成:${valid}, 部分:${weak}, 未達:${invalid}`
}

export function evaluateMeasurability(text: string): MeasurementCriteria[] {
  const normalized = text.trim()
  if (!normalized) {
    return measurementCriteria.map(criteria => ({ ...criteria, passed: false }))
  }

  const hasUnit = /[0-9]+\s*(mm|cm|m|g|kg|mg|mL|ml|L|秒|分|時間|℃|%|個|回|Hz|dB|lx|N|Pa|pH)/.test(normalized)
  const hasNumber = /[0-9０-９]/.test(normalized)
  const abstractCount = detectAbstractWords(normalized).length
  const hasAbstract = abstractCount > 0
  const measurableWords = abstractWords.flatMap(a => a.suggestions)
  const hasMeasurable = measurableWords.some(s => normalized.includes(s))
  const hasMethodWord = /(測定|記録|比較|回数|時間|距離|長さ|質量|温度|濃度|割合|速度|面積|体積|pH|照度|音圧|糖度|濁度|吸光度|電気伝導率|EC|個数|得点|率)/.test(normalized)
  const hasComparison = /(比較|違い|差|A|B|別|条件|ごと|によって|変える|変えた|対照)/.test(normalized)
  const hasTime = /(時間|秒|分|日|週|前後|経時|持続|速度|率)/.test(normalized)
  const hasStats = /(平均|標準偏差|分散|相関|回帰|割合|率|複数|反復|回)/.test(normalized)

  return measurementCriteria.map((criteria) => {
    let passed = false
    switch (criteria.id) {
      case 'M1': passed = hasMeasurable || hasMethodWord; break
      case 'M2': passed = hasNumber || hasMeasurable || hasMethodWord; break
      case 'M3': passed = hasUnit; break
      case 'M4': passed = hasMeasurable || hasMethodWord; break
      case 'M5': passed = /(回|複数|反復|平均|標準偏差)/.test(normalized); break
      case 'M6': passed = hasTime; break
      case 'M7': passed = hasStats; break
      case 'M8': passed = /(誤差|標準偏差|ばらつき|平均|反復)/.test(normalized); break
      case 'M9': passed = /(試料|サンプル|個体|班|本|枚|回|複数)/.test(normalized); break
      case 'M10': passed = hasMeasurable && !hasAbstract; break
      case 'M11': passed = hasMethodWord && !hasAbstract; break
      case 'M12': passed = /(条件|範囲|時間|温度|濃度|量|距離)/.test(normalized); break
      case 'M13': passed = /(率|割合|単位|標準化|平均|同じ|一定)/.test(normalized); break
      case 'M14': passed = !hasAbstract && hasMethodWord; break
      case 'M15': passed = hasMethodWord && /(回|複数|条件|一定)/.test(normalized); break
      case 'M16': passed = /(校正|基準|標準|同じ|一定|ゼロ点)/.test(normalized); break
      case 'M17': passed = /(対照|比較|A|B|なし|あり|条件)/.test(normalized); break
      case 'M18': passed = hasComparison && hasMethodWord; break
      case 'M19': passed = !hasAbstract && hasMethodWord; break
      case 'M20': passed = hasMeasurable || hasMethodWord || hasNumber; break
      case 'M21': passed = /(分類|段階|尺度|得点|割合|ラベル|カテゴリ)/.test(normalized); break
      case 'M22': passed = /(画像|写真|動画|面積|色|RGB|直径|個数|角度)/.test(normalized); break
      case 'M23': passed = /(音|音圧|周波数|dB|声|騒音)/.test(normalized); break
      case 'M24': passed = /(温度|湿度|照度|条件|一定|環境)/.test(normalized); break
      case 'M25': passed = /(試料|個体|サンプル|独立|別々|複数)/.test(normalized); break
      case 'M26': passed = /(外れ値|範囲|最大|最小|平均|標準偏差)/.test(normalized); break
      case 'M27': passed = /(閾値|基準|以上|以下|未満|超える)/.test(normalized); break
      case 'M28': passed = hasComparison; break
      case 'M29': passed = hasMethodWord && hasComparison && !hasAbstract; break
      case 'M30': passed = hasMethodWord && /(条件|一定|回|複数)/.test(normalized) && !hasAbstract; break
      default: passed = false
    }
    return { ...criteria, passed }
  })
}

function hasConcreteText(value: string): boolean {
  return isSpecificSuppressionTerm(value) || (value.trim().length >= 2 && detectAbstractWords(value).length === 0)
}

function hasBoundaryProblem(value: string): boolean {
  return detectSubjectBoundaryTerms(value).length > 0
}

export function evaluateRubric(type: ResearchType, fields: TitleFields): RubricScore[] {
  const criteria = rubricCriteria[type]

  return criteria.map((c) => {
    let score: 'valid' | 'weak' | 'invalid' = 'invalid'
    let feedback = ''

    switch (c.id) {
      case 'C1': {
        const target = type === 'development' ? fields.developmentTarget : fields.researchTarget
        if (!target.trim()) {
          feedback = '研究対象を入力してください。'
        } else if (hasBoundaryProblem(target)) {
          score = 'weak'
          feedback = '研究対象が総称です。種名、材料名、条件、範囲などで境界化してください。'
        } else if (hasConcreteText(target) && target.trim().length >= 3) {
          score = 'valid'
          feedback = '研究対象が具体的に定義されています。'
        } else {
          score = 'weak'
          feedback = '研究対象をより具体的に記述してください。'
        }
        break
      }

      case 'C2': {
        let c2Value = ''
        switch (type) {
          case 'causal': c2Value = fields.manipulatedVariable; break
          case 'comparative': c2Value = `${fields.comparisonA} ${fields.comparisonB}`; break
          case 'classification': c2Value = fields.classificationCriteria; break
          case 'development': c2Value = fields.developmentPurpose; break
        }
        if (!c2Value.trim()) {
          feedback = '操作変数・比較対象・分類基準・開発目的を入力してください。'
        } else if (detectAbstractWords(c2Value).length > 0) {
          score = 'weak'
          feedback = '抽象的な表現を避け、操作・比較・分類の軸を具体化してください。'
        } else if (c2Value.trim().length >= 2) {
          score = 'valid'
          feedback = '研究の軸が明確に定義されています。'
        }
        break
      }

      case 'C3': {
        const measurable = type === 'classification'
          ? fields.classificationCriteria
          : type === 'development'
          ? fields.evaluationContent
          : fields.measuredVariable
        const abstractInMeasurable = detectAbstractWords(measurable)
        const measurementWords = abstractWords.flatMap(a => a.suggestions)
        const hasKnownMeasurementWord = isSpecificSuppressionTerm(measurable) || measurementWords.some(s => measurable.includes(s)) || /(率|数|量|長さ|時間|距離|温度|濃度|pH|質量|面積|体積|速度|得点|割合|回数|直径|高さ|厚さ|強度)/.test(measurable)
        if (!measurable.trim()) {
          feedback = '測定変数または評価指標を入力してください。'
        } else if (abstractInMeasurable.length > 0) {
          score = 'weak'
          feedback = `「${abstractInMeasurable.join('」「')}」は抽象的です。測定指標に置き換えてください。`
        } else if (hasKnownMeasurementWord) {
          score = 'valid'
          feedback = '測定変数が数値化しやすい表現です。'
        } else {
          score = 'weak'
          feedback = '測定単位・測定方法・記録形式を補うと成立しやすくなります。'
        }
        break
      }

      case 'C4': {
        const hasAllFields = checkAllFieldsFilled(type, fields)
        const title = generateTitle(type, fields)
        if (!hasAllFields) {
          feedback = '研究対象、研究の軸、測定変数をすべて入力してください。'
        } else if (detectAbstractWords(title).length > 0) {
          score = 'weak'
          feedback = '研究構造はありますが、抽象語が残っています。'
        } else {
          score = 'valid'
          feedback = '研究構造が論理的に構成されています。'
        }
        break
      }

      case 'C5': {
        if (!fields.evaluationContent.trim() || !fields.usageScene.trim()) {
          feedback = '評価内容と使用場面を入力してください。'
        } else if (detectAbstractWords(`${fields.evaluationContent} ${fields.usageScene}`).length > 0) {
          score = 'weak'
          feedback = '評価内容または使用場面に抽象語が残っています。'
        } else {
          score = 'valid'
          feedback = '評価方法と使用場面が明確です。'
        }
        break
      }
    }

    return { id: c.id, name: c.name, description: c.description, score, feedback }
  })
}

function checkAllFieldsFilled(type: ResearchType, fields: TitleFields): boolean {
  switch (type) {
    case 'causal':
      return !!(fields.researchTarget.trim() && fields.manipulatedVariable.trim() && fields.measuredVariable.trim())
    case 'comparative':
      return !!(fields.researchTarget.trim() && fields.comparisonA.trim() && fields.comparisonB.trim() && fields.measuredVariable.trim())
    case 'classification':
      return !!(fields.researchTarget.trim() && fields.classificationCriteria.trim())
    case 'development':
      return !!(fields.developmentTarget.trim() && fields.developmentPurpose.trim() && fields.evaluationContent.trim())
  }
}

export function generateTitle(type: ResearchType, fields: TitleFields): string {
  switch (type) {
    case 'causal':
      if (!fields.researchTarget && !fields.condition && !fields.measuredVariable && !fields.manipulatedVariable) return ''
      return `${fields.researchTarget || '○○'}における${fields.condition || '□□'}について、${fields.measuredVariable || '測定するもの'}は、${fields.manipulatedVariable || '操作する条件'}によって、どのように変化するか。`
    case 'comparative':
      if (!fields.researchTarget && !fields.condition && !fields.measuredVariable && !fields.comparisonA && !fields.comparisonB) return ''
      return `${fields.researchTarget || '○○'}における${fields.condition || '□□'}の${fields.measuredVariable || '測定・観察するもの'}について、${fields.comparisonA || '比較対象A'}と${fields.comparisonB || '比較対象B'}の共通点・相違点`
    case 'classification':
      if (!fields.researchTarget && !fields.condition && !fields.classificationCriteria) return ''
      return `${fields.researchTarget || '○○'}における${fields.condition || '□□'}について、${fields.classificationCriteria || '分類基準'}の観点で分類すると、どのように分布するか。`
    case 'development':
      if (!fields.usageScene && !fields.developmentPurpose && !fields.developmentTarget && !fields.evaluationContent) return ''
      return `${fields.usageScene || '○○'}における${fields.developmentPurpose || '□□'}のための、${fields.developmentTarget || '開発対象'}の開発および${fields.evaluationContent || '評価対象'}による評価`
  }
}

export function generateAICommentary(
  type: ResearchType,
  fields: TitleFields,
  rubricScores: RubricScore[],
  measurementScores: MeasurementCriteria[]
): string[] {
  const comments: string[] = []
  const title = generateTitle(type, fields)
  const abstractInTitle = detectAbstractWords(title)
  const rubricScore = calculateRubricScore(rubricScores)
  const passedMeasurements = measurementScores.filter(m => m.passed).length
  const totalMeasurements = measurementScores.length || 1
  const measurementRate = passedMeasurements / totalMeasurements

  if (!title.trim()) return ['研究の構造に入力すると、ルーブリックに基づく評価が表示されます。']

  if (abstractInTitle.length > 0) {
    comments.push(`抽象的または総称的な表現「${abstractInTitle.join('」「')}」が含まれています。入力欄の役割に応じて、対象の具体化または測定語化を検討してください。`)
  }

  const invalidScores = rubricScores.filter(r => r.score === 'invalid')
  const weakScores = rubricScores.filter(r => r.score === 'weak')

  if (invalidScores.length > 0) {
    comments.push(`${invalidScores.map(r => `${r.id} ${r.name}`).join('、')}が未入力または不十分です。`)
  }

  if (weakScores.length > 0) {
    comments.push(`${weakScores.map(r => `${r.id} ${r.name}`).join('、')}の改善が推奨されます。`)
  }

  if (measurementRate < 0.4 && title.trim()) {
    comments.push('測定可能性は参考値です。研究評価はルーブリックスコアを優先してください。')
  }

  if (rubricScore >= 80) {
    comments.push('ルーブリックスコアが高く、研究テーマとして成立しやすい構造です。')
  }

  return comments.length > 0 ? comments : ['研究構造が概ね整理されています。']
}
