import { describe, it, expect } from 'vitest';
import { parseAndValidateProjectJSON } from '../persistence/export-import';
import { NetworkProject } from '../network-model/types';

describe('Persistence and JSON Serialization', () => {
  it('successfully parses and validates a valid project JSON', () => {
    const validProject: NetworkProject = {
      schemaVersion: 1,
      name: 'Datacenter Spines',
      devices: [
        { id: 'dev-1', deviceTypeId: 'mikrotik-crs326', name: 'SW-01', position: { x: 100, y: 200 } },
      ],
      links: [],
    };

    const json = JSON.stringify(validProject);
    const result = parseAndValidateProjectJSON(json);

    expect(result.success).toBe(true);
    expect(result.project?.name).toBe('Datacenter Spines');
    expect(result.project?.devices).toHaveLength(1);
  });

  it('rejects malformed JSON syntax gracefully', () => {
    const malformed = '{ schemaVersion: 1, name: "Broken" ';
    const result = parseAndValidateProjectJSON(malformed);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to parse JSON');
  });

  it('rejects projects with unsupported schemaVersion', () => {
    const futureProject = {
      schemaVersion: 999, // Incompatible
      name: 'Future Project',
      devices: [],
      links: [],
    };

    const result = parseAndValidateProjectJSON(JSON.stringify(futureProject));
    expect(result.success).toBe(false);
    expect(result.error).toContain('schemaVersion');
  });

  it('rejects projects with missing required fields', () => {
    const incomplete = {
      schemaVersion: 1,
      name: 'Missing Devices',
      // devices missing!
      links: [],
    };

    const result = parseAndValidateProjectJSON(JSON.stringify(incomplete));
    expect(result.success).toBe(false);
    expect(result.error).toContain('devices');
  });

  it('rejects invalid link endpoint structures', () => {
    const badLinks = {
      schemaVersion: 1,
      name: 'Bad Link Project',
      devices: [
        { id: 'd1', deviceTypeId: 'mikrotik-rb5009', name: 'RB-01', position: { x: 0, y: 0 } },
      ],
      links: [
        {
          id: 'l1',
          endpointA: { deviceId: 'd1' }, // interfaceId missing!
          endpointB: { deviceId: 'd2', interfaceId: 'ether1' },
        },
      ],
    };

    const result = parseAndValidateProjectJSON(JSON.stringify(badLinks));
    expect(result.success).toBe(false);
    expect(result.error).toContain('endpointA.interfaceId');
  });
});
