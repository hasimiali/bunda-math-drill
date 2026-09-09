import { afterEach, describe, expect, it, vi } from 'vitest'
import { getIndonesianVoices } from './speech'

function voice(name: string, lang: string, isDefault = false): SpeechSynthesisVoice {
  return { name, lang, default: isDefault, localService: false, voiceURI: name }
}

afterEach(() => vi.restoreAllMocks())

describe('Indonesian voice selection', () => {
  it('puts Google Bahasa Indonesia first', () => {
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue([
      voice('Microsoft Gadis Online', 'id-ID', true),
      voice('Google Bahasa Indonesia', 'id-ID'),
      voice('Google US English', 'en-US'),
    ])
    expect(getIndonesianVoices().map((item) => item.name)).toEqual([
      'Google Bahasa Indonesia',
      'Microsoft Gadis Online',
    ])
  })

  it('falls back to another Indonesian voice when Google is unavailable', () => {
    vi.spyOn(window.speechSynthesis, 'getVoices').mockReturnValue([
      voice('English Voice', 'en-US', true),
      voice('Microsoft Andika', 'id-ID'),
    ])
    expect(getIndonesianVoices()[0].name).toBe('Microsoft Andika')
  })
})
