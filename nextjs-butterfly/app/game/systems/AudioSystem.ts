import { hud } from '../worlds/Level'

export type SoundId = 'NO_SOUND' | 'cat_hurts' | 'QUACK'
export const SOUNDS: { id: SoundId; url: string }[] = [
  { id: 'NO_SOUND', url: '' },
  { id: 'cat_hurts', url: '/sounds/cat_hurts1.ogg' },
]

export default class AudioEngine {
  private audioContext?: AudioContext
  private soundBuffers: { id: string; buffer: AudioBuffer }[] = []

  private _volume: number = 1.0

  constructor(audioContext: AudioContext, volume: number = 1.0) {
    this.volume = volume
    this.audioContext = audioContext

    this.soundBuffers.push({ id: SOUNDS[0].id, buffer: this.audioContext.createBuffer(1, 1, 22050) })
    this.loadSound(SOUNDS[1].url, this.audioContext).then((buffer) => this.soundBuffers.push({ id: SOUNDS[1].id, buffer }))
  }

  private async loadSound(url: string, audioContext: AudioContext) {
    const response = await fetch(window.location.origin + url)
    const arrayBuffer = await response.arrayBuffer()
    return audioContext.decodeAudioData(arrayBuffer)
  }

  public playSound(soundId: string) {
    if (!this.audioContext) return

    if (this.soundBuffers.length === 0) return
    const soundIndex = this.soundBuffers.findIndex((s) => s.id === soundId)

    const source = this.audioContext.createBufferSource()
    source.buffer = this.soundBuffers[soundIndex].buffer
    source.connect(this.audioContext.destination)
    source.start()
  }

  public resume() {
    this.audioContext?.resume()
    hud?.setMessage(JSON.stringify(this.audioContext?.state))
  }

  destroy() {
    this.audioContext?.close()
  }

  set volume(value: number) {
    this._volume = value
  }

  get volume() {
    return this._volume
  }
}

export let audioEngine: AudioEngine | undefined = undefined

export function initEngine(audioContext: AudioContext) {
  audioEngine = new AudioEngine(audioContext)
}
