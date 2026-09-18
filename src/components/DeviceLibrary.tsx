import React from 'react';
import { Router, Network, Wifi, Plus, GripVertical, Info } from 'lucide-react';
import { DeviceRegistry, DeviceType } from '../device-registry';
import { useNetworkStore } from '../operations/useNetworkStore';

export function DeviceLibrary() {
  const { store } = useNetworkStore();
  const devices = DeviceRegistry.getAll();

  const routers = devices.filter((d) => d.category === 'router');
  const switches = devices.filter((d) => d.category === 'switch');
  const accessPoints = devices.filter((d) => d.category === 'access-point');

  const onDragStart = (event: React.DragEvent, deviceType: DeviceType) => {
    event.dataTransfer.setData('application/network-device-type', deviceType.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleQuickAdd = (deviceType: DeviceType) => {
    // Offset slightly for each new device
    const count = store.getState().project.devices.length;
    const offset = (count % 6) * 40;
    store.addDevice({
      deviceTypeId: deviceType.id,
      position: { x: 250 + offset, y: 150 + offset },
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800 select-none overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Device Library
          </h2>
          <p className="text-[10px] text-slate-500">Deterministic hardware registry</p>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Routers */}
        <CategorySection
          title="Routers"
          icon={<Router className="w-3.5 h-3.5 text-emerald-400" />}
          devices={routers}
          onDragStart={onDragStart}
          onQuickAdd={handleQuickAdd}
        />

        {/* Switches */}
        <CategorySection
          title="Switches"
          icon={<Network className="w-3.5 h-3.5 text-cyan-400" />}
          devices={switches}
          onDragStart={onDragStart}
          onQuickAdd={handleQuickAdd}
        />

        {/* Access Points */}
        <CategorySection
          title="Access Points"
          icon={<Wifi className="w-3.5 h-3.5 text-purple-400" />}
          devices={accessPoints}
          onDragStart={onDragStart}
          onQuickAdd={handleQuickAdd}
        />
      </div>

      {/* Tip footer */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/40 text-[10px] text-slate-500 flex items-start space-x-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <span>Drag device onto canvas or click + to add instance.</span>
      </div>
    </div>
  );
}

function CategorySection({
  title,
  icon,
  devices,
  onDragStart,
  onQuickAdd,
}: {
  title: string;
  icon: React.ReactNode;
  devices: DeviceType[];
  onDragStart: (e: React.DragEvent, dev: DeviceType) => void;
  onQuickAdd: (dev: DeviceType) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 px-1">
        {icon}
        <span>{title}</span>
        <span className="text-[10px] font-mono text-slate-600">({devices.length})</span>
      </div>

      <div className="space-y-1.5">
        {devices.map((device) => {
          const rj45Count = device.interfaces.filter((i) => i.media === 'rj45').length;
          const sfpCount = device.interfaces.filter((i) => i.media === 'sfp' || i.media === 'sfp+').length;

          return (
            <div
              key={device.id}
              draggable
              onDragStart={(e) => onDragStart(e, device)}
              className="group relative flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition-all shadow-sm"
            >
              <div className="flex items-start space-x-2">
                <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {device.model}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {device.vendor}
                  </div>
                  <div className="mt-1 flex items-center space-x-1.5 text-[9px] font-mono text-slate-500">
                    {rj45Count > 0 && <span>{rj45Count}x RJ45</span>}
                    {sfpCount > 0 && <span>• {sfpCount}x SFP+</span>}
                    {device.capabilities.wifi && <span>• {device.capabilities.wifi}</span>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(device);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-opacity"
                title={`Add ${device.model} to canvas`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
