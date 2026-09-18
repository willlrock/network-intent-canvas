import { DeviceType } from './types';

export const DEVICE_CATALOG: DeviceType[] = [
  {
    id: 'mikrotik-rb5009',
    vendor: 'MikroTik',
    model: 'RB5009UG+S+',
    category: 'router',
    capabilities: {
      osFamily: 'RouterOS',
      routing: true,
      switching: true,
      poeIn: true,
      description: 'Heavy-duty home lab or compact enterprise router with 2.5G and 10G SFP+',
    },
    interfaces: [
      { id: 'ether1', name: 'ether1 (2.5G)', media: 'rj45', maxSpeedMbps: 2500, poeIn: true },
      { id: 'ether2', name: 'ether2', media: 'rj45', maxSpeedMbps: 1000 },
      { id: 'ether3', name: 'ether3', media: 'rj45', maxSpeedMbps: 1000 },
      { id: 'ether4', name: 'ether4', media: 'rj45', maxSpeedMbps: 1000 },
      { id: 'ether5', name: 'ether5', media: 'rj45', maxSpeedMbps: 1000 },
      { id: 'ether6', name: 'ether6', media: 'rj45', maxSpeedMbps: 1000 },
      { id: 'ether7', name: 'ether7', media: 'rj45', maxSpeedMbps: 1000 },
      { id: 'ether8', name: 'ether8', media: 'rj45', maxSpeedMbps: 1000 },
      { id: 'sfp-sfpplus1', name: 'sfp-plus1 (10G)', media: 'sfp+', maxSpeedMbps: 10000 },
    ],
    dimensions: { rackUnits: 1, width: 220, height: 110 },
  },
  {
    id: 'mikrotik-crs326',
    vendor: 'MikroTik',
    model: 'CRS326-24G-2S+',
    category: 'switch',
    capabilities: {
      osFamily: 'SwOS',
      routing: true,
      switching: true,
      description: '24-port Gigabit switch with dual 10G SFP+ cages and Dual Boot (RouterOS / SwOS)',
    },
    interfaces: [
      ...Array.from({ length: 24 }, (_, i) => ({
        id: `ether${i + 1}`,
        name: `ether${i + 1}`,
        media: 'rj45' as const,
        maxSpeedMbps: 1000,
      })),
      { id: 'sfp-sfpplus1', name: 'sfp-plus1 (10G)', media: 'sfp+', maxSpeedMbps: 10000 },
      { id: 'sfp-sfpplus2', name: 'sfp-plus2 (10G)', media: 'sfp+', maxSpeedMbps: 10000 },
    ],
    dimensions: { rackUnits: 1, width: 440, height: 144 },
  },
  {
    id: 'ubiquiti-u6-pro',
    vendor: 'Ubiquiti',
    model: 'UniFi U6 Pro',
    category: 'access-point',
    capabilities: {
      osFamily: 'UniFi OS',
      wifi: 'Wi-Fi 6',
      radios: ['5 GHz (4x4 MU-MIMO)', '2.4 GHz (2x2 MIMO)'],
      description: 'High-performance ceiling-mounted Wi-Fi 6 AP with GbE PoE uplink',
    },
    interfaces: [
      { id: 'eth0', name: 'GbE Uplink (PoE)', media: 'rj45', maxSpeedMbps: 1000, poeIn: true },
    ],
    dimensions: { width: 197, height: 197 },
  },
];
