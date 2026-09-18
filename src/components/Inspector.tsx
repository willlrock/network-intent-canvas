import { useEffect, useState } from 'react';
import { Cable, Check, Edit2, Sliders, Trash2, X } from 'lucide-react';
import { useNetworkStore } from '../operations/useNetworkStore';
import { DeviceRegistry } from '../device-registry';
import { CableRegistry } from '../cable-registry';

export function Inspector() {
  const { project, selectedDeviceId, selectedLinkId, store } = useNetworkStore();
  const selectedDevice = project.devices.find((d) => d.id === selectedDeviceId);
  const selectedLink = project.links.find((l) => l.id === selectedLinkId);
  const deviceType = selectedDevice ? DeviceRegistry.getById(selectedDevice.deviceTypeId) : undefined;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    setName(selectedDevice?.name || '');
    setEditing(false);
  }, [selectedDevice?.id]);

  const saveName = () => {
    if (selectedDevice && name.trim()) {
      store.renameDevice({ deviceId: selectedDevice.id, name: name.trim() });
    }
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 px-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Inspector</span>
        </div>
        {(selectedDevice || selectedLink) && (
          <button
            onClick={() => {
              if (selectedDevice) store.removeDevice({ deviceId: selectedDevice.id });
              if (selectedLink) store.disconnectLink({ linkId: selectedLink.id });
            }}
            className="rounded p-1 text-slate-500 hover:bg-rose-950 hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {selectedDevice && deviceType && (
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Device</div>
              {editing ? (
                <div className="flex gap-1">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') setEditing(false);
                    }}
                    autoFocus
                    className="min-w-0 flex-1 rounded border border-blue-500 bg-slate-950 px-2 py-1 text-sm outline-none"
                  />
                  <button onClick={saveName} className="rounded p-1 text-emerald-400 hover:bg-slate-800">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditing(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">{selectedDevice.name}</div>
                  <button onClick={() => setEditing(true)} className="rounded p-1 text-slate-500 hover:text-slate-300">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="mt-2 space-y-1 border-t border-slate-800 pt-2 font-mono text-[10px]">
                <Row label="Vendor" value={deviceType.vendor} />
                <Row label="Model" value={deviceType.model} />
                <Row label="Category" value={deviceType.category} />
                <Row label="OS family" value={deviceType.capabilities.osFamily || '—'} />
              </div>
            </section>

            <section>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                Physical interfaces ({deviceType.interfaces.length})
              </div>
              <div className="space-y-1.5">
                {deviceType.interfaces.map((iface) => {
                  const link = project.links.find(
                    (candidate) =>
                      (candidate.endpointA.deviceId === selectedDevice.id &&
                        candidate.endpointA.interfaceId === iface.id) ||
                      (candidate.endpointB.deviceId === selectedDevice.id &&
                        candidate.endpointB.interfaceId === iface.id)
                  );
                  const remote = link
                    ? link.endpointA.deviceId === selectedDevice.id
                      ? link.endpointB
                      : link.endpointA
                    : undefined;
                  const remoteDevice = remote
                    ? project.devices.find((d) => d.id === remote.deviceId)
                    : undefined;
                  const cable = link
                    ? CableRegistry.getById(link.cableTypeId || 'ethernet-copper')
                    : undefined;

                  return (
                    <div
                      key={iface.id}
                      className="rounded border border-slate-800 bg-slate-900/70 px-2.5 py-2 font-mono text-[10px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-200">{iface.id}</div>
                          <div className="text-slate-500">
                            {iface.media.toUpperCase()} · {iface.maxSpeedMbps}M
                          </div>
                        </div>
                        {remote ? (
                          <div className="max-w-[150px] text-right">
                            <div className="truncate text-emerald-400">
                              → {remoteDevice?.name || remote.deviceId}:{remote.interfaceId}
                            </div>
                            <div className="text-slate-500">{cable?.shortName || 'Cable'}</div>
                          </div>
                        ) : (
                          <div className="text-slate-600">free</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {selectedLink && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Cable className="h-4 w-4 text-blue-400" />
              Physical connection
            </div>
            <div className="mt-3 space-y-2 font-mono text-[10px]">
              <Row
                label="Cable"
                value={CableRegistry.getById(selectedLink.cableTypeId || 'ethernet-copper')?.name || 'Unknown'}
              />
              <Row
                label="A"
                value={
                  (project.devices.find((d) => d.id === selectedLink.endpointA.deviceId)?.name ||
                    selectedLink.endpointA.deviceId) +
                  ':' +
                  selectedLink.endpointA.interfaceId
                }
              />
              <Row
                label="B"
                value={
                  (project.devices.find((d) => d.id === selectedLink.endpointB.deviceId)?.name ||
                    selectedLink.endpointB.deviceId) +
                  ':' +
                  selectedLink.endpointB.interfaceId
                }
              />
            </div>
          </div>
        )}

        {!selectedDevice && !selectedLink && (
          <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
            Select a device to inspect its deterministic hardware ports, or select a cable to inspect both endpoints.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="break-all text-right text-slate-300">{value}</span>
    </div>
  );
}
