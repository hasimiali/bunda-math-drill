import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Bunda Math setup', () => {
  it('starts with a playable sample set', () => {
    render(<App />)
    expect(screen.getByRole('combobox', { name: 'Paket contoh' })).toBeInTheDocument()
    expect(screen.getByText('10 soal siap dimainkan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lanjut/i })).toBeEnabled()
  })

  it('does not show random difficulty controls', () => {
    render(<App />)
    expect(screen.queryByLabelText('Kesulitan acak')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'BUAT ACAK' })).not.toBeInTheDocument()
  })

  it('loads a curated example pack', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('4,6\n3,2\n-2,4\n5,-3'),
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'GUNAKAN' }))
    expect(await screen.findByText('Contoh Fokus siap dimainkan')).toBeInTheDocument()
    expect(screen.getByTestId('active-source')).toHaveTextContent('Contoh Fokus')
    fetchMock.mockRestore()
  })

  it('uses an accessible confirmation dialog before leaving a game', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Mode' }))
    await user.click(screen.getByRole('button', { name: /^mulai/i }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Keluar dari latihan?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lanjut berlatih' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('runs teacher drill without answer input or spoken answer key', async () => {
    vi.useFakeTimers()
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Mode' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Guru' }))
    fireEvent.click(screen.getByRole('button', { name: /^mulai/i }))
    await vi.advanceTimersByTimeAsync(8_000)
    expect(screen.getByText('Minta murid menjawab.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Jawaban' })).not.toBeInTheDocument()
    const callsBeforeAnswer = speakSpy.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: /lihat jawaban/i }))
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(speakSpy).toHaveBeenCalledTimes(callsBeforeAnswer)
  })

  it('shows setup controls one step at a time', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('PILIH SOAL')).toBeInTheDocument()
    expect(screen.queryByText('SUARA & TEMPO')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Suara' }))
    expect(screen.getByText('SUARA & TEMPO')).toBeInTheDocument()
    expect(screen.queryByText('PILIH SOAL')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mode' }))
    expect(screen.getByText('MODE LATIHAN')).toBeInTheDocument()
    expect(screen.queryByText('SUARA & TEMPO')).not.toBeInTheDocument()
  })
})
