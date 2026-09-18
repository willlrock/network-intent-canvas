import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Router, Network, Wifi, Activity } from 'lucide-react';
import { DeviceRegistry, InterfaceDefinition } from '../device-registry';
import { DeviceInstance, NetworkLink } from '../network-model/types';

export interface DeviceNodeData {
  device: DeviceInstance;
  links: NetworkLink[];
  isSelected: boolean;
  onRename?: (newName: string) => void;
  [key: string]: unknown;
}

export const DeviceNode = memo(function DeviceNode({ data }: { data: DeviceNodeData }) {
  const { device, links, isSelected } = data;
  const deviceType = DeviceRegistry.getById(device.deviceTypeId);

  const getCategoryIcon = () => {
    switch (deviceType?.category) {
      case 'router':
        return <Router className="w-4 h-4 text-emerald-400" />;
      case 'switch':
        return <Network className="w-4 h-4 text-cyan-400" />;
      case 'access-point':
        return <Wifi className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const isPortConnected = (portId: string) => {
    return links.some(
      (l) =>
        (l.endpointA.deviceId === device.id && l.endpointA.interfaceId === portId) ||
        (l.endpointB.deviceId === device.id && l.endpointB.interfaceId === portId)
    );
  };

  const getConnectedNeighbor = (portId: string) => {
    const link = links.find(
      (l) =>
        (l.endpointA.deviceId === device.id && l.endpointA.interfaceId === portId) ||
        (l.endpointB.deviceId === device.id && l.endpointB.interfaceId === portId)
    );
    if (!link) return null;
    return link.endpointA.deviceId === device.id
      ? `${link.endpointB.deviceId}:${link.endpointB.interfaceId}`
      : `${link.endpointA.deviceId}:${link.endpointA.interfaceId}`;
  };

  // Group interfaces into RJ45 and SFP
  const rj45Ports = deviceType?.interfaces.filter((i) => i.media === 'rj45') || [];
  const sfpPorts = deviceType?.interfaces.filter((i) => i.media === 'sfp' || i.media === 'sfp+') || [];

  return (
    <div
      className={`min-w-[260px] rounded-lg bg-slate-900 border shadow-2xl transition-all select-none ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-blue-500/20'
          : 'border-slate-700/80 hover:border-slate-600'
      }`}
    >
      {/* Device Header / Faceplate Top */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/80 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-slate-800/80 border border-slate-700">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100 flex items-center space-x-1.5">
              <span>{device.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {deviceType?.vendor} {deviceType?.model}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <span
            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-medium tracking-wider ${
              deviceType?.category === 'router'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : deviceType?.category === 'switch'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
            }`}
          >
            {deviceType?.category}
          </span>
        </div>
      </div>

      {/* Chassis Body / Ports Area */}
      <div className="p-3 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950 rounded-b-lg">
        {/* If Access Point */}
        {deviceType?.category === 'access-point' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center p-3 rounded bg-slate-950/60 border border-slate-800/60">
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <span className="text-[11px] text-slate-300 font-medium">Wi-Fi 6 AP</span>
                <span className="text-[9px] text-slate-500">2.4G & 5G Radios Active</span>
              </div>
            </div>

            <div className="pt-1">
              <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">PoE Uplink</div>
              {rj45Ports.map((port) => (
                <PortItem
                  key={port.id}
                  port={port}
                  connected={isPortConnected(port.id)}
                  neighbor={getConnectedNeighbor(port.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* If Switch or Router */}
        {deviceType?.category !== 'access-point' && (
          <>
            {/* RJ45 Ports Section */}
            {rj45Ports.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400 font-mono">
                  <span>COPPER PORTS ({rj45Ports.length})</span>
                  <span className="text-[9px] text-slate-500">10/100/1000M</span>
                </div>

                {/* For 24-port switches: 2 rows of 12 */}
                {rj45Ports.length >= 24 ? (
                  <div className="grid grid-cols-12 gap-1 p-1.5 bg-slate-950/70 rounded border border-slate-800">
                    {rj45Ports.map((port, idx) => (
                      <CompactPortItem
                        key={port.id}
                        port={port}
                        label={`${idx + 1}`}
                        connected={isPortConnected(port.id)}
                        neighbor={getConnectedNeighbor(port.id)}
                      />
                    ))}
                  </div>
                ) : (
                  /* For Routers with 8 ports: grid of 4x2 */
                  <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-slate-950/70 rounded border border-slate-800">
                    {rj45Ports.map((port, idx) => (
                      <CompactPortItem
                        key={port.id}
                        port={port}
                        label={`e${idx + 1}`}
                        connected={isPortConnected(port.id)}
                        neighbor={getConnectedNeighbor(port.id)}
                        highlightSpeed={port.maxSpeedMbps >= 2500}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SFP+ Ports Section */}
            {sfpPorts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1 text-[10px] text-amber-300/80 font-mono">
                  <span>SFP+ CAGES (10Gbps)</span>
                </div>
                <div className="flex space-x-2 p-1.5 bg-slate-950/70 rounded border border-amber-900/30">
                  {sfpPorts.map((port) => (
                    <SfpPortItem
                      key={port.id}
                      port={port}
                      connected={isPortConnected(port.id)}
                      neighbor={getConnectedNeighbor(port.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

// Single RJ45 Port item for AP or single view
function PortItem({
  port,
  connected,
  neighbor,
}: {
  port: InterfaceDefinition;
  connected: boolean;
  neighbor: string | null;
}) {
  return (
    <div className="relative flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800 text-xs">
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-700'
          }`}
        />
        <span className="font-mono text-[11px] text-slate-200">{port.name}</span>
      </div>
      <div className="text-[10px] font-mono text-slate-400">
        {connected ? (
          <span className="text-emerald-400 font-semibold">{neighbor}</span>
        ) : (
          <span>Unconnected</span>
        )}
      </div>

      {/* React Flow Connection Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={port.id}
        className={`!w-3 !h-3 !border-2 !border-slate-900 transition-transform hover:scale-125 ${
          connected ? '!bg-emerald-500' : '!bg-blue-400'
        }`}
        title={`Connect ${port.name}`}
      />
    </div>
  );
}

// Compact square port for switches and routers
function CompactPortItem({
  port,
  label,
  connected,
  neighbor,
  highlightSpeed,
}: {
  port: InterfaceDefinition;
  label: string;
  connected: boolean;
  neighbor: string | null;
  highlightSpeed?: boolean;
}) {
  return (
    <div
      className={`relative group flex flex-col items-center justify-center p-1 rounded border transition-colors ${
        connected
          ? 'bg-emerald-950/40 border-emerald-700/60'
          : highlightSpeed
          ? 'bg-blue-950/30 border-blue-700/50'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
      }`}
      title={`${port.name} (${port.media.toUpperCase()} ${port.maxSpeedMbps}Mbps)${
        neighbor ? ` -> connected to ${neighbor}` : ' [Available]'
      }`}
    >
      {/* LED */}
      <div
        className={`w-1.5 h-1.5 rounded-full mb-0.5 ${
          connected ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-slate-700'
        }`}
      />
      <span className="text-[9px] font-mono font-medium text-slate-300 leading-none">{label}</span>

      {/* Floating Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={port.id}
        className={`!w-2.5 !h-2.5 !border !border-slate-900 !-bottom-1 transition-transform hover:scale-150 ${
          connected ? '!bg-emerald-400' : '!bg-cyan-400'
        }`}
        title={`Port ${port.name}`}
      />
    </div>
  );
}

// SFP+ Port cage styling
function SfpPortItem({
  port,
  connected,
  neighbor,
}: {
  port: InterfaceDefinition;
  connected: boolean;
  neighbor: string | null;
}) {
  return (
    <div
      className={`relative group flex items-center space-x-2 flex-1 p-1.5 rounded border transition-colors ${
        connected
          ? 'bg-amber-950/40 border-amber-600'
          : 'bg-slate-900/80 border-amber-900/50 hover:border-amber-700'
      }`}
      title={`${port.name} (SFP+ 10Gbps)${neighbor ? ` -> connected to ${neighbor}` : ' [Available]'}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-700'
        }`}
      />
      <div className="flex flex-col">
        <span className="text-[9px] font-mono text-amber-300/90 font-medium">{port.name}</span>
        <span className="text-[8px] text-slate-400 font-mono">{connected ? 'LINK UP' : '10G CAGE'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id={port.id}
        className={`!w-2.5 !h-2.5 !border !border-slate-900 !-bottom-1 transition-transform hover:scale-150 ${
          connected ? '!bg-amber-400' : '!bg-amber-500'
        }`}
        title={`SFP+ Port ${port.name}`}
      />
    </div>
  );
}
