import { NetworkProject, ValidationIssue, DeviceInstance, NetworkLink } from '../network-model/types';
import { validateNetworkProject } from '../network-model/validation';
import { NetworkOperations } from './network-operations';
import {
  AddDeviceInput,
  RemoveDeviceInput,
  MoveDeviceInput,
  ConnectInterfacesInput,
  DisconnectLinkInput,
  RenameDeviceInput,
  OperationLogEntry,
  OperationResult,
} from './types';

export const INITIAL_PROJECT: NetworkProject = {
  schemaVersion: 1,
  name: 'Lab Topology',
  devices: [],
  links: [],
};

export interface NetworkStoreState {
  project: NetworkProject;
  selectedDeviceId: string | null;
  selectedLinkId: string | null;
  validationIssues: ValidationIssue[];
  operationLog: OperationLogEntry[];
}

type Listener = () => void;

export class NetworkStore {
  private state: NetworkStoreState;
  private listeners = new Set<Listener>();
  private onProjectChangeCallbacks = new Set<(project: NetworkProject) => void>();

  constructor(initialProject: NetworkProject = INITIAL_PROJECT) {
    this.state = {
      project: initialProject,
      selectedDeviceId: null,
      selectedLinkId: null,
      validationIssues: validateNetworkProject(initialProject),
      operationLog: [],
    };
  }

  getState(): NetworkStoreState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onProjectChange(cb: (project: NetworkProject) => void): () => void {
    this.onProjectChangeCallbacks.add(cb);
    return () => this.onProjectChangeCallbacks.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private logOperation(
    type: OperationLogEntry['type'],
    payload: Record<string, unknown>,
    result: OperationResult
  ): void {
    const entry: OperationLogEntry = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      payload,
      success: result.success,
      error: result.error,
    };
    this.state.operationLog = [entry, ...this.state.operationLog.slice(0, 49)];
  }

  private setProject(updatedProject: NetworkProject): void {
    this.state.project = updatedProject;
    this.state.validationIssues = validateNetworkProject(updatedProject);

    // Clean up selections if deleted
    if (this.state.selectedDeviceId && !updatedProject.devices.some((d) => d.id === this.state.selectedDeviceId)) {
      this.state.selectedDeviceId = null;
    }
    if (this.state.selectedLinkId && !updatedProject.links.some((l) => l.id === this.state.selectedLinkId)) {
      this.state.selectedLinkId = null;
    }

    this.onProjectChangeCallbacks.forEach((cb) => cb(updatedProject));
    this.notify();
  }

  selectDevice(deviceId: string | null): void {
    this.state.selectedDeviceId = deviceId;
    if (deviceId) {
      this.state.selectedLinkId = null;
    }
    this.notify();
  }

  selectLink(linkId: string | null): void {
    this.state.selectedLinkId = linkId;
    if (linkId) {
      this.state.selectedDeviceId = null;
    }
    this.notify();
  }

  // --- STRUCTURED OPERATIONS ---

  addDevice(input: AddDeviceInput): OperationResult<{ device: DeviceInstance; updatedProject: NetworkProject }> {
    const res = NetworkOperations.addDevice(this.state.project, input);
    this.logOperation('ADD_DEVICE', input as unknown as Record<string, unknown>, res);
    if (res.success && res.data) {
      this.setProject(res.data.updatedProject);
      this.selectDevice(res.data.device.id);
    }
    return res;
  }

  removeDevice(input: RemoveDeviceInput): OperationResult<{ updatedProject: NetworkProject; removedLinkIdCount: number }> {
    const res = NetworkOperations.removeDevice(this.state.project, input);
    this.logOperation('REMOVE_DEVICE', input as unknown as Record<string, unknown>, res);
    if (res.success && res.data) {
      this.setProject(res.data.updatedProject);
    }
    return res;
  }

  moveDevice(input: MoveDeviceInput): OperationResult<{ updatedProject: NetworkProject }> {
    const res = NetworkOperations.moveDevice(this.state.project, input);
    // Don't spam operation log for minor drag increments, but keep success/error check
    if (res.success && res.data) {
      this.setProject(res.data.updatedProject);
    }
    return res;
  }

  logMoveDevice(input: MoveDeviceInput): void {
    this.logOperation('MOVE_DEVICE', input as unknown as Record<string, unknown>, { success: true });
  }

  connectInterfaces(input: ConnectInterfacesInput): OperationResult<{ link: NetworkLink; updatedProject: NetworkProject }> {
    const res = NetworkOperations.connectInterfaces(this.state.project, input);
    this.logOperation('CONNECT_INTERFACES', input as unknown as Record<string, unknown>, res);
    if (res.success && res.data) {
      this.setProject(res.data.updatedProject);
      this.selectLink(res.data.link.id);
    }
    return res;
  }

  disconnectLink(input: DisconnectLinkInput): OperationResult<{ updatedProject: NetworkProject }> {
    const res = NetworkOperations.disconnectLink(this.state.project, input);
    this.logOperation('DISCONNECT_LINK', input as unknown as Record<string, unknown>, res);
    if (res.success && res.data) {
      this.setProject(res.data.updatedProject);
    }
    return res;
  }

  renameDevice(input: RenameDeviceInput): OperationResult<{ updatedProject: NetworkProject }> {
    const res = NetworkOperations.renameDevice(this.state.project, input);
    this.logOperation('RENAME_DEVICE', input as unknown as Record<string, unknown>, res);
    if (res.success && res.data) {
      this.setProject(res.data.updatedProject);
    }
    return res;
  }

  loadProject(project: NetworkProject): OperationResult<void> {
    this.setProject(project);
    const res = { success: true };
    this.logOperation('LOAD_PROJECT', { name: project.name, devicesCount: project.devices.length }, res);
    return res;
  }

  resetProject(): OperationResult<void> {
    this.setProject({
      schemaVersion: 1,
      name: 'New Topology',
      devices: [],
      links: [],
    });
    this.state.selectedDeviceId = null;
    this.state.selectedLinkId = null;
    const res = { success: true };
    this.logOperation('RESET_PROJECT', {}, res);
    return res;
  }

  validate(): ValidationIssue[] {
    const issues = validateNetworkProject(this.state.project);
    this.state.validationIssues = issues;
    this.notify();
    return issues;
  }
}

export const globalNetworkStore = new NetworkStore();
