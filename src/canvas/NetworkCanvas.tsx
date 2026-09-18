import React, { useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNetworkStore } from '../operations/useNetworkStore';
import { DeviceNode, DeviceNodeData } from './DeviceNode';

const nodeTypes: NodeTypes = {
  device: DeviceNode,
};

function InnerNetworkCanvas({
  onConnectError,
}: {
  onConnectError: (message: string) => void;
}) {
  const { project, selectedDeviceId, selectedLinkId, store } = useNetworkStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // Project -> React Flow Nodes
  const nodes: Node<DeviceNodeData>[] = useMemo(() => {
    return project.devices.map((dev) => ({
      id: dev.id,
      type: 'device',
      position: dev.position,
      data: {
        device: dev,
        links: project.links,
        isSelected: dev.id === selectedDeviceId,
      },
      selected: dev.id === selectedDeviceId,
      dragHandle: undefined,
    }));
  }, [project.devices, project.links, selectedDeviceId]);

  // Project -> React Flow Edges
  const edges: Edge[] = useMemo(() => {
    return project.links.map((link) => {
      const isSelected = link.id === selectedLinkId;
      return {
        id: link.id,
        source: link.endpointA.deviceId,
        sourceHandle: link.endpointA.interfaceId,
        target: link.endpointB.deviceId,
        targetHandle: link.endpointB.interfaceId,
        animated: false,
        selected: isSelected,
        label: `${link.endpointA.interfaceId} ↔ ${link.endpointB.interfaceId}`,
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace', fontWeight: 500 },
        labelBgStyle: { fill: '#090d16', fillOpacity: 0.85, rx: 4, stroke: '#334155', strokeWidth: 1 },
        style: {
          stroke: isSelected ? '#38bdf8' : '#64748b',
          strokeWidth: isSelected ? 3 : 2,
        },
      };
    });
  }, [project.links, selectedLinkId]);

  // Handle Drag & Drop from Device Library onto Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const deviceTypeId = event.dataTransfer.getData('application/network-device-type');
      if (!deviceTypeId) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const res = store.addDevice({
        deviceTypeId,
        position,
      });

      if (!res.success && res.error) {
        onConnectError(res.error);
      }
    },
    [reactFlowInstance, store, onConnectError]
  );

  // Handle Node dragging completion
  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      store.moveDevice({
        deviceId: node.id,
        position: node.position,
      });
      store.logMoveDevice({
        deviceId: node.id,
        position: node.position,
      });
    },
    [store]
  );

  // Handle Connecting Interfaces
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        return;
      }

      const res = store.connectInterfaces({
        deviceA: connection.source,
        interfaceA: connection.sourceHandle,
        deviceB: connection.target,
        interfaceB: connection.targetHandle,
      });

      if (!res.success && res.error) {
        onConnectError(res.error);
      }
    },
    [store, onConnectError]
  );

  // Selection handlers
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      store.selectDevice(node.id);
    },
    [store]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      store.selectLink(edge.id);
    },
    [store]
  );

  const onPaneClick = useCallback(() => {
    store.selectDevice(null);
    store.selectLink(null);
  }, [store]);

  // Handle Delete key for selected device or link
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Prevent deleting if typing in input/textarea
        const tag = (event.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (selectedDeviceId) {
          store.removeDevice({ deviceId: selectedDeviceId });
        } else if (selectedLinkId) {
          store.disconnectLink({ linkId: selectedLinkId });
        }
      }
    },
    [selectedDeviceId, selectedLinkId, store]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full relative outline-none"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 [&>button]:!border-slate-800 [&>button]:!bg-slate-900 [&>button:hover]:!bg-slate-800" />
        <MiniMap
          nodeColor={() => '#3b82f6'}
          maskColor="rgba(15, 23, 42, 0.75)"
          className="!bg-slate-950 !border !border-slate-800 rounded-lg overflow-hidden"
        />
      </ReactFlow>
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
