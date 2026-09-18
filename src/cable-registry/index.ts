import { InterfaceMedia } from '../device-registry';
import { CABLE_CATALOG } from './catalog';
import { CableType } from './types';

export * from './types';
export * from './catalog';

export class CableRegistry {
  private static catalog = new Map<string, CableType>(
    CABLE_CATALOG.map((cable) => [cable.id, cable])
  );

  static getAll(): CableType[] {
    return Array.from(this.catalog.values());
  }

  static getById(id: string): CableType | undefined {
    return this.catalog.get(id);
  }

  static supportsMedia(cable: CableType, media: InterfaceMedia): boolean {
    return cable.compatiblePairs.some(([a, b]) => a === media || b === media);
  }

  static isCompatible(cableId: string, a: InterfaceMedia, b: InterfaceMedia): boolean {
    const cable = this.getById(cableId);
    if (!cable) return false;
    return cable.compatiblePairs.some(
      ([left, right]) => (left === a && right === b) || (left === b && right === a)
    );
  }
}
