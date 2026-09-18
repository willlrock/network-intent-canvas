import { DeviceRegistry } from '../device-registry';
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
  /**
   * Add device to network project.
   */
  static addDevice(
    project: NetworkProject,
    input: AddDeviceInput
  ): OperationResult<{ device: DeviceInstance; updatedProject: NetworkProject }> {
    const deviceType = DeviceRegistry.getById(input.deviceTypeId);
    if (!deviceType) {
      return {
        success: false,
        error: `Unknown DeviceType ID: "${input.deviceTypeId}"`,
      };
    }

    const existingNames = project.devices.map((d) => d.name);
    const deviceName = input.name?.trim() || DeviceRegistry.generateDeterministicName(input.deviceTypeId, existingNames);

    // Create unique ID
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

    const updatedProject: NetworkProject = {
      ...project,
      devices: [...project.devices, newDevice],
    };

    return {
      success: true,
      data: {
        device: newDevice,
        updatedProject,
      },
    };
  }

  /**
   * Remove device from network project and clean up any attached links.
   */
  static removeDevice(
    project: NetworkProject,
    input: RemoveDeviceInput
  ): OperationResult<{ updatedProject: NetworkProject; removedLinkIdCount: number }> {
    const exists = project.devices.some((d) => d.id === input.deviceId);
    if (!exists) {
      return {
        success: false,
        error: `Device not found: "${input.deviceId}"`,
      };
    }

    const initialLinkCount = project.links.length;
    const remainingLinks = project.links.filter(
      (link) => link.endpointA.deviceId !== input.deviceId && link.endpointB.deviceId !== input.deviceId
    );

    const updatedProject: NetworkProject = {
      ...project,
      devices: project.devices.filter((d) => d.id !== input.deviceId),
      links: remainingLinks,
    };

    return {
      success: true,
      data: {
        updatedProject,
        removedLinkIdCount: initialLinkCount - remainingLinks.length,
      },
    };
  }

  /**
   * Move device position on canvas.
   */
  static moveDevice(
    project: NetworkProject,
    input: MoveDeviceInput
  ): OperationResult<{ updatedProject: NetworkProject }> {
    const deviceIndex = project.devices.findIndex((d) => d.id === input.deviceId);
    if (deviceIndex === -1) {
      return {
        success: false,
        error: `Device not found: "${input.deviceId}"`,
      };
    }

    const updatedDevices = [...project.devices];
    updatedDevices[deviceIndex] = {
      ...updatedDevices[deviceIndex],
      position: { ...input.position },
    };

    return {
      success: true,
      data: {
        updatedProject: {
          ...project,
          devices: updatedDevices,
        },
      },
    };
  }

  /**
   * Connect two physical device interfaces.
   */
  static connectInterfaces(
    project: NetworkProject,
    input: ConnectInterfacesInput
  ): OperationResult<{ link: NetworkLink; updatedProject: NetworkProject }> {
    // 1. Prevent self-connection
    if (input.deviceA === input.deviceB) {
      return {
        success: false,
        error: 'Cannot connect a device interface to another interface on the same device.',
      };
    }

    // 2. Validate device existence
    const devA = project.devices.find((d) => d.id === input.deviceA);
    const devB = project.devices.find((d) => d.id === input.deviceB);
    if (!devA) return { success: false, error: `Device A not found: ${input.deviceA}` };
    if (!devB) return { success: false, error: `Device B not found: ${input.deviceB}` };

    // 3. Validate interface existence in device types
    const typeA = DeviceRegistry.getById(devA.deviceTypeId);
    const typeB = DeviceRegistry.getById(devB.deviceTypeId);
    if (!typeA) return { success: false, error: `Unknown device type for device ${devA.name}` };
    if (!typeB) return { success: false, error: `Unknown device type for device ${devB.name}` };

    const ifaceA = typeA.interfaces.find((i) => i.id === input.interfaceA);
    const ifaceB = typeB.interfaces.find((i) => i.id === input.interfaceB);
    if (!ifaceA) return { success: false, error: `Interface ${input.interfaceA} does not exist on ${devA.name}` };
    if (!ifaceB) return { success: false, error: `Interface ${input.interfaceB} does not exist on ${devB.name}` };

    // 4. Check if interface is already occupied by a physical link
    const isOccupiedA = project.links.some(
      (link) =>
        (link.endpointA.deviceId === input.deviceA && link.endpointA.interfaceId === input.interfaceA) ||
        (link.endpointB.deviceId === input.deviceA && link.endpointB.interfaceId === input.interfaceA)
    );
    if (isOccupiedA) {
      return {
        success: false,
        error: `Interface ${input.interfaceA} on ${devA.name} is already connected to another cable.`,
      };
    }

    const isOccupiedB = project.links.some(
      (link) =>
        (link.endpointA.deviceId === input.deviceB && link.endpointA.interfaceId === input.interfaceB) ||
        (link.endpointB.deviceId === input.deviceB && link.endpointB.interfaceId === input.interfaceB)
    );
    if (isOccupiedB) {
      return {
        success: false,
        error: `Interface ${input.interfaceB} on ${devB.name} is already connected to another cable.`,
      };
    }

    // 5. Generate deterministic link ID
    const linkId = `link_${input.deviceA}_${input.interfaceA}__${input.deviceB}_${input.interfaceB}`;

    const newLink: NetworkLink = {
      id: linkId,
      endpointA: {
        deviceId: input.deviceA,
        interfaceId: input.interfaceA,
      },
      endpointB: {
        deviceId: input.deviceB,
        interfaceId: input.interfaceB,
      },
    };

    const updatedProject: NetworkProject = {
      ...project,
      links: [...project.links, newLink],
    };

    return {
      success: true,
      data: {
        link: newLink,
        updatedProject,
      },
    };
  }

  /**
   * Disconnect link by link ID.
   */
  static disconnectLink(
    project: NetworkProject,
    input: DisconnectLinkInput
  ): OperationResult<{ updatedProject: NetworkProject }> {
    const exists = project.links.some((l) => l.id === input.linkId);
    if (!exists) {
      return {
        success: false,
        error: `Link not found: "${input.linkId}"`,
      };
    }

    const updatedProject: NetworkProject = {
      ...project,
      links: project.links.filter((l) => l.id !== input.linkId),
    };

    return {
      success: true,
      data: {
        updatedProject,
      },
    };
  }

  /**
   * Rename device.
   */
  static renameDevice(
    project: NetworkProject,
    input: RenameDeviceInput
  ): OperationResult<{ updatedProject: NetworkProject }> {
    const trimmed = input.name.trim();
    if (!trimmed) {
      return {
        success: false,
        error: 'Device name cannot be empty.',
      };
    }

    const dev = project.devices.find((d) => d.id === input.deviceId);
    if (!dev) {
      return {
        success: false,
        error: `Device not found: "${input.deviceId}"`,
      };
    }

    const updatedDevices = project.devices.map((d) =>
      d.id === input.deviceId ? { ...d, name: trimmed } : d
    );

    return {
      success: true,
      data: {
        updatedProject: {
          ...project,
          devices: updatedDevices,
        },
      },
    };
  }
}
