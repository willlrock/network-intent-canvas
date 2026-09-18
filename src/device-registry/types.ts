export type DeviceCategory =
  | 'router'
  | 'switch'
  | 'access-point'
  | 'firewall'
  | 'server'
  | 'desktop'
  | 'laptop'
  | 'printer'
  | 'ip-phone'
  | 'camera'
  | 'nvr'
  | 'nas'
  | 'internet'
  | 'generic-endpoint';

export type InterfaceMedia = 'rj45' | 'sfp' | 'sfp+' | 'wireless' | 'console';

export interface InterfaceDefinition {
  id: string;
  name: string;
  media: InterfaceMedia;
  maxSpeedMbps: number;
  poeIn?: boolean;
  poeOut?: boolean;
}

export interface DeviceCapabilities {
  osFamily?: 'RouterOS' | 'UniFi OS' | 'SwOS' | 'Generic' | 'Custom';
  routing?: boolean;
  switching?: boolean;
  wifi?: string;
  radios?: string[];
  poeIn?: boolean;
  poeBudgetWatts?: number;
  description?: string;
}

export interface DeviceVisualDefinition {
  logicalSymbol: DeviceCategory;
}

export interface DeviceType {
  id: string;
  vendor: string;
  model: string;
  category: DeviceCategory;
  interfaces: InterfaceDefinition[];
  capabilities: DeviceCapabilities;
  visual: DeviceVisualDefinition;
  dimensions?: {
    rackUnits?: number;
    width?: number;
    height?: number;
  };
}
