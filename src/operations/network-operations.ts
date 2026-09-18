import { DeviceRegistry } from '../device-registry';
import { CableRegistry } from '../cable-registry';
import { NetworkProject, DeviceInstance, NetworkLink } from '../network-model/types';
import {
  AddDeviceInput,
  RemoveDeviceInput,
  MoveDeviceInput,
  ConnectInterfacesInput,
  DisconnectLinkInput,
  RenameDeviceInput,
  OperationResult,
} from './types';

export class NetworkOperations {
  static addDevice(
    project: NetworkProject,
    input: AddDeviceInput
  ): OperationResult<{ device: DeviceInstance; updatedProject: NetworkProject }> {
    const deviceType = DeviceRegistry.getById(input.deviceTypeId);
    if (!deviceType) {
      return { success: false, error: `Unknown DeviceType ID: "${input.deviceTypeId}"` };
    }

    const existingNames = project.devices.map((d) => d.name);
    const deviceName =
      input.name?.trim() || DeviceRegistry.generateDeterministicName(input.deviceTypeId, existingNames);

    const baseId = deviceType.model.toLowerCase().replace(/[^a-z0-9]/g, '');
    let counter = 1;
    let newId = `${baseId}-${counter}`;
    while (project.devices.some((d) => d.id === newId)) {
      counter++;
      newId = `${baseId}-${counter}`;
    }

    const newDevice: DeviceInstance = {
      id: newId,
      deviceTypeId: input.deviceTypeId,
      name: deviceName,
      position: { ...input.position },
    };

    return {
      success: true,
      data: {
        device: newDevice,
        updatedProject: { ...project, devices: [...project.devices, newDevice] },
      },
    };
  }

  static removeDevice(
    project: NetworkProject,
    input: RemoveDeviceInput
  ): OperationResult<{ updatedProject: NetworkProject; removedLinkIdCount: number }> {
    if (!project.devices.some((d) => d.id === input.deviceId)) {
      return { success: false, error: `Device not found: "${input.deviceId}"` };
    }

    const initialLinkCount = project.links.length;
    const remainingLinks = project.links.filter(
      (link) => link.endpointA.deviceId !== input.deviceId && link.endpointB.deviceId !== input.deviceId
    );

    return {
      success: true,
      data: {
        updatedProject: {
          ...project,
          devices: project.devices.filter((d) => d.id !== input.deviceId),
          links: remainingLinks,
        },
        removedLinkIdCount: initialLinkCount - remainingLinks.length,
      },
    };
  }

  static moveDevice(
    project: NetworkProject,
    input: MoveDeviceInput
  ): OperationResult<{ updatedProject: NetworkProject }> {
    const deviceIndex = project.devices.findIndex((d) => d.id === input.deviceId);
    if (deviceIndex === -1) {
      return { success: false, error: `Device not found: "${input.deviceId}"` };
    }

    const updatedDevices = [...project.devices];
    updatedDevices[deviceIndex] = {
      ...updatedDevices[deviceIndex],
      position: { ...input.position },
    };

    return {
      success: true,
      data: { updatedProject: { ...project, devices: updatedDevices } },
    };
  }

  static connectInterfaces(
    project: NetworkProject,
    input: ConnectInterfacesInput
  ): OperationResult<{ link: NetworkLink; updatedProject: NetworkProject }> {
    if (input.deviceA === input.deviceB) {
      return {
        success: false,
        error: 'Cannot connect a device interface to another interface on the same device.',
      };
    }

    const devA = project.devices.find((d) => d.id === input.deviceA);
    const devB = project.devices.find((d) => d.id === input.deviceB);
    if (!devA) return { success: false, error: `Device A not found: ${input.deviceA}` };
    if (!devB) return { success: false, error: `Device B not found: ${input.deviceB}` };

    const typeA = DeviceRegistry.getById(devA.deviceTypeId);
    const typeB = DeviceRegistry.getById(devB.deviceTypeId);
    if (!typeA) return { success: false, error: `Unknown device type for device ${devA.name}` };
    if (!typeB) return { success: false, error: `Unknown device type for device ${devB.name}` };

    const ifaceA = typeA.interfaces.find((i) => i.id === input.interfaceA);
    const ifaceB = typeB.interfaces.find((i) => i.id === input.interfaceB);
    if (!ifaceA) {
      return { success: false, error: `Interface ${input.interfaceA} does not exist on ${devA.name}` };
    }
    if (!ifaceB) {
      return { success: false, error: `Interface ${input.interfaceB} does not exist on ${devB.name}` };
    }

    const isOccupied = (deviceId: string, interfaceId: string) =>
      project.links.some(
        (link) =>
          (link.endpointA.deviceId === deviceId && link.endpointA.interfaceId === interfaceId) ||
          (link.endpointB.deviceId === deviceId && link.endpointB.interfaceId === interfaceId)
      );

    if (isOccupied(input.deviceA, input.interfaceA)) {
      return {
        success: false,
        error: `Interface ${input.interfaceA} on ${devA.name} is already connected to another cable.`,
      };
    }
    if (isOccupied(input.deviceB, input.interfaceB)) {
      return {
        success: false,
        error: `Interface ${input.interfaceB} on ${devB.name} is already connected to another cable.`,
      };
    }

    const cableTypeId = input.cableTypeId || 'ethernet-copper';
    const cable = CableRegistry.getById(cableTypeId);
    if (!cable) return { success: false, error: `Unknown CableType ID: "${cableTypeId}"` };

    if (!CableRegistry.isCompatible(cableTypeId, ifaceA.media, ifaceB.media)) {
      return {
        success: false,
        error:
          `${cable.name} is not compatible with ${devA.name}:${ifaceA.name} (${ifaceA.media}) and ` +
          `${devB.name}:${ifaceB.name} (${ifaceB.media}).`,
      };
    }

    const linkId =
      `link_${input.deviceA}_${input.interfaceA}__${input.deviceB}_${input.interfaceB}`;

    const newLink: NetworkLink = {
      id: linkId,
      endpointA: { deviceId: input.deviceA, interfaceId: input.interfaceA },
      endpointB: { deviceId: input.deviceB, interfaceId: input.interfaceB },
      cableTypeId,
    };

    return {
      success: true,
      data: {
        link: newLink,
        updatedProject: { ...project, links: [...project.links, newLink] },
      },
    };
  }

  static disconnectLink(
    project: NetworkProject,
    input: DisconnectLinkInput
  ): OperationResult<{ updatedProject: NetworkProject }> {
    if (!project.links.some((l) => l.id === input.linkId)) {
      return { success: false, error: `Link not found: "${input.linkId}"` };
    }

    return {
      success: true,
      data: {
        updatedProject: { ...project, links: project.links.filter((l) => l.id !== input.linkId) },
      },
    };
  }

  static renameDevice(
    project: NetworkProject,
    input: RenameDeviceInput
  ): OperationResult<{ updatedProject: NetworkProject }> {
    const trimmed = input.name.trim();
    if (!trimmed) return { success: false, error: 'Device name cannot be empty.' };
    if (!project.devices.some((d) => d.id === input.deviceId)) {
      return { success: false, error: `Device not found: "${input.deviceId}"` };
    }

    return {
      success: true,
      data: {
        updatedProject: {
          ...project,
          devices: project.devices.map((d) => (d.id === input.deviceId ? { ...d, name: trimmed } : d)),
        },
      },
    };
  }
}
