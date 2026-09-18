import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { DeviceRegistry } from '../device-registry';
import { DeviceInstance, NetworkLink } from '../network-model/types';
import { DeviceSymbol } from './DeviceSymbol';

export interface DeviceNodeData {
  device: DeviceInstance;
  links: NetworkLink[];
  isSelected: boolean;
  [key: string]: unknown;
}

export const DeviceNode = memo(function DeviceNode({ data }: { data: DeviceNodeData }) {
  const { device, links, isSelected } = data;
  const type = DeviceRegistry.getById(device.deviceTypeId);
  if (!type) return null;

  const linkCount = links.filter(
    (link) => link.endpointA.deviceId === device.id || link.endpointB.deviceId === device.id
  ).length;

  return (
    <div
      title={`${type.vendor} ${type.model}`}
      className={
        'relative w-[116px] rounded-md border bg-white px-2 py-2 text-slate-800 shadow-sm transition-all select-none ' +
        (isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
          : 'border-slate-300 hover:border-slate-500 hover:shadow-md')
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        id="logical-in"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white opacity-25 hover:opacity-100"
        title="Create physical connection"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="logical-out"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white opacity-25 hover:opacity-100"
        title="Create physical connection"
      />

      <div className="flex justify-center text-slate-700">
        <DeviceSymbol category={type.visual.logicalSymbol} className="w-14 h-11" />
      </div>

      <div className="mt-1 text-center">
        <div className="truncate text-[11px] font-semibold leading-tight text-slate-900">{device.name}</div>
        <div className="mt-0.5 truncate text-[9px] leading-tight text-slate-500">{type.model}</div>
      </div>

      {linkCount > 0 && (
        <div className="absolute -right-2 -top-2 min-w-5 rounded-full border border-white bg-emerald-500 px-1 text-center text-[9px] font-bold leading-4 text-white shadow">
          {linkCount}
        </div>
      )}
    </div>
  );
});
