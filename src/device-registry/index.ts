import { DEVICE_CATALOG } from './catalog';
import { DeviceType } from './types';

export * from './types';
export * from './catalog';

export class DeviceRegistry {
  private static catalog: Map<string, DeviceType> = new Map(
    DEVICE_CATALOG.map((device) => [device.id, device])
  );

  static getAll(): DeviceType[] {
    return Array.from(this.catalog.values());
  }

  static getById(id: string): DeviceType | undefined {
    return this.catalog.get(id);
  }

  static getByCategory(category: string): DeviceType[] {
    return this.getAll().filter((d) => d.category === category);
  }

  static getCategories(): string[] {
    return Array.from(new Set(this.getAll().map((d) => d.category)));
  }

  /**
   * Generates a deterministic device hostname/label based on existing instances.
   * e.g., RB5009-01, RB5009-02, CRS326-01, U6PRO-01
   */
  static generateDeterministicName(deviceTypeId: string, existingNames: string[]): string {
    const deviceType = this.getById(deviceTypeId);
    let prefix = 'DEV';
    if (deviceType) {
      if (deviceType.id.includes('rb5009')) prefix = 'RB5009';
      else if (deviceType.id.includes('crs326')) prefix = 'CRS326';
      else if (deviceType.id.includes('u6-pro')) prefix = 'U6PRO';
      else prefix = deviceType.model.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    }

    let index = 1;
    while (true) {
      const candidate = `${prefix}-${String(index).padStart(2, '0')}`;
      if (!existingNames.includes(candidate)) {
        return candidate;
      }
      index++;
    }
  }
}
