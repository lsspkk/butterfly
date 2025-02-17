export type LevelConfig = {
  level: number
  bees: number
  flowers: number
  butterflies: number
  beeMaxSpeed: number
}

export type ButterflyData = {
  sprites: string
  name: string
  prevalence: number
  fromLevel: number
}

export const levelConfigList: LevelConfig[] = [
  { level: 1, bees: 3, flowers: 10, butterflies: 3, beeMaxSpeed: 1 },
  { level: 2, bees: 5, flowers: 10, butterflies: 4, beeMaxSpeed: 2 },
  { level: 3, bees: 7, flowers: 15, butterflies: 5, beeMaxSpeed: 4 },
  { level: 4, bees: 9, flowers: 18, butterflies: 8, beeMaxSpeed: 6 },
  { level: 5, bees: 20, flowers: 25, butterflies: 5, beeMaxSpeed: 2 },
  { level: 6, bees: 30, flowers: 35, butterflies: 5, beeMaxSpeed: 3 },
]

export const createRandomButterflies = ({ level, butterflies }: LevelConfig): ButterflyData[] => {
  const choices = []

  for (const b of allButterflyData) {
    if (level >= b.fromLevel) {
      choices.push(b)
    }
  }

  const selection = []
  for (let i = 0; i < butterflies; i++) {
    const bSetting = chooseByPrevalence(choices)
    selection.push(bSetting)
  }
  return selection
}

const chooseByPrevalence = (choices: ButterflyData[]): ButterflyData => {
  // loop the choices and use prevalence to make a decision if the butterfly is selected
  let total = 0

  for (const b of choices) {
    total += b.prevalence
  }

  let random = Math.random() * total
  for (const b of choices) {
    random -= b.prevalence
    if (random <= 0) {
      return b
    }
  }
  return choices[0]
}

export const allButterflyData: ButterflyData[] = [
  { sprites: 'sitruunaperhonen', name: 'Sitruunaperhonen', prevalence: 0.8, fromLevel: 1 },
  { sprites: 'ohdakeperhonen', name: 'Ohdakeperhonen', prevalence: 0.6, fromLevel: 1 },
  { sprites: 'amiraaliperhonen', name: 'Amiraaliperhonen', prevalence: 0.4, fromLevel: 3 },
  { sprites: 'mustataplahiipija', name: 'Mustatäplähiipijä', prevalence: 0.2, fromLevel: 7 },
  { sprites: 'pikkuapollo', name: 'Pikkuapollo', prevalence: 0.1, fromLevel: 5 },
  { sprites: 'ritariperhonen', name: 'Ritariperhonen', prevalence: 0.5, fromLevel: 2 },
  { sprites: 'suruvaippa', name: 'Suruvaippa', prevalence: 0.3, fromLevel: 5 },
]
