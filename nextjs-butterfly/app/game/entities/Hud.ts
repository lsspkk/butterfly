import { Application, Container, Graphics, Text } from 'pixi.js'

export default class Hud {
  app: Application
  container: Container
  scoreText: Text
  name: Text
  message: Text
  background: Graphics
  score: number
  pos: Text

  constructor(app: Application, name: string) {
    this.score = 0
    this.app = app

    this.container = new Container()

    this.background = new Graphics().rect(0, 0, app.screen.width - 10, 23).fill(0x222222)
    this.background.alpha = 0.9
    this.background.x = 3
    this.background.y = 3
    this.name = this.addText(name, 4, 2, 15)
    this.message = this.addText('Hunt em flying things!', 100, 4)

    const x = app.screen.width - 100
    this.addText('Score:', x, 4, 12)
    this.scoreText = this.addText('0', x + 60, 4, 12, '#ffaaaa')

    this.pos = this.addText('0, 0', x - 300, 4, 12, '#aaffaa')

    this.container.addChild(this.background)
    app.stage.addChild(this.container)
  }

  setMessage(text: string) {
    this.message.text = text
  }
  setPos(x: number, y: number) {
    this.pos.text = `${x}, ${y}`
  }
  setPosMessage(x: string) {
    this.pos.text = x
  }
  setScore(score: number) {
    this.score = score
    this.scoreText.text = score.toString()
  }

  private addText(text: string, x: number, y: number, size = 10, fill = '#ffffff') {
    const t = new Text({ text, style: { fill, align: 'center', fontSize: size } })
    t.x = x
    t.y = y
    this.background.addChild(t)
    return t
  }
}
