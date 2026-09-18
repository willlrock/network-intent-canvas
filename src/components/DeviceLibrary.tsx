import { useState } from 'react';
import { DeviceRegistry, DeviceType, DeviceCategory } from '../device-registry';
import { useNetworkStore } from '../operations/useNetworkStore';
import { DeviceSymbol } from '../canvas/DeviceSymbol';

type PaletteGroup = 'network' | 'endpoints' | 'infrastructure';

const GROUPS: Record<PaletteGroup, { label: string; categories: DeviceCategory[] }> = {
  network: {
    label: 'Network Devices',
    categories: ['router', 'switch', 'access-point', 'firewall'],
  },
  endpoints: {
    label: 'End Devices',
    categories: ['desktop', 'laptop', 'server', 'printer', 'ip-phone', 'camera', 'nvr', 'nas', 'generic-endpoint'],
  },
  infrastructure: {
    label: 'Infrastructure',
    categories: ['internet'],
  },
};

export function DeviceLibrary() {
  const { store } = useNetworkStore();
  const [group, setGroup] = useState<PaletteGroup>('network');
  const devices = DeviceRegistry.getAll().filter((d) => GROUPS[group].categories.includes(d.category));

  const onDragStart = (event: React.DragEvent, deviceType: DeviceType) => {
    event.dataTransfer.setData('application/network-device-type', deviceType.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleQuickAdd = (deviceType: DeviceType) => {
    const count = store.getState().project.devices.length;
    store.addDevice({
      deviceTypeId: deviceType.id,
      position: {
        x: 150 + (count % 6) * 125,
        y: 110 + (Math.floor(count / 6) % 4) * 105,
      },
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-slate-800 bg-slate-950">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-slate-800 px-2">
        {(Object.keys(GROUPS) as PaletteGroup[]).map((key) => (
          <button
            key={key}
            onClick={() => setGroup(key)}
            className={
              'rounded px-2.5 py-1 text-[11px] font-medium transition-colors ' +
              (group === key
                ? 'bg-slate-800 text-blue-300'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200')
            }
          >
            {GROUPS[key].label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="flex min-w-max gap-2">
          {devices.map((device) => (
            <button
              type="button"
              key={device.id}
              draggable
              onDragStart={(event) => onDragStart(event, device)}
              onDoubleClick={() => handleQuickAdd(device)}
              className="group flex h-[82px] w-[112px] shrink-0 cursor-grab flex-col items-center justify-center rounded border border-slate-700 bg-slate-900 px-2 text-center hover:border-blue-500 hover:bg-slate-800 active:cursor-grabbing"
              title={'Drag ' + device.model + ' to canvas. Double-click to quick-add.'}
            >
              <DeviceSymbol category={device.visual.logicalSymbol} className="h-10 w-12 text-slate-300 group-hover:text-blue-300" />
              <div className="mt-1 w-full truncate text-[10px] font-semibold text-slate-200">{device.model}</div>
              <div className="w-full truncate text-[9px] text-slate-500">{device.vendor}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-800 px-3 py-1.5 text-[9px] text-slate-500">
        Drag to canvas · double-click to add · all objects come from the deterministic registry
      </div>
    </div>
  );
}
