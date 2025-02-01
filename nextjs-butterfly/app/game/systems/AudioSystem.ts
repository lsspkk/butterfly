export type SoundId = 'NO_SOUND' | 'cat_hurts' | 'pop' | 'buzz' | 'sting'
export const SOUNDS: { id: SoundId; url: string }[] = [
  { id: 'NO_SOUND', url: '' },
  { id: 'cat_hurts', url: '/sounds/cat_hurts1.ogg' },
  { id: 'pop', url: '/sounds/pop.ogg' },
  { id: 'buzz', url: '/sounds/buzz.ogg' },
  { id: 'sting', url: '/sounds/sting.ogg' },
]

type PriSource = { source: AudioBufferSourceNode; priority: number; id: number; soundId: SoundId }

type SoundLimits = {
  [key in SoundId]: number
}
const limits: SoundLimits = {
  NO_SOUND: 0,
  cat_hurts: 1,
  pop: 1,
  buzz: 2,
  sting: 3,
}

let idCounter = 0
export default class AudioEngine {
  private audioContext: AudioContext
  private soundBuffers: { id: string; buffer: AudioBuffer }[] = []

  private _volume: number = 1.0

  private sources: PriSource[] = []

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }
  public async loadSounds() {
    this.soundBuffers.push({ id: SOUNDS[0].id, buffer: this.audioContext.createBuffer(1, 1, 22050) })

    const promises = []
    for (const { id, url } of SOUNDS.slice(1)) {
      const p = this.loadSound(id, url, this.audioContext)
      promises.push(p)
    }

    await Promise.all(promises)
    // console.debug(
    //   'Sounds loaded',
    //   this.soundBuffers.map((s) => s.id)
    // )
  }

  private async loadSound(id: string, url: string, audioContext: AudioContext) {
    const response = await fetch(window.location.origin + url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = await audioContext.decodeAudioData(arrayBuffer)
    this.soundBuffers.push({ id, buffer })
  }

  isPlayingCount(id: SoundId) {
    return this.sources.filter((s) => s.soundId === id).length
  }

  public playSound(soundId: SoundId, priority: number = 0) {
    if (this.soundBuffers.length === 0) return
    const soundIndex = this.soundBuffers.findIndex((s) => s.id === soundId)

    if (limits[soundId] && this.isPlayingCount(soundId) >= limits[soundId]) {
      return
    }

    this.silenceLowPrioritySources(priority)

    const source = this.audioContext.createBufferSource()
    source.buffer = this.soundBuffers[soundIndex].buffer
    source.connect(this.audioContext.destination)
    source.start()
    const id = ++idCounter
    this.sources.push({ source, priority, soundId, id })
    setTimeout(() => {
      source.stop()
      source.disconnect()
      this.sources = this.sources.filter((s) => s.id !== id)
    }, source.buffer.duration * 1000)
  }

  private silenceLowPrioritySources(priority: number) {
    this.sources = this.sources.filter((s) => {
      if (s.priority < priority) {
        s.source.stop()
        s.source.disconnect()
        return false
      }
      return true
    })
  }
  public silence() {
    this.sources.forEach((s) => s.source.stop())
    this.sources = []
  }

  destroy() {
    this.audioContext?.close()
  }
}

export let audioEngine: AudioEngine | undefined = undefined

export async function initEngine() {
  if (audioEngine) {
    return
  }
  audioEngine = new AudioEngine(new window.AudioContext())
  await audioEngine.loadSounds()
}
