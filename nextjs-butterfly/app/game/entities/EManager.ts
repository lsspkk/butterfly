import { CType } from '../components/CTypes'

export type EntityType = 'Bee' | 'Butterfly' | 'Flower' | 'Cloud' | 'Raindrop' | 'Grass' | 'Pond' | 'River' | 'World' | 'Cat' | 'Hud' | 'Bubble'

export function getEType(id: string): EntityType {
  return id.split('_')[0] as EntityType
}

export class EManager {
  private entityMap: Map<string, Map<CType, any>> = new Map()
  private nextId = 0

  create(eType: EntityType) {
    const id = `${eType}_${this.nextId++}`
    this.entityMap.set(id, new Map())
    return id
  }

  addComponent<T>(id: string, cType: CType, component: T) {
    this.entityMap.get(id)?.set(cType, component)
  }

  getComponent<T>(id: string, cType: CType): T | undefined {
    return this.entityMap.get(id)?.get(cType) as T | undefined
  }

  getEntitiesByEType(eType: EntityType): string[] {
    return Array.from(this.entityMap.entries())
      .filter(([id]) => getEType(id) === eType)
      ?.map(([id]) => id)
  }

  getEntitiesByComponents(...components: CType[]) {
    return Array.from(this.entityMap.entries()).filter(([, entityComponents]) => components.every((c) => entityComponents.has(c)))
  }
}
