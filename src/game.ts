export type FeedbackMode = 'Langsung' | 'Di akhir'
export type GameMode = 'Murid' | 'Guru'
export type Question = number[]
export type Result = {
  question: number
  numbers: number[]
  answer: number
  expected: number
  correct: boolean
  seconds: number
}

export const sampleQuestions: Question[] = [
  [3, -7, 8, 10, 21], [5, 2, 9, -1, 4], [7, -3, 6, 2, -9],
  [9, 4, -8, 5, 3], [4, -5, 7, -3, 2], [6, 3, -4, 8, -6],
  [8, -2, 5, -7, 1], [2, 7, -3, 4, -5], [1, -6, 9, -1, 8],
  [10, 1, -2, 6, -4],
]

export const examplePacks = [
  { id: 'santai', label: 'Contoh Santai', description: '4 angka, nilai kecil', file: 'examples/santai.csv' },
  { id: 'fokus', label: 'Contoh Fokus', description: '5 angka, operasi campuran', file: 'examples/fokus.csv' },
  { id: 'juara', label: 'Contoh Juara', description: '7 angka, tantangan intensif', file: 'examples/juara.csv' },
] as const

export type ExamplePackId = typeof examplePacks[number]['id']

export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isInteger(value) ? value : null
  if (typeof value !== 'string' || !value.trim()) return null
  const normalized = value.trim().replaceAll(' ', '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isInteger(parsed) ? parsed : null
}

export function columnsToQuestions(rows: unknown[][]): Question[] {
  const width = Math.max(0, ...rows.map((row) => row.length))
  const questions = Array.from({ length: width }, (_, column) =>
    rows.map((row) => parseNumber(row[column])).filter((value): value is number => value !== null),
  ).filter((question) => question.length > 0)
  if (!questions.length) throw new Error('Tidak ada angka yang dapat dibaca di dalam file.')
  return questions
}

function parseCsv(text: string): unknown[][] {
  const separator = text.split(/\r?\n/, 1)[0]?.includes(';') ? ';' : ','
  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    const cells: string[] = []
    let current = ''
    let quoted = false
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index]
      if (character === '"' && line[index + 1] === '"') { current += '"'; index += 1 }
      else if (character === '"') quoted = !quoted
      else if (character === separator && !quoted) { cells.push(current); current = '' }
      else current += character
    }
    cells.push(current)
    return cells
  })
}

export async function readQuestionFile(file: File): Promise<Question[]> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'csv') return columnsToQuestions(parseCsv(await file.text()))
  if (extension === 'xlsx' || extension === 'xlsm') {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())
    const worksheet = workbook.worksheets[0]
    if (!worksheet) throw new Error('Workbook tidak memiliki lembar kerja.')
    const rows: unknown[][] = []
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values: unknown[] = Array.isArray(row.values) ? row.values.slice(1) : []
      rows.push(values.map((value) => {
        if (value && typeof value === 'object' && 'result' in value) return value.result
        return value
      }))
    })
    return columnsToQuestions(rows)
  }
  throw new Error('Gunakan file CSV atau Excel (.xlsx atau .xlsm).')
}

export async function loadExamplePack(file: string): Promise<Question[]> {
  const response = await fetch(new URL(file, document.baseURI))
  if (!response.ok) throw new Error('Contoh soal tidak dapat dimuat.')
  return columnsToQuestions(parseCsv(await response.text()))
}

export function spokenNumber(value: number, first = false): string {
  if (first) return value < 0 ? `negatif ${Math.abs(value)}` : String(value)
  if (value < 0) return `dikurangi ${Math.abs(value)}`
  return value > 0 ? `ditambah ${value}` : 'ditambah nol'
}

export function downloadResults(results: Result[], source: string) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const rows = [['Soal', 'Rangkaian', 'Jawaban', 'Kunci', 'Benar', 'Detik'], ...results.map((result) => [
    result.question, result.numbers.join(' '), result.answer, result.expected,
    result.correct ? 'Ya' : 'Tidak', result.seconds,
  ])]
  const blob = new Blob(['\ufeff', rows.map((row) => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${source.replace(/\.[^.]+$/, '') || 'latihan'}_hasil.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function downloadAnswerKey(questions: Question[], source: string) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const rows = [['Soal', 'Rangkaian', 'Kunci'], ...questions.map((question, index) => [
    index + 1, question.join(' '), question.reduce((total, value) => total + value, 0),
  ])]
  const blob = new Blob(['\ufeff', rows.map((row) => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${source.replace(/\.[^.]+$/, '') || 'latihan'}_kunci.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
