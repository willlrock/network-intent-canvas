import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNetworkStore } from '../operations/useNetworkStore';
import { CableRegistry } from '../cable-registry';
import { DeviceNode, DeviceNodeData } from './DeviceNode';
import { ConnectionDialog } from '../components/ConnectionDialog';

const nodeTypes: NodeTypes = { device: DeviceNode };

function InnerNetworkCanvas({ onConnectError }: { onConnectError: (message: string) => void }) {
  const { project, selectedDeviceId, selectedLinkId, store } = useNetworkStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [connectionDraft, setConnectionDraft] = useState<{ source: string; target: string } | null>(null);

  const projectedNodes: Node<DeviceNodeData>[] = useMemo(
    () =>
      project.devices.map((dev) => ({
        id: dev.id,
        type: 'device',
        position: dev.position,
        data: {
          device: dev,
          links: project.links,
          isSelected: dev.id === selectedDeviceId,
        },
        selected: dev.id === selectedDeviceId,
      })),
    [project.devices, project.links, selectedDeviceId]
  );

  const [nodes, setNodes] = useState<Node<DeviceNodeData>[]>(projectedNodes);

  useEffect(() => {
    setNodes(projectedNodes);
  }, [projectedNodes]);

  const edges: Edge[] = useMemo(
    () =>
      project.links.map((link) => {
        const cable = CableRegistry.getById(link.cableTypeId || 'ethernet-copper');
        const selected = link.id === selectedLinkId;
        return {
          id: link.id,
          source: link.endpointA.deviceId,
          target: link.endpointB.deviceId,
          selected,
          label:
            link.endpointA.interfaceId +
            '  ·  ' +
            (cable?.shortName || 'Cable') +
            '  ·  ' +
            link.endpointB.interfaceId,
          labelStyle: { fill: '#475569', fontSize: 9, fontFamily: 'monospace', fontWeight: 600 },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.94, rx: 4, stroke: '#cbd5e1', strokeWidth: 1 },
          style: {
            stroke: selected ? '#2563eb' : '#475569',
            strokeWidth: selected ? 3 : 2,
          },
        };
      }),
    [project.links, selectedLinkId]
  );

  const onNodesChange = useCallback((changes: NodeChange<Node<DeviceNodeData>>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const deviceTypeId = event.dataTransfer.getData('application/network-device-type');
      if (!deviceTypeId) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const res = store.addDevice({ deviceTypeId, position });
      if (!res.success && res.error) onConnectError(res.error);
    },
    [reactFlowInstance, store, onConnectError]
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const result = store.moveDevice({ deviceId: node.id, position: node.position });
      if (!result.success && result.error) onConnectError(result.error);
      else store.logMoveDevice({ deviceId: node.id, position: node.position });
    },
    [store, onConnectError]
  );

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setConnectionDraft({ source: connection.source, target: connection.target });
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => store.selectDevice(node.id),
    [store]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => store.selectLink(edge.id),
    [store]
  );

  const onPaneClick = useCallback(() => {
    store.selectDevice(null);
    store.selectLink(null);
  }, [store]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const tag = (event.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (selectedDeviceId) store.removeDevice({ deviceId: selectedDeviceId });
      else if (selectedLinkId) store.disconnectLink({ linkId: selectedLinkId });
    },
    [selectedDeviceId, selectedLinkId, store]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="relative h-full w-full bg-[#eef2f7] outline-none"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{ type: 'straight' }}
        selectionOnDrag
        panOnDrag={[1, 2]}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#cbd5e1" gap={20} size={1} />
        <Controls className="!border !border-slate-300 !bg-white !text-slate-700 [&>button]:!border-slate-200 [&>button]:!bg-white [&>button:hover]:!bg-slate-100" />
      </ReactFlow>

      <div className="pointer-events-none absolute left-4 top-4 rounded border border-slate-300 bg-white/90 px-2.5 py-1.5 text-[10px] text-slate-500 shadow-sm">
        Drag devices · connect node handles · then choose exact ports and cable
      </div>

      {connectionDraft && (
        <ConnectionDialog
          project={project}
          sourceDeviceId={connectionDraft.source}
          targetDeviceId={connectionDraft.target}
          onCancel={() => setConnectionDraft(null)}
          onConfirm={(sourceInterface, targetInterface, cableTypeId) => {
            const res = store.connectInterfaces({
              deviceA: connectionDraft.source,
              interfaceA: sourceInterface,
              deviceB: connectionDraft.target,
              interfaceB: targetInterface,
              cableTypeId,
            });

            if (!res.success) {
              if (res.error) onConnectError(res.error);
              return false;
            }

            setConnectionDraft(null);
            return true;
          }}
        />
      )}
    </div>
  );
}

export function NetworkCanvas(props: { onConnectError: (message: string) => void }) {
  return (
    <ReactFlowProvider>
      <InnerNetworkCanvas {...props} />
    </ReactFlowProvider>
  );
}
