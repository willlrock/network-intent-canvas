export type DeviceCategory = 'router' | 'switch' | 'access-point';

export type InterfaceMedia = 'rj45' | 'sfp' | 'sfp+' | 'wireless';

export interface InterfaceDefinition {
  id: string; // e.g. "ether1", "sfp-sfpplus1"
  name: string; // display name
  media: InterfaceMedia;
  maxSpeedMbps: number;
  poeIn?: boolean;
  poeOut?: boolean;
}

export interface DeviceCapabilities {
  osFamily?: 'RouterOS' | 'UniFi OS' | 'SwOS' | 'Custom';
  routing?: boolean;
  switching?: boolean;
  wifi?: string;
  radios?: string[];
  poeIn?: boolean;
  poeBudgetWatts?: number;
  description?: string;
}

export interface DeviceType {
  id: string; // unique deterministic type ID, e.g. "mikrotik-rb5009"
  vendor: string;
  model: string;
  category: DeviceCategory;
  interfaces: InterfaceDefinition[];
  capabilities: DeviceCapabilities;
  dimensions?: {
    rackUnits?: number;
    width?: number;
    height?: number;
  };
}
