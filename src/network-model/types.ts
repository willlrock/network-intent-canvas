export interface DevicePosition {
  x: number;
  y: number;
}

export interface DeviceInstance {
  id: string;
  deviceTypeId: string;
  name: string;
  position: DevicePosition;
}

export interface LinkEndpoint {
  deviceId: string;
  interfaceId: string;
}

export interface NetworkLink {
  id: string;
  endpointA: LinkEndpoint;
  endpointB: LinkEndpoint;
  cableTypeId?: string;
}

export interface NetworkProject {
  schemaVersion: number;
  name: string;
  devices: DeviceInstance[];
  links: NetworkLink[];
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning';
  message: string;
  deviceId?: string;
  linkId?: string;
  interfaceId?: string;
}
