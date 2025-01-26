import { Application, Container, Graphics, Text } from 'pixi.js'

export default class ScoreScreen {
  app: Application
  container: Container
  message: Text
  background: Graphics
  score: number

  constructor(app: Application) {
    this.score = 0
    this.app = app

    this.container = new Container()

    this.background = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x222222)
    this.background.x = 3
    this.background.y = 3
    this.message = this.addText(
      `Congratulations, 
      you have saved the butterflies`,
      100,
      100,
      40
    )

    this.container.addChild(this.background)
    this.container.addChild(this.message)
    app.stage.addChild(this.container)
  }

  private addText(text: string, x: number, y: number, size = 10, fill = '#ffffff') {
    const t = new Text({ text, style: { fill, align: 'center', fontSize: size } })
    t.x = x
    t.y = y
    this.background.addChild(t)
    return t
  }
}
