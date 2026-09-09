import { describe, expect, it } from 'vitest'
import { columnsToQuestions, examplePacks, parseNumber, spokenNumber } from './game'

describe('question parsing', () => {
  it('parses integer-like spreadsheet values', () => {
    expect(parseNumber(' -7 ')).toBe(-7)
    expect(parseNumber('4,0')).toBe(4)
    expect(parseNumber('heading')).toBeNull()
    expect(parseNumber(2.5)).toBeNull()
  })

  it('turns columns into questions and ignores labels', () => {
    expect(columnsToQuestions([
      ['A', 'B'],
      [3, 5],
      [-7, 2],
      [8, 9],
    ])).toEqual([[3, -7, 8], [5, 2, 9]])
  })

  it('rejects files without numbers', () => {
    expect(() => columnsToQuestions([['Soal'], ['Kosong']])).toThrow(/Tidak ada angka/)
  })
})

describe('question packs and speech', () => {
  it('provides three curated example levels', () => {
    expect(examplePacks.map((pack) => pack.id)).toEqual(['santai', 'fokus', 'juara'])
  })

  it('uses natural Indonesian operation language', () => {
    expect(spokenNumber(-7, true)).toBe('negatif 7')
    expect(spokenNumber(-7)).toBe('dikurangi 7')
    expect(spokenNumber(5)).toBe('ditambah 5')
  })

})
