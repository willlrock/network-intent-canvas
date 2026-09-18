import { useEffect, useMemo, useState } from 'react';
import { Cable, X } from 'lucide-react';
import { CableRegistry } from '../cable-registry';
import { DeviceRegistry, InterfaceDefinition } from '../device-registry';
import { NetworkProject } from '../network-model/types';

interface Props {
  project: NetworkProject;
  sourceDeviceId: string;
  targetDeviceId: string;
  onCancel: () => void;
  onConfirm: (sourceInterface: string, targetInterface: string, cableTypeId: string) => boolean;
}

function isOccupied(project: NetworkProject, deviceId: string, interfaceId: string): boolean {
  return project.links.some(
    (link) =>
      (link.endpointA.deviceId === deviceId && link.endpointA.interfaceId === interfaceId) ||
      (link.endpointB.deviceId === deviceId && link.endpointB.interfaceId === interfaceId)
  );
}

export function ConnectionDialog({
  project,
  sourceDeviceId,
  targetDeviceId,
  onCancel,
  onConfirm,
}: Props) {
  const sourceDevice = project.devices.find((d) => d.id === sourceDeviceId);
  const targetDevice = project.devices.find((d) => d.id === targetDeviceId);
  const sourceType = sourceDevice ? DeviceRegistry.getById(sourceDevice.deviceTypeId) : undefined;
  const targetType = targetDevice ? DeviceRegistry.getById(targetDevice.deviceTypeId) : undefined;

  const [cableTypeId, setCableTypeId] = useState('ethernet-copper');
  const cableType = CableRegistry.getById(cableTypeId);
  const [sourceInterface, setSourceInterface] = useState('');
  const [targetInterface, setTargetInterface] = useState('');

  const available = (deviceId: string, interfaces: InterfaceDefinition[]) =>
    interfaces.filter(
      (iface) =>
        !isOccupied(project, deviceId, iface.id) &&
        (!!cableType && CableRegistry.supportsMedia(cableType, iface.media))
    );

  const sourcePorts = useMemo(
    () => (sourceType ? available(sourceDeviceId, sourceType.interfaces) : []),
    [project.links, sourceType, sourceDeviceId, cableTypeId]
  );

  const targetPorts = useMemo(
    () => (targetType ? available(targetDeviceId, targetType.interfaces) : []),
    [project.links, targetType, targetDeviceId, cableTypeId]
  );

  useEffect(() => {
    setSourceInterface(sourcePorts[0]?.id || '');
    setTargetInterface(targetPorts[0]?.id || '');
  }, [cableTypeId, sourceDeviceId, targetDeviceId, sourcePorts, targetPorts]);

  if (!sourceDevice || !targetDevice || !sourceType || !targetType) return null;

  const sourcePort = sourceType.interfaces.find((i) => i.id === sourceInterface);
  const targetPort = targetType.interfaces.find((i) => i.id === targetInterface);

  const pairCompatible =
    !!sourcePort &&
    !!targetPort &&
    CableRegistry.isCompatible(cableTypeId, sourcePort.media, targetPort.media);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Cable className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Create physical connection</div>
              <div className="text-[11px] text-slate-500">Choose exact ports and cable type.</div>
            </div>
          </div>
          <button onClick={onCancel} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <label className="block text-xs font-medium text-slate-700">
            Cable
            <select
              value={cableTypeId}
              onChange={(e) => setCableTypeId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              {CableRegistry.getAll().map((cable) => (
                <option value={cable.id} key={cable.id}>
                  {cable.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-slate-700">
              {sourceDevice.name}
              <span className="ml-1 font-normal text-slate-400">({sourceType.model})</span>
              <select
                value={sourceInterface}
                onChange={(e) => setSourceInterface(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 font-mono text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                {sourcePorts.length === 0 && <option value="">No compatible free ports</option>}
                {sourcePorts.map((port) => (
                  <option value={port.id} key={port.id}>
                    {port.name} · {port.media.toUpperCase()} · {port.maxSpeedMbps}M
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-slate-700">
              {targetDevice.name}
              <span className="ml-1 font-normal text-slate-400">({targetType.model})</span>
              <select
                value={targetInterface}
                onChange={(e) => setTargetInterface(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 font-mono text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                {targetPorts.length === 0 && <option value="">No compatible free ports</option>}
                {targetPorts.map((port) => (
                  <option value={port.id} key={port.id}>
                    {port.name} · {port.media.toUpperCase()} · {port.maxSpeedMbps}M
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            {cableType?.description}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            disabled={!pairCompatible}
            onClick={() => {
              if (pairCompatible) onConfirm(sourceInterface, targetInterface, cableTypeId);
            }}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
