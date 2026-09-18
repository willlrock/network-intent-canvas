import { DevicePosition } from '../network-model/types';

export interface AddDeviceInput {
  deviceTypeId: string;
  position: DevicePosition;
  name?: string;
}

export interface RemoveDeviceInput {
  deviceId: string;
}

export interface MoveDeviceInput {
  deviceId: string;
  position: DevicePosition;
}

export interface ConnectInterfacesInput {
  deviceA: string;
  interfaceA: string;
  deviceB: string;
  interfaceB: string;
}

export interface DisconnectLinkInput {
  linkId: string;
}

export interface RenameDeviceInput {
  deviceId: string;
  name: string;
}

export type OperationType =
  | 'ADD_DEVICE'
  | 'REMOVE_DEVICE'
  | 'MOVE_DEVICE'
  | 'CONNECT_INTERFACES'
  | 'DISCONNECT_LINK'
  | 'RENAME_DEVICE'
  | 'LOAD_PROJECT'
  | 'RESET_PROJECT';

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  type: OperationType;
  payload: Record<string, unknown>;
  success: boolean;
  error?: string;
}

export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
