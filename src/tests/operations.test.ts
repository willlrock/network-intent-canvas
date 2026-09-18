import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkStore } from '../operations/store';

describe('Structured Operations API', () => {
  let store: NetworkStore;

  beforeEach(() => {
    store = new NetworkStore({
      schemaVersion: 1,
      name: 'Test Topology',
      devices: [],
      links: [],
    });
  });

  it('adds devices with deterministic naming and coordinates', () => {
    const res1 = store.addDevice({
      deviceTypeId: 'mikrotik-rb5009',
      position: { x: 100, y: 150 },
    });

    expect(res1.success).toBe(true);
    expect(res1.data?.device.name).toBe('RB5009-01');
    expect(res1.data?.device.position).toEqual({ x: 100, y: 150 });

    const res2 = store.addDevice({
      deviceTypeId: 'mikrotik-rb5009',
      position: { x: 300, y: 150 },
    });

    expect(res2.success).toBe(true);
    expect(res2.data?.device.name).toBe('RB5009-02');

    const res3 = store.addDevice({
      deviceTypeId: 'mikrotik-crs326',
      position: { x: 500, y: 150 },
    });
    expect(res3.data?.device.name).toBe('CRS326-01');

    const res4 = store.addDevice({
      deviceTypeId: 'ubiquiti-u6-pro',
      position: { x: 700, y: 150 },
    });
    expect(res4.data?.device.name).toBe('U6PRO-01');
  });

  it('rejects adding devices with unknown device type', () => {
    const res = store.addDevice({
      deviceTypeId: 'nonexistent-model',
      position: { x: 0, y: 0 },
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Unknown DeviceType ID');
    expect(store.getState().project.devices).toHaveLength(0);
  });

  it('moves a device to new coordinates', () => {
    const addRes = store.addDevice({
      deviceTypeId: 'mikrotik-rb5009',
      position: { x: 10, y: 20 },
    });
    const deviceId = addRes.data!.device.id;

    const moveRes = store.moveDevice({
      deviceId,
      position: { x: 250, y: 350 },
    });

    expect(moveRes.success).toBe(true);
    const movedDev = store.getState().project.devices.find((d) => d.id === deviceId);
    expect(movedDev?.position).toEqual({ x: 250, y: 350 });
  });

  it('connects physical interfaces between two devices', () => {
    const devA = store.addDevice({ deviceTypeId: 'mikrotik-rb5009', position: { x: 0, y: 0 } }).data!.device;
    const devB = store.addDevice({ deviceTypeId: 'mikrotik-crs326', position: { x: 100, y: 100 } }).data!.device;

    const connRes = store.connectInterfaces({
      deviceA: devA.id,
      interfaceA: 'ether1',
      deviceB: devB.id,
      interfaceB: 'ether1',
    });

    expect(connRes.success).toBe(true);
    expect(store.getState().project.links).toHaveLength(1);
    const link = store.getState().project.links[0];
    expect(link.endpointA).toEqual({ deviceId: devA.id, interfaceId: 'ether1' });
    expect(link.endpointB).toEqual({ deviceId: devB.id, interfaceId: 'ether1' });
  });

  it('prevents connecting an interface that is already occupied', () => {
    const devA = store.addDevice({ deviceTypeId: 'mikrotik-rb5009', position: { x: 0, y: 0 } }).data!.device;
    const devB = store.addDevice({ deviceTypeId: 'mikrotik-crs326', position: { x: 100, y: 100 } }).data!.device;
    const devC = store.addDevice({ deviceTypeId: 'ubiquiti-u6-pro', position: { x: 200, y: 200 } }).data!.device;

    // Link 1: devA.ether1 <-> devB.ether1
    store.connectInterfaces({
      deviceA: devA.id,
      interfaceA: 'ether1',
      deviceB: devB.id,
      interfaceB: 'ether1',
    });

    // Attempt Link 2: devC.eth0 <-> devA.ether1 (already in use!)
    const connRes2 = store.connectInterfaces({
      deviceA: devC.id,
      interfaceA: 'eth0',
      deviceB: devA.id,
      interfaceB: 'ether1',
    });

    expect(connRes2.success).toBe(false);
    expect(connRes2.error).toContain('already connected to another cable');
    expect(store.getState().project.links).toHaveLength(1);
  });

  it('prevents connecting a device to itself', () => {
    const devA = store.addDevice({ deviceTypeId: 'mikrotik-rb5009', position: { x: 0, y: 0 } }).data!.device;

    const res = store.connectInterfaces({
      deviceA: devA.id,
      interfaceA: 'ether1',
      deviceB: devA.id,
      interfaceB: 'ether2',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Cannot connect a device interface to another interface on the same device');
  });

  it('disconnects a link', () => {
    const devA = store.addDevice({ deviceTypeId: 'mikrotik-rb5009', position: { x: 0, y: 0 } }).data!.device;
    const devB = store.addDevice({ deviceTypeId: 'mikrotik-crs326', position: { x: 100, y: 100 } }).data!.device;

    const link = store.connectInterfaces({
      deviceA: devA.id,
      interfaceA: 'ether1',
      deviceB: devB.id,
      interfaceB: 'ether1',
    }).data!.link;

    expect(store.getState().project.links).toHaveLength(1);

    const discRes = store.disconnectLink({ linkId: link.id });
    expect(discRes.success).toBe(true);
    expect(store.getState().project.links).toHaveLength(0);
  });

  it('removes a device and automatically cascades removal of all attached links', () => {
    const devA = store.addDevice({ deviceTypeId: 'mikrotik-rb5009', position: { x: 0, y: 0 } }).data!.device;
    const devB = store.addDevice({ deviceTypeId: 'mikrotik-crs326', position: { x: 100, y: 100 } }).data!.device;

    store.connectInterfaces({
      deviceA: devA.id,
      interfaceA: 'ether1',
      deviceB: devB.id,
      interfaceB: 'ether1',
    });

    expect(store.getState().project.links).toHaveLength(1);

    const removeRes = store.removeDevice({ deviceId: devA.id });
    expect(removeRes.success).toBe(true);
    expect(store.getState().project.devices).toHaveLength(1);
    expect(store.getState().project.links).toHaveLength(0); // Link cleanly removed!
  });

  it('renames a device', () => {
    const devA = store.addDevice({ deviceTypeId: 'mikrotik-rb5009', position: { x: 0, y: 0 } }).data!.device;
    expect(devA.name).toBe('RB5009-01');

    const renameRes = store.renameDevice({
      deviceId: devA.id,
      name: 'Core-Router-Edge',
    });

    expect(renameRes.success).toBe(true);
    expect(store.getState().project.devices.find((d) => d.id === devA.id)?.name).toBe('Core-Router-Edge');
  });

  it('records structured operation audit entries in operationLog', () => {
    store.addDevice({ deviceTypeId: 'mikrotik-rb5009', position: { x: 0, y: 0 } });
    const log = store.getState().operationLog;
    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[0].type).toBe('ADD_DEVICE');
    expect(log[0].success).toBe(true);
  });
});
