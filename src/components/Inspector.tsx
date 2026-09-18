import { useState, useEffect } from 'react';
import {
  Server,
  Cable,
  Trash2,
  Edit2,
  Check,
  X,
  CheckCircle2,
  Radio,
  Sliders,
} from 'lucide-react';
import { useNetworkStore } from '../operations/useNetworkStore';
import { DeviceRegistry } from '../device-registry';

export function Inspector() {
  const { project, selectedDeviceId, selectedLinkId, store } = useNetworkStore();

  const selectedDevice = project.devices.find((d) => d.id === selectedDeviceId);
  const selectedLink = project.links.find((l) => l.id === selectedLinkId);
  const deviceType = selectedDevice ? DeviceRegistry.getById(selectedDevice.deviceTypeId) : null;

  // Inline editing state for device name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    if (selectedDevice) {
      setEditedName(selectedDevice.name);
      setIsEditingName(false);
    }
  }, [selectedDevice?.id]);

  const handleSaveName = () => {
    if (selectedDevice && editedName.trim() && editedName !== selectedDevice.name) {
      store.renameDevice({
        deviceId: selectedDevice.id,
        name: editedName.trim(),
      });
    }
    setIsEditingName(false);
  };

  const handleDeleteDevice = () => {
    if (selectedDevice && confirm(`Delete device "${selectedDevice.name}" and all attached links?`)) {
      store.removeDevice({ deviceId: selectedDevice.id });
    }
  };

  const handleDisconnectLink = () => {
    if (selectedLink) {
      store.disconnectLink({ linkId: selectedLink.id });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800 select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Inspector
          </h2>
        </div>
        {selectedDevice && (
          <button
            onClick={handleDeleteDevice}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
            title="Delete device"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {selectedLink && (
          <button
            onClick={handleDisconnectLink}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
            title="Disconnect cable"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* Case 1: Device Selected */}
        {selectedDevice && deviceType && (
          <div className="space-y-4">
            {/* Device Identity */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-mono text-slate-500">Device Identity</div>

              {/* Name field with inline rename */}
              <div className="flex items-center justify-between">
                {isEditingName ? (
                  <div className="flex items-center space-x-1.5 w-full">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      autoFocus
                      className="bg-slate-950 border border-blue-500 rounded px-2 py-0.5 text-xs text-slate-100 font-semibold w-full focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 text-emerald-400 hover:bg-emerald-950/50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-100 text-sm">{selectedDevice.name}</span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded"
                      title="Rename device"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Spec details */}
              <div className="space-y-1 pt-1 text-[11px] font-mono border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="text-slate-300">{deviceType.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor:</span>
                  <span className="text-slate-300">{deviceType.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="text-slate-300 capitalize">{deviceType.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Instance ID:</span>
                  <span className="text-slate-400 text-[10px]">{selectedDevice.id}</span>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-mono text-slate-500">Capabilities</div>
              <div className="space-y-1.5 text-[11px]">
                {deviceType.capabilities.osFamily && (
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">OS Family:</span>
                    <span className="text-blue-400 font-semibold">{deviceType.capabilities.osFamily}</span>
                  </div>
                )}
                {deviceType.capabilities.routing && (
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>L3 Routing Engine</span>
                  </div>
                )}
                {deviceType.capabilities.switching && (
                  <div className="flex items-center space-x-1.5 text-cyan-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Hardware Offloaded Switching</span>
                  </div>
                )}
                {deviceType.capabilities.wifi && (
                  <div className="flex items-center space-x-1.5 text-purple-400">
                    <Radio className="w-3 h-3" />
                    <span>{deviceType.capabilities.wifi} Wireless AP</span>
                  </div>
                )}
                {deviceType.capabilities.radios && (
                  <div className="pl-4 space-y-0.5 text-[10px] text-slate-400 font-mono">
                    {deviceType.capabilities.radios.map((r, i) => (
                      <div key={i}>• {r}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Interface Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-mono text-slate-500">
                  Interfaces ({deviceType.interfaces.length})
                </div>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {deviceType.interfaces.map((iface) => {
                  const link = project.links.find(
                    (l) =>
                      (l.endpointA.deviceId === selectedDevice.id && l.endpointA.interfaceId === iface.id) ||
                      (l.endpointB.deviceId === selectedDevice.id && l.endpointB.interfaceId === iface.id)
                  );
                  const isConnected = !!link;
                  const remoteEndpoint = link
                    ? link.endpointA.deviceId === selectedDevice.id
                      ? `${link.endpointB.deviceId} (${link.endpointB.interfaceId})`
                      : `${link.endpointA.deviceId} (${link.endpointA.interfaceId})`
                    : null;

                  return (
                    <div
                      key={iface.id}
                      className="p-2 bg-slate-900/60 rounded border border-slate-800/80 flex items-center justify-between text-[11px] font-mono"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-700'
                          }`}
                        />
                        <div>
                          <div className="text-slate-200 font-semibold">{iface.id}</div>
                          <div className="text-[9px] text-slate-500 uppercase">
                            {iface.media} • {iface.maxSpeedMbps}M
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isConnected ? (
                          <div className="text-[10px] text-emerald-400 max-w-[110px] truncate" title={remoteEndpoint!}>
                            {remoteEndpoint}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">Disconnected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Case 2: Link Selected */}
        {selectedLink && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center space-x-1.5 text-cyan-400">
                <Cable className="w-4 h-4" />
                <span className="font-bold text-slate-100">Physical Link</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 break-all">
                ID: {selectedLink.id}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                {/* Endpoint A */}
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-[9px] uppercase text-slate-500 mb-1">Endpoint A</div>
                  <div className="text-slate-200 font-semibold">
                    {project.devices.find((d) => d.id === selectedLink.endpointA.deviceId)?.name ||
                      selectedLink.endpointA.deviceId}
                  </div>
                  <div className="text-cyan-400 text-[10px]">
                    Port: {selectedLink.endpointA.interfaceId}
                  </div>
                </div>

                {/* Endpoint B */}
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-[9px] uppercase text-slate-500 mb-1">Endpoint B</div>
                  <div className="text-slate-200 font-semibold">
                    {project.devices.find((d) => d.id === selectedLink.endpointB.deviceId)?.name ||
                      selectedLink.endpointB.deviceId}
                  </div>
                  <div className="text-cyan-400 text-[10px]">
                    Port: {selectedLink.endpointB.interfaceId}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDisconnectLink}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60 transition-colors text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect Cable</span>
              </button>
            </div>
          </div>
        )}

        {/* Case 3: Empty State / Project Overview */}
        {!selectedDevice && !selectedLink && (
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Server className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-200">No Selection</div>
              <p className="text-[11px] text-slate-500">
                Click on any device or link on the canvas to inspect its configuration and ports.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-left space-y-1.5 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Devices in project:</span>
                <span className="text-slate-200 font-bold">{project.devices.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Cables connected:</span>
                <span className="text-slate-200 font-bold">{project.links.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
