import { spokenNumber, type Question } from './game'

export function getIndonesianVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return []
  const voices = window.speechSynthesis.getVoices()
  const indonesian = voices.filter((voice) => voice.lang.toLowerCase().startsWith('id'))
  const available = indonesian.length ? indonesian : voices
  return [...available].sort((left, right) => voicePriority(left) - voicePriority(right))
}

function voicePriority(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase()
  const language = voice.lang.toLowerCase()
  if (name.includes('google') && (name.includes('bahasa indonesia') || language.startsWith('id'))) return 0
  if (language === 'id-id') return 1
  if (language.startsWith('id')) return 2
  return voice.default ? 3 : 4
}

export function speak(text: string, voice: SpeechSynthesisVoice | undefined, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.voice = voice ?? null
    utterance.rate = rate
    let settled = false
    const finish = () => { if (!settled) { settled = true; clearTimeout(timeout); resolve() } }
    const timeout = window.setTimeout(finish, Math.max(3500, text.length * 220))
    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  })
}

export async function speakSequence(
  question: Question,
  options: { voice?: SpeechSynthesisVoice; rate: number; gapMs: number; enabled: boolean },
  onNumber: (value: number, index: number) => void,
  isCancelled: () => boolean,
) {
  for (let index = 0; index < question.length; index += 1) {
    if (isCancelled()) return
    onNumber(question[index], index)
    if (options.enabled) await speak(spokenNumber(question[index], index === 0), options.voice, options.rate)
    else await new Promise((resolve) => window.setTimeout(resolve, 850))
    await new Promise((resolve) => window.setTimeout(resolve, options.gapMs))
  }
}
