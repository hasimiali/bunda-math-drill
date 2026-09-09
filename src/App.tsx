import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, RotateCcw, Upload, UserRound, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  downloadAnswerKey, downloadResults, examplePacks, loadExamplePack, readQuestionFile, sampleQuestions,
  type ExamplePackId, type FeedbackMode, type GameMode, type Question, type Result,
} from './game'
import { getIndonesianVoices, speak, speakSequence } from './speech'

type Screen = 'setup' | 'ready' | 'playing' | 'answer' | 'feedback' | 'teacher-control' | 'teacher-answer' | 'results' | 'teacher-results'
const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))
const eyebrow = 'font-mono text-[11px] font-medium tracking-[.17em] text-lime'

function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions)
  const [source, setSource] = useState('Paket contoh')
  const [examplePack, setExamplePack] = useState<ExamplePackId>('fokus')
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('Langsung')
  const [gameMode, setGameMode] = useState<GameMode>('Murid')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [speechRate, setSpeechRate] = useState(0.9)
  const [gap, setGap] = useState(0.45)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceName, setVoiceName] = useState('')
  const [round, setRound] = useState(0)
  const [numberIndex, setNumberIndex] = useState(-1)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [notice, setNotice] = useState('Siap dimainkan')
  const [fileError, setFileError] = useState('')
  const [isReplaying, setIsReplaying] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const runId = useRef(0)
  const roundStarted = useRef(0)
  const selectedVoice = voices.find((voice) => voice.name === voiceName) ?? voices[0]
  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const question = questions[round]

  useEffect(() => {
    if (!speechSupported) return
    const update = () => {
      const available = getIndonesianVoices()
      setVoices(available)
      setVoiceName((current) => current || available[0]?.name || '')
    }
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [speechSupported])

  useEffect(() => () => { runId.current += 1; window.speechSynthesis?.cancel() }, [])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = await readQuestionFile(file)
      setQuestions(parsed); setSource(file.name); setFileError('')
      setNotice(`${parsed.length} soal berhasil dimuat`)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'File tidak dapat dibaca.')
    } finally { event.target.value = '' }
  }

  async function useExamplePack() {
    const pack = examplePacks.find((item) => item.id === examplePack)
    if (!pack) return
    try {
      const parsed = await loadExamplePack(pack.file)
      setQuestions(parsed); setSource(pack.label); setFileError('')
      setNotice(`${pack.label} siap dimainkan`)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Contoh soal tidak dapat dimuat.')
    }
  }

  function startGame() {
    runId.current += 1; window.speechSynthesis?.cancel()
    setResults([]); setRound(0); setAnswer(''); setNumberIndex(-1); setCurrentNumber(null)
    roundStarted.current = performance.now()
    void beginRoundAt(0)
  }

  async function beginRoundAt(roundIndex: number) {
    const activeRun = ++runId.current
    roundStarted.current = performance.now()
    setScreen('ready'); setNumberIndex(-1); setCurrentNumber(null)
    if (voiceEnabled && speechSupported) await speak(`Soal nomor ${roundIndex + 1}. Bersiap.`, selectedVoice, speechRate)
    else await delay(900)
    if (activeRun !== runId.current) return
    await delay(250); setScreen('playing')
    await speakSequence(
      questions[roundIndex],
      { voice: selectedVoice, rate: speechRate, gapMs: gap * 1000, enabled: voiceEnabled && speechSupported },
      (value, index) => { setCurrentNumber(value); setNumberIndex(index) },
      () => activeRun !== runId.current,
    )
    if (activeRun !== runId.current) return
    setCurrentNumber(null); setAnswer('')
    setScreen(gameMode === 'Guru' ? 'teacher-control' : 'answer')
  }

  async function replay() {
    if (isReplaying || !question) return
    setIsReplaying(true); setScreen('playing')
    const activeRun = ++runId.current
    await speakSequence(
      question,
      { voice: selectedVoice, rate: speechRate, gapMs: gap * 1000, enabled: voiceEnabled && speechSupported },
      (value, index) => { setCurrentNumber(value); setNumberIndex(index) },
      () => activeRun !== runId.current,
    )
    if (activeRun === runId.current) {
      setCurrentNumber(null)
      setScreen(gameMode === 'Guru' ? 'teacher-control' : 'answer')
    }
    setIsReplaying(false)
  }

  function submitAnswer(event: FormEvent) {
    event.preventDefault()
    if (!/^-?\d+$/.test(answer.trim())) {
      setFileError('Masukkan jawaban berupa angka bulat.')
      const form = event.currentTarget as HTMLFormElement
      const answerElement = form.elements.namedItem('answer')
      if (answerElement instanceof HTMLElement) answerElement.focus()
      return
    }
    setFileError('')
    const numericAnswer = Number(answer)
    const expected = question.reduce((total, value) => total + value, 0)
    const result: Result = {
      question: round + 1, numbers: [...question], answer: numericAnswer, expected,
      correct: numericAnswer === expected,
      seconds: Math.round((performance.now() - roundStarted.current) / 100) / 10,
    }
    setResults((current) => [...current, result])
    if (feedbackMode === 'Langsung') {
      setScreen('feedback')
      if (voiceEnabled && speechSupported) void speak(`Jawabannya ${expected}`, selectedVoice, speechRate)
    } else nextRound()
  }

  function nextRound() {
    runId.current += 1; window.speechSynthesis?.cancel()
    if (round + 1 >= questions.length) setScreen(gameMode === 'Guru' ? 'teacher-results' : 'results')
    else { const next = round + 1; setRound(next); void beginRoundAt(next) }
  }

  function exitGame() {
    runId.current += 1; window.speechSynthesis?.cancel(); setExitOpen(false); setScreen('setup')
  }

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && screen !== 'setup' && screen !== 'results') setExitOpen(true)
      if (event.key === ' ' && (screen === 'answer' || screen === 'teacher-control' || screen === 'teacher-answer')) { event.preventDefault(); void replay() }
      if (event.key === 'Enter' && (screen === 'teacher-control' || screen === 'teacher-answer')) { event.preventDefault(); nextRound() }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  })

  let content
  if (screen === 'setup') content = <SetupScreen {...{
    questions, source, examplePack, setExamplePack, feedbackMode, setFeedbackMode,
    gameMode, setGameMode,
    voiceEnabled, setVoiceEnabled, speechRate, setSpeechRate, gap, setGap,
    voices, voiceName, setVoiceName, speechSupported, notice, fileError,
    handleFile, useExamplePack, startGame,
  }} />
  else if (screen === 'results') content = <ResultsScreen results={results} source={source} onAgain={startGame} onMenu={() => setScreen('setup')} />
  else if (screen === 'teacher-results') content = <TeacherResultsScreen questions={questions} source={source} onAgain={startGame} onMenu={() => setScreen('setup')} />
  else content = <GameScreen {...{
    screen, round, questions, question, numberIndex, currentNumber, answer, setAnswer,
    fileError, submitAnswer, replay, nextRound, results, voiceEnabled,
    speechSupported, requestExit: () => setExitOpen(true), isReplaying,
    showTeacherAnswer: () => setScreen('teacher-answer'), hideTeacherAnswer: () => setScreen('teacher-control'),
  }} />

  return <>{content}<AlertDialog open={exitOpen} onOpenChange={setExitOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Keluar dari latihan?</AlertDialogTitle><AlertDialogDescription>{gameMode === 'Guru' ? 'Sesi drill saat ini akan dihentikan dan kamu akan kembali ke menu utama.' : 'Progres latihan dan jawaban saat ini akan hilang dan kamu akan kembali ke menu utama.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Lanjut berlatih</AlertDialogCancel><AlertDialogAction onClick={exitGame}>Keluar ke menu</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>
}

type SetupProps = {
  questions: Question[]; source: string
  examplePack: ExamplePackId; setExamplePack: (value: ExamplePackId) => void
  feedbackMode: FeedbackMode; setFeedbackMode: (value: FeedbackMode) => void
  gameMode: GameMode; setGameMode: (value: GameMode) => void
  voiceEnabled: boolean; setVoiceEnabled: (value: boolean) => void
  speechRate: number; setSpeechRate: (value: number) => void; gap: number; setGap: (value: number) => void
  voices: SpeechSynthesisVoice[]; voiceName: string; setVoiceName: (value: string) => void
  speechSupported: boolean; notice: string; fileError: string
  handleFile: (event: ChangeEvent<HTMLInputElement>) => void
  useExamplePack: () => Promise<void>; startGame: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="pt-6"><div className="mb-5 flex items-center gap-3"><span className="font-mono text-[10px] tracking-[.14em] text-muted-foreground">{title}</span><Separator className="flex-1" /></div>{children}</section>
}

function SetupScreen(props: SetupProps) {
  const [step, setStep] = useState(0)
  const steps = ['Soal', 'Suara', 'Mode']
  return <main className="dot-grid grid h-svh grid-rows-[52px_1fr_34px] overflow-hidden bg-paper px-3 text-ink sm:px-6 lg:px-10">
    <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between"><a className="flex items-center gap-2 text-xs font-extrabold tracking-[.12em] text-forest no-underline" href="./"><span className="grid size-8 place-items-center rounded-full bg-lime tracking-normal">BM</span>BUNDA MATH</a><p className="hidden text-xs font-semibold text-muted-foreground sm:block">Dengar. Hitung. Hebat.</p></header>
    <div className="mx-auto grid h-full min-h-0 w-full max-w-[1180px] overflow-hidden shadow-[0_20px_60px_rgb(40_46_35/12%)] lg:grid-cols-[.9fr_1.1fr]">
      <article className="hero-rings relative hidden overflow-hidden bg-forest p-[clamp(28px,4vw,56px)] text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative"><p className={eyebrow}>LATIHAN ARITMATIKA</p><h1 className="my-4 text-[clamp(34px,4vw,60px)] font-extrabold leading-[1.02] tracking-[-.055em]">Hitung lebih cepat, <em className="not-italic text-lime">satu suara</em> pada satu waktu.</h1><p className="max-w-md text-sm leading-6 text-[#bed1c6]">Pilih soal, atur suara, lalu tentukan mode latihan.</p></div>
        <ol className="relative flex list-none gap-8 p-0">{steps.map((label, index) => <li className={`flex flex-col gap-1 ${step === index ? 'opacity-100' : 'opacity-40'}`} key={label}><b className="font-mono text-xl font-medium text-gold">0{index + 1}</b><span className="font-mono text-[10px] tracking-[.13em]">{label.toUpperCase()}</span></li>)}</ol>
      </article>
      <Card className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] p-4 sm:p-6 lg:p-8"><CardHeader className="px-1 pt-0"><p className={`${eyebrow} text-forest`}>LANGKAH {step + 1} DARI 3</p><div className="mt-2 grid grid-cols-3 gap-1">{steps.map((label, index) => <Button key={label} variant={step === index ? 'default' : 'ghost'} size="sm" onClick={() => setStep(index)} aria-current={step === index ? 'step' : undefined}>{label}</Button>)}</div></CardHeader>
        <CardContent className="min-h-0 px-1 py-2">
          {step === 0 && <Section title="PILIH SOAL"><div className="grid border border-[#e6dfce] bg-[#f1ede2] px-4 py-3"><span className="font-mono text-[8px] tracking-[.14em] text-muted-foreground">FILE AKTIF</span><strong data-testid="active-source" className="truncate text-sm">{props.source}</strong><small className="text-[10px] text-muted-foreground">{props.questions.length} soal siap dimainkan</small></div><div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><Select value={props.examplePack} onValueChange={(value) => props.setExamplePack(value as ExamplePackId)}><SelectTrigger aria-label="Paket contoh" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{examplePacks.map((pack) => <SelectItem key={pack.id} value={pack.id}>{pack.label}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => void props.useExamplePack()}>GUNAKAN</Button></div><Button asChild className="mt-3 w-full"><Label className="cursor-pointer px-4 py-3 text-[10px] font-extrabold tracking-[.09em]"><Upload /> PILIH FILE CSV / EXCEL<Input className="sr-only" type="file" accept=".csv,.xlsx,.xlsm" onChange={props.handleFile} /></Label></Button><p className="mt-3 text-[10px] text-muted-foreground">Isi dan panjang drill mengikuti file soal.</p></Section>}
          {step === 1 && <Section title="SUARA & TEMPO"><div className="flex items-center justify-between"><Label htmlFor="voice" className="cursor-pointer text-xs"><Switch id="voice" checked={props.voiceEnabled} onCheckedChange={props.setVoiceEnabled} disabled={!props.speechSupported} />Suara Indonesia</Label><output className="font-mono text-xs text-forest">{props.speechRate.toFixed(2)}×</output></div>{!props.speechSupported && <Alert variant="destructive" className="mt-3"><AlertDescription>Browser tidak mendukung suara. Mode visual tetap tersedia.</AlertDescription></Alert>}<Label className="mt-6 grid gap-3 text-xs text-muted-foreground"><span>Kecepatan bicara</span><Slider min={0.6} max={1.25} step={0.05} value={[props.speechRate]} onValueChange={([value]) => props.setSpeechRate(value)} /></Label><Label className="mt-6 grid gap-3 text-xs text-muted-foreground"><span className="flex justify-between">Jeda setelah suara <b className="text-ink">{props.gap.toFixed(2)} dtk</b></span><Slider min={0.15} max={1.5} step={0.05} value={[props.gap]} onValueChange={([value]) => props.setGap(value)} /></Label>{props.voices.length > 0 && props.voiceEnabled && <div className="mt-6 grid gap-2"><Label className="text-xs text-muted-foreground">Pilihan suara</Label><Select value={props.voiceName} onValueChange={props.setVoiceName}><SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger><SelectContent>{props.voices.map((voice) => <SelectItem key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} ({voice.lang})</SelectItem>)}</SelectContent></Select></div>}</Section>}
          {step === 2 && <Section title="MODE LATIHAN"><RadioGroup value={props.gameMode} onValueChange={(value) => props.setGameMode(value as GameMode)} className="grid grid-cols-2 gap-2"><Label className="cursor-pointer flex-col justify-center border border-border p-4 text-xs text-muted-foreground has-[[data-state=checked]]:border-forest has-[[data-state=checked]]:bg-muted has-[[data-state=checked]]:text-forest"><RadioGroupItem value="Murid" className="sr-only" /><UserRound className="size-6" />Murid</Label><Label className="cursor-pointer flex-col justify-center border border-border p-4 text-xs text-muted-foreground has-[[data-state=checked]]:border-forest has-[[data-state=checked]]:bg-muted has-[[data-state=checked]]:text-forest"><RadioGroupItem value="Guru" className="sr-only" /><GraduationCap className="size-6" />Guru</Label></RadioGroup><p className="mt-3 text-[10px] leading-4 text-muted-foreground">{props.gameMode === 'Guru' ? 'Guru mengontrol drill; murid menjawab secara lisan.' : 'Murid mengisi jawaban dan mendapat skor.'}</p>{props.gameMode === 'Murid' && <div className="mt-5"><Label className="mb-2 text-xs">Tampilkan hasil</Label><RadioGroup value={props.feedbackMode} onValueChange={(value) => props.setFeedbackMode(value as FeedbackMode)} className="grid grid-cols-2 gap-1 bg-[#eeeadd] p-1">{(['Langsung', 'Di akhir'] as FeedbackMode[]).map((mode) => <Label key={mode} className="cursor-pointer justify-center px-3 py-2 text-xs text-muted-foreground has-[[data-state=checked]]:bg-white has-[[data-state=checked]]:text-forest"><RadioGroupItem value={mode} className="sr-only" />{mode}</Label>)}</RadioGroup></div>}</Section>}
        </CardContent>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-border pt-3"><Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft /> Kembali</Button><div className="truncate text-center text-[9px] text-muted-foreground" role="status">{props.fileError || props.notice}</div>{step < 2 ? <Button size="sm" onClick={() => setStep((value) => value + 1)}>Lanjut <ArrowRight /></Button> : <Button variant="lime" size="sm" onClick={props.startGame}>MULAI <ArrowRight /></Button>}</div>
      </Card>
    </div><footer className="mx-auto flex w-full max-w-[1180px] items-center justify-between overflow-hidden text-[9px] text-muted-foreground"><span className="truncate">File diproses langsung di browser.</span><div className="hidden gap-3 sm:flex">{examplePacks.map((pack) => <a key={pack.id} className="font-bold text-forest" href={`./${pack.file}`} download>{pack.label}</a>)}</div></footer>
  </main>
}

type GameProps = {
  screen: Screen; round: number; questions: Question[]; question: Question; numberIndex: number
  currentNumber: number | null; answer: string; setAnswer: (value: string) => void; fileError: string
  submitAnswer: (event: FormEvent) => void
  replay: () => Promise<void>; nextRound: () => void; results: Result[]; voiceEnabled: boolean
  speechSupported: boolean; requestExit: () => void; isReplaying: boolean
  showTeacherAnswer: () => void; hideTeacherAnswer: () => void
}

function GameScreen(props: GameProps) {
  const latest = props.results.at(-1)
  const progress = ((props.round + (props.screen === 'feedback' ? 1 : 0)) / props.questions.length) * 100
  return <main className="grid h-svh grid-rows-[auto_1fr_auto] overflow-hidden bg-forest px-4 py-3 text-white sm:px-10 sm:py-5">
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4"><button className="text-left text-[11px] font-extrabold tracking-[.12em] text-lime" onClick={props.requestExit}>BUNDA MATH</button><div className="font-mono text-[11px] tracking-[.14em]">SOAL {props.round + 1} <span className="text-white/50">/ {props.questions.length}</span></div><Button variant="play" size="icon" className="justify-self-end" onClick={props.requestExit} aria-label="Keluar dari latihan"><X /></Button><Progress value={progress} className="col-span-3 h-[3px] bg-white/15" indicatorClassName="bg-lime" /></header>
    <section className="grid place-items-center text-center" aria-live="polite">
      {props.screen === 'ready' && <div className="animate-enter"><p className={`${eyebrow} text-gold`}>SOAL {props.round + 1}</p><h1 className="my-2 text-[clamp(30px,min(7vw,9vh),70px)] font-extrabold tracking-[-.05em]">Siap mendengarkan?</h1><p className="text-sm text-[#bed1c6]">Angka akan muncul dan dibacakan satu per satu.</p><div className="mt-[min(4vh,24px)] flex justify-center gap-2">{[0, 1, 2].map((index) => <i key={index} className="size-2 animate-pulse-dot rounded-full bg-lime" style={{ animationDelay: `${index * .18}s` }} />)}</div></div>}
      {props.screen === 'playing' && props.currentNumber !== null && <div className="animate-enter" key={`${props.round}-${props.numberIndex}-${props.isReplaying}`}><p className={eyebrow}>ANGKA {props.numberIndex + 1} DARI {props.question.length}</p><div className={`mt-1 text-[clamp(90px,min(25vw,55vh),300px)] font-extrabold leading-none tracking-[-.08em] tabular-nums ${props.currentNumber < 0 ? 'text-gold' : 'text-white'}`}>{props.numberIndex > 0 && props.currentNumber > 0 ? '+' : ''}{props.currentNumber}</div></div>}
      {props.screen === 'answer' && <form className="w-[min(420px,90vw)] animate-enter" onSubmit={props.submitAnswer}><p className={eyebrow}>SELESAI MENGHITUNG</p><h1 className="my-1 text-[clamp(28px,min(6vw,8vh),60px)] font-extrabold tracking-[-.05em]">Berapa hasilnya?</h1><Input autoFocus name="answer" value={props.answer} onChange={(event) => props.setAnswer(event.target.value)} inputMode="numeric" aria-label="Jawaban" placeholder="?" className="mx-auto h-auto w-[min(260px,75vw)] border-0 border-b-4 border-lime bg-transparent p-1 text-center text-[clamp(42px,min(9vw,12vh),76px)] font-extrabold text-white placeholder:text-white/25 focus-visible:ring-0" /><p className="mt-1 font-mono text-[9px] text-[#bed1c6]">Ketik jawaban lalu tekan Enter</p>{props.fileError && <Alert variant="destructive" className="mt-1 text-coral"><AlertDescription className="justify-center">{props.fileError}</AlertDescription></Alert>}<div className="mt-3 flex justify-center gap-2"><Button variant="lime" type="submit">KIRIM <ArrowRight /></Button><Button variant="play" type="button" onClick={() => void props.replay()}><RotateCcw /> ULANGI</Button></div></form>}
      {props.screen === 'feedback' && latest && <div className="animate-enter"><p className={`${eyebrow} ${latest.correct ? '' : 'text-coral'}`}>{latest.correct ? 'TEPAT!' : 'BELUM TEPAT'}</p><h1 className="my-3 text-[clamp(42px,7vw,80px)] font-extrabold tracking-[-.05em]">{latest.correct ? 'Kerja bagus.' : latest.expected}</h1><p className="text-[#bed1c6]">{latest.correct ? 'Hitunganmu benar. Pertahankan fokusmu.' : 'adalah jawaban yang benar'}</p><Button variant="lime" size="lg" className="mt-8" onClick={props.nextRound}>{props.round + 1 === props.questions.length ? 'LIHAT HASIL' : 'SOAL BERIKUTNYA'} <ArrowRight /></Button></div>}
      {props.screen === 'teacher-control' && <div className="w-[min(720px,94vw)] animate-enter"><p className={eyebrow}>WAKTU MENJAWAB</p><h1 className="my-2 text-[clamp(28px,min(6vw,8vh),64px)] font-extrabold tracking-[-.05em]">Minta murid menjawab.</h1><p className="text-sm text-[#bed1c6]">Tunggu jawaban lisan, lalu pilih tindakan.</p><div className="mt-[min(5vh,28px)] grid grid-cols-3 gap-2"><Button aria-label="Ulangi soal" variant="play" onClick={() => void props.replay()}><RotateCcw /><span className="hidden sm:inline">ULANGI</span></Button><Button aria-label="Lihat jawaban" variant="gold" onClick={props.showTeacherAnswer}><Eye /><span className="hidden sm:inline">JAWABAN</span></Button><Button variant="lime" onClick={props.nextRound}>{props.round + 1 === props.questions.length ? 'SELESAI' : 'LANJUT'} <ArrowRight /></Button></div></div>}
      {props.screen === 'teacher-answer' && <div className="w-[min(720px,94vw)] animate-enter"><p className={eyebrow}>KUNCI SOAL {props.round + 1}</p><div className="my-1 text-[clamp(70px,min(18vw,35vh),190px)] font-extrabold leading-none tracking-[-.08em] text-gold tabular-nums">{props.question.reduce((total, value) => total + value, 0)}</div><p className="text-xs text-[#bed1c6]">Jawaban tidak dibacakan.</p><div className="mt-[min(4vh,24px)] grid grid-cols-3 gap-2"><Button variant="play" onClick={() => void props.replay()}><RotateCcw /><span className="hidden sm:inline">ULANGI</span></Button><Button variant="play" onClick={props.hideTeacherAnswer}><EyeOff /><span className="hidden sm:inline">SEMBUNYIKAN</span></Button><Button variant="lime" onClick={props.nextRound}>{props.round + 1 === props.questions.length ? 'SELESAI' : 'LANJUT'} <ArrowRight /></Button></div></div>}
    </section><footer className="flex justify-between font-mono text-[9px] tracking-wide text-white/55"><span className="flex items-center gap-2 text-lime"><i className="size-2 rounded-full bg-lime" />{props.voiceEnabled && props.speechSupported ? 'SUARA AKTIF' : 'MODE VISUAL'}</span><span className="hidden sm:block">Spasi: ulangi &nbsp; | &nbsp; Esc: keluar</span></footer>
  </main>
}

function ResultsScreen({ results, source, onAgain, onMenu }: { results: Result[]; source: string; onAgain: () => void; onMenu: () => void }) {
  const correct = results.filter((result) => result.correct).length
  const score = results.length ? Math.round(correct / results.length * 100) : 0
  return <SummaryScreen
    eyebrowText="LATIHAN SELESAI" title="Lihat kemajuanmu."
    summary={<Card className="grid grid-cols-[auto_1fr] items-center gap-x-5 bg-forest p-4 text-white lg:block lg:p-7"><strong className="text-5xl leading-none tracking-[-.07em] lg:text-7xl">{score}<small className="text-2xl text-lime">%</small></strong><div><p className="text-xs text-[#bed1c6]">{correct} dari {results.length} benar</p><Progress value={score} className="mt-2 h-1.5 bg-white/20" indicatorClassName="bg-lime" /></div><blockquote className="col-span-2 mt-3 text-sm font-bold text-gold lg:mt-6 lg:text-lg">{score >= 80 ? 'Luar biasa! Pertahankan.' : 'Sedikit lagi. Coba ulangi.'}</blockquote></Card>}
    items={results.map((result) => ({ id: result.question, sequence: result.numbers, value: result.answer, badge: result.correct ? 'BENAR' : `KUNCI ${result.expected}`, correct: result.correct }))}
    actions={<><Button variant="outline" onClick={() => downloadResults(results, source)}><ArrowDownToLine /> SIMPAN</Button><Button variant="ghost" onClick={onMenu}>MENU</Button><Button variant="lime" onClick={onAgain}>MAIN LAGI <ArrowRight /></Button></>}
  />
}

function TeacherResultsScreen({ questions, source, onAgain, onMenu }: { questions: Question[]; source: string; onAgain: () => void; onMenu: () => void }) {
  return <SummaryScreen
    eyebrowText="DRILL SELESAI" title="Semua soal sudah dibacakan."
    summary={<Card className="flex items-center justify-between bg-forest p-5 text-white lg:block lg:p-7"><div><p className={eyebrow}>RINGKASAN KUNCI</p><strong className="mt-2 block text-4xl lg:mt-6 lg:text-6xl">{questions.length}</strong><p className="text-xs text-[#bed1c6]">soal · {source}</p></div><Badge className="bg-lime text-forest">MODE GURU</Badge></Card>}
    items={questions.map((question, index) => ({ id: index + 1, sequence: question, value: question.reduce((total, value) => total + value, 0), badge: 'KUNCI', correct: true }))}
    actions={<><Button variant="outline" onClick={() => downloadAnswerKey(questions, source)}><ArrowDownToLine /> SIMPAN</Button><Button variant="ghost" onClick={onMenu}>MENU</Button><Button variant="lime" onClick={onAgain}>ULANGI <RotateCcw /></Button></>}
  />
}

type SummaryItem = { id: number; sequence: number[]; value: number; badge: string; correct: boolean }

function SummaryScreen({ eyebrowText, title, summary, items, actions }: { eyebrowText: string; title: string; summary: React.ReactNode; items: SummaryItem[]; actions: React.ReactNode }) {
  const [page, setPage] = useState(0)
  const pageSize = 4
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const visible = items.slice(page * pageSize, (page + 1) * pageSize)
  return <main className="dot-grid grid h-svh grid-rows-[auto_1fr_auto] overflow-hidden bg-paper p-3 sm:p-5 lg:p-8"><header className="mx-auto w-full max-w-7xl"><p className={`${eyebrow} text-forest`}>{eyebrowText}</p><h1 className="mt-1 truncate text-[clamp(25px,4vw,48px)] font-extrabold tracking-[-.05em]">{title}</h1></header><section className="mx-auto grid min-h-0 w-full max-w-7xl gap-3 py-3 lg:grid-cols-[280px_1fr]">{summary}<Card className="min-h-0 border border-border p-3 sm:p-4"><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Rincian soal</h2><span className="font-mono text-[10px] text-muted-foreground">{page + 1} / {pages}</span></div><div className="grid min-h-0 grid-rows-4 gap-2">{visible.map((item) => <article key={item.id} className="grid min-h-0 grid-cols-[32px_1fr_auto] items-center gap-2 border border-border bg-muted/40 px-3"><span className="font-mono text-xs text-muted-foreground">{String(item.id).padStart(2, '0')}</span><div className="min-w-0 truncate font-mono text-xs">{item.sequence.map((value, index) => <span className="mr-2" key={index}>{index > 0 && value > 0 ? '+' : ''}{value}</span>)}</div><div className="flex items-center gap-2"><strong>{item.value}</strong><Badge className="hidden sm:inline-flex" variant={item.correct ? 'success' : 'destructive'}>{item.badge}</Badge></div></article>)}</div><div className="mt-2 flex justify-end gap-2"><Button aria-label="Halaman sebelumnya" variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ArrowLeft /></Button><Button aria-label="Halaman berikutnya" variant="outline" size="icon" disabled={page === pages - 1} onClick={() => setPage((value) => value + 1)}><ArrowRight /></Button></div></Card></section><footer className="mx-auto flex w-full max-w-7xl justify-end gap-2 [&>button]:h-9 [&>button]:px-3">{actions}</footer></main>
}

export default App
