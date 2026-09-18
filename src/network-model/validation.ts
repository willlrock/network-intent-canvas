import { DeviceRegistry } from '../device-registry';
import { NetworkProject, ValidationIssue } from './types';

export function validateNetworkProject(project: NetworkProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const deviceMap = new Map<string, { instance: typeof project.devices[0]; typeDef: ReturnType<typeof DeviceRegistry.getById> }>();
  const seenDeviceIds = new Set<string>();

  // 1. Validate Devices
  for (const device of project.devices) {
    if (seenDeviceIds.has(device.id)) {
      issues.push({
        id: `dup-device-${device.id}`,
        severity: 'error',
        message: `Duplicate device ID: ${device.id}`,
        deviceId: device.id,
      });
    }
    seenDeviceIds.add(device.id);

    const typeDef = DeviceRegistry.getById(device.deviceTypeId);
    if (!typeDef) {
      issues.push({
        id: `unknown-type-${device.id}`,
        severity: 'error',
        message: `Device "${device.name}" references unknown DeviceType "${device.deviceTypeId}"`,
        deviceId: device.id,
      });
    } else {
      deviceMap.set(device.id, { instance: device, typeDef });
    }
  }

  // 2. Validate Links and Ports
  // Map of "deviceId:interfaceId" -> linkId
  const occupiedPorts = new Map<string, string>();
  const seenLinkPairs = new Set<string>();

  for (const link of project.links) {
    const devA = deviceMap.get(link.endpointA.deviceId);
    const devB = deviceMap.get(link.endpointB.deviceId);

    // Endpoint A device existence
    if (!devA) {
      issues.push({
        id: `missing-dev-a-${link.id}`,
        severity: 'error',
        message: `Link endpoint A references nonexistent device: ${link.endpointA.deviceId}`,
        linkId: link.id,
      });
      continue;
    }

    // Endpoint B device existence
    if (!devB) {
      issues.push({
        id: `missing-dev-b-${link.id}`,
        severity: 'error',
        message: `Link endpoint B references nonexistent device: ${link.endpointB.deviceId}`,
        linkId: link.id,
      });
      continue;
    }

    // Self connection
    if (link.endpointA.deviceId === link.endpointB.deviceId) {
      issues.push({
        id: `self-link-${link.id}`,
        severity: 'error',
        message: `Cannot connect device "${devA.instance.name}" to itself`,
        linkId: link.id,
        deviceId: link.endpointA.deviceId,
      });
    }

    // Interface validity
    const ifaceA = devA.typeDef?.interfaces.find((i) => i.id === link.endpointA.interfaceId);
    if (!ifaceA) {
      issues.push({
        id: `invalid-iface-a-${link.id}`,
        severity: 'error',
        message: `Device "${devA.instance.name}" has no interface "${link.endpointA.interfaceId}"`,
        linkId: link.id,
        deviceId: link.endpointA.deviceId,
        interfaceId: link.endpointA.interfaceId,
      });
    }

    const ifaceB = devB.typeDef?.interfaces.find((i) => i.id === link.endpointB.interfaceId);
    if (!ifaceB) {
      issues.push({
        id: `invalid-iface-b-${link.id}`,
        severity: 'error',
        message: `Device "${devB.instance.name}" has no interface "${link.endpointB.interfaceId}"`,
        linkId: link.id,
        deviceId: link.endpointB.deviceId,
        interfaceId: link.endpointB.interfaceId,
      });
    }

    // Check port already occupied
    const keyA = `${link.endpointA.deviceId}:${link.endpointA.interfaceId}`;
    const keyB = `${link.endpointB.deviceId}:${link.endpointB.interfaceId}`;

    if (occupiedPorts.has(keyA)) {
      issues.push({
        id: `port-conflict-a-${link.id}`,
        severity: 'error',
        message: `Interface ${devA.instance.name}:${link.endpointA.interfaceId} is already connected to another link`,
        linkId: link.id,
        deviceId: link.endpointA.deviceId,
        interfaceId: link.endpointA.interfaceId,
      });
    } else {
      occupiedPorts.set(keyA, link.id);
    }

    if (occupiedPorts.has(keyB)) {
      issues.push({
        id: `port-conflict-b-${link.id}`,
        severity: 'error',
        message: `Interface ${devB.instance.name}:${link.endpointB.interfaceId} is already connected to another link`,
        linkId: link.id,
        deviceId: link.endpointB.deviceId,
        interfaceId: link.endpointB.interfaceId,
      });
    } else {
      occupiedPorts.set(keyB, link.id);
    }

    // Check duplicate links between same ports
    const orderedPair = [keyA, keyB].sort().join('<-->');
    if (seenLinkPairs.has(orderedPair)) {
      issues.push({
        id: `dup-link-${link.id}`,
        severity: 'error',
        message: `Duplicate link between ${orderedPair}`,
        linkId: link.id,
      });
    }
    seenLinkPairs.add(orderedPair);

    // Media type compatibility warning
    if (ifaceA && ifaceB) {
      const isSfpA = ifaceA.media === 'sfp' || ifaceA.media === 'sfp+';
      const isSfpB = ifaceB.media === 'sfp' || ifaceB.media === 'sfp+';
      if ((isSfpA && ifaceB.media === 'rj45') || (ifaceA.media === 'rj45' && isSfpB)) {
        issues.push({
          id: `media-mismatch-${link.id}`,
          severity: 'warning',
          message: `Direct link between ${ifaceA.media.toUpperCase()} (${devA.instance.name}:${ifaceA.name}) and ${ifaceB.media.toUpperCase()} (${devB.instance.name}:${ifaceB.name}) requires media converter or copper SFP transceiver.`,
          linkId: link.id,
        });
      }
    }
  }

  return issues;
}
