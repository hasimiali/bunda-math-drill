import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverMock })
Object.defineProperty(globalThis, 'ResizeObserver', { writable: true, value: ResizeObserverMock })

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    cancel: () => undefined,
    getVoices: () => [],
    speak: (utterance: SpeechSynthesisUtterance) => utterance.onend?.(new Event('end') as SpeechSynthesisEvent),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  },
})
