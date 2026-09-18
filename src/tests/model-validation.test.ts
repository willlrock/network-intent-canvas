import { describe, it, expect } from 'vitest';
import { validateNetworkProject } from '../network-model/validation';
import { NetworkProject } from '../network-model/types';

describe('Network Model Deterministic Validation', () => {
  it('validates a correct topology with no issues', () => {
    const project: NetworkProject = {
      schemaVersion: 1,
      name: 'Valid Project',
      devices: [
        { id: 'r1', deviceTypeId: 'mikrotik-rb5009', name: 'RB5009-01', position: { x: 0, y: 0 } },
        { id: 'sw1', deviceTypeId: 'mikrotik-crs326', name: 'CRS326-01', position: { x: 200, y: 200 } },
      ],
      links: [
        {
          id: 'l1',
          endpointA: { deviceId: 'r1', interfaceId: 'ether1' },
          endpointB: { deviceId: 'sw1', interfaceId: 'ether1' },
        },
      ],
    };

    const issues = validateNetworkProject(project);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('detects unknown device type ID', () => {
    const project: NetworkProject = {
      schemaVersion: 1,
      name: 'Invalid Device',
      devices: [
        { id: 'd1', deviceTypeId: 'cisco-catalyst-9300', name: 'FakeSwitch', position: { x: 0, y: 0 } },
      ],
      links: [],
    };

    const issues = validateNetworkProject(project);
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('unknown DeviceType'))).toBe(true);
  });

  it('prevents self-connection on the same device', () => {
    const project: NetworkProject = {
      schemaVersion: 1,
      name: 'Loopback Link',
      devices: [
        { id: 'r1', deviceTypeId: 'mikrotik-rb5009', name: 'RB5009-01', position: { x: 0, y: 0 } },
      ],
      links: [
        {
          id: 'loop-link',
          endpointA: { deviceId: 'r1', interfaceId: 'ether1' },
          endpointB: { deviceId: 'r1', interfaceId: 'ether2' },
        },
      ],
    };

    const issues = validateNetworkProject(project);
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Cannot connect device'))).toBe(true);
  });

  it('detects unknown interfaces on supported devices', () => {
    const project: NetworkProject = {
      schemaVersion: 1,
      name: 'Bad Port',
      devices: [
        { id: 'r1', deviceTypeId: 'mikrotik-rb5009', name: 'RB5009-01', position: { x: 0, y: 0 } },
        { id: 'sw1', deviceTypeId: 'mikrotik-crs326', name: 'CRS326-01', position: { x: 200, y: 200 } },
      ],
      links: [
        {
          id: 'l1',
          endpointA: { deviceId: 'r1', interfaceId: 'gigabitethernet0/0/0' }, // Cisco port on MikroTik!
          endpointB: { deviceId: 'sw1', interfaceId: 'ether1' },
        },
      ],
    };

    const issues = validateNetworkProject(project);
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('has no interface'))).toBe(true);
  });

  it('detects when an interface is already connected to another link (port collision)', () => {
    const project: NetworkProject = {
      schemaVersion: 1,
      name: 'Port Conflict',
      devices: [
        { id: 'r1', deviceTypeId: 'mikrotik-rb5009', name: 'RB5009-01', position: { x: 0, y: 0 } },
        { id: 'sw1', deviceTypeId: 'mikrotik-crs326', name: 'CRS326-01', position: { x: 200, y: 200 } },
        { id: 'ap1', deviceTypeId: 'ubiquiti-u6-pro', name: 'U6PRO-01', position: { x: 400, y: 400 } },
      ],
      links: [
        {
          id: 'l1',
          endpointA: { deviceId: 'r1', interfaceId: 'ether1' },
          endpointB: { deviceId: 'sw1', interfaceId: 'ether1' },
        },
        {
          id: 'l2',
          endpointA: { deviceId: 'ap1', interfaceId: 'eth0' },
          endpointB: { deviceId: 'r1', interfaceId: 'ether1' }, // Trying to connect r1:ether1 again!
        },
      ],
    };

    const issues = validateNetworkProject(project);
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('already connected'))).toBe(true);
  });

  it('warns when connecting SFP+ directly to RJ45 without transceiver', () => {
    const project: NetworkProject = {
      schemaVersion: 1,
      name: 'Media Mismatch',
      devices: [
        { id: 'r1', deviceTypeId: 'mikrotik-rb5009', name: 'RB5009-01', position: { x: 0, y: 0 } },
        { id: 'sw1', deviceTypeId: 'mikrotik-crs326', name: 'CRS326-01', position: { x: 200, y: 200 } },
      ],
      links: [
        {
          id: 'l1',
          endpointA: { deviceId: 'r1', interfaceId: 'sfp-sfpplus1' }, // SFP+
          endpointB: { deviceId: 'sw1', interfaceId: 'ether1' }, // RJ45
        },
      ],
    };

    const issues = validateNetworkProject(project);
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('transceiver'))).toBe(true);
  });
});
