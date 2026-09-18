import { DEVICE_CATALOG } from './catalog';
import { DeviceCategory, DeviceType } from './types';

export * from './types';
export * from './catalog';

const CATEGORY_PREFIX: Partial<Record<DeviceCategory, string>> = {
  router: 'RTR',
  switch: 'SW',
  'access-point': 'AP',
  firewall: 'FW',
  server: 'SRV',
  desktop: 'PC',
  laptop: 'LAP',
  printer: 'PRN',
  'ip-phone': 'PHONE',
  camera: 'CAM',
  nvr: 'NVR',
  nas: 'NAS',
  internet: 'INET',
  'generic-endpoint': 'HOST',
};

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

  static generateDeterministicName(deviceTypeId: string, existingNames: string[]): string {
    const deviceType = this.getById(deviceTypeId);
    let prefix = 'DEV';

    if (deviceTypeId.includes('rb5009')) prefix = 'RB5009';
    else if (deviceTypeId.includes('crs326')) prefix = 'CRS326';
    else if (deviceTypeId.includes('u6-pro')) prefix = 'U6PRO';
    else if (deviceType) prefix = CATEGORY_PREFIX[deviceType.category] || 'DEV';

    let index = 1;
    while (true) {
      const candidate = `${prefix}-${String(index).padStart(2, '0')}`;
      if (!existingNames.includes(candidate)) return candidate;
      index++;
    }
  }
}
