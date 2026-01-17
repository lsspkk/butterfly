export type LevelConfig = {
  level: number
  bees: number
  flowers: number
  butterflies: number
  beeMaxSpeed: number
  /** Optional map ID to link this level to a specific MapData. Defaults to level number if not specified. */
  mapId?: number
}

export type ButterflyData = {
  sprites: string
  name: string
  prevalence: number
  fromLevel: number
}

// Level configs are now loaded from /maps/level-content.json
let levelConfigList: LevelConfig[] = []

/**
 * Load level configurations from JSON file
 */
export async function loadLevelConfigs(): Promise<void> {
  if (levelConfigList.length > 0) {
    return // Already loaded
  }

  try {
    const response = await fetch('/maps/level-content.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch level configs: ${response.status}`)
    }
    levelConfigList = await response.json()
    console.log(`Loaded ${levelConfigList.length} level configs from level-content.json`)
  } catch (error) {
    console.error('Error loading level configs:', error)
    throw error
  }
}

/**
 * Get the level config list. Must call loadLevelConfigs() first.
 */
export function getLevelConfigs(): LevelConfig[] {
  return levelConfigList
}

/**
 * Get the map ID for a level config, falling back to level number if not specified
 */
export const getMapIdForLevel = (config: LevelConfig): number => {
  return config.mapId ?? config.level
}

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
