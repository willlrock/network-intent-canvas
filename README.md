# Network Intent Canvas (v0.1 Prototype)

**Network Intent Canvas** is an open-source visual network topology canvas designed for network engineers and AI agents.

## Key Principles & Architecture

1. **Deterministic Device Types vs. Device Instances**:
   - Every node on the canvas references a deterministic hardware profile in the `DeviceRegistry` (`src/device-registry/`).
   - Supported devices in v0.1:
     - **MikroTik RB5009UG+S+** (8x RJ45 ether1-ether8, 1x SFP+ sfp-sfpplus1)
     - **MikroTik CRS326-24G-2S+** (24x RJ45 ether1-ether24, 2x SFP+ sfp-sfpplus1, sfp-sfpplus2)
     - **Ubiquiti UniFi U6 Pro** (1x GbE PoE Uplink eth0, Wi-Fi 6 2.4G & 5G MIMO Radios)
2. **Network Model is the Source of Truth**:
   - The authoritative state is `NetworkProject` (`src/network-model/`), containing `devices: DeviceInstance[]` and `links: NetworkLink[]`.
   - Links reference exact physical interfaces (`deviceId` and `interfaceId`).
   - React Flow nodes and edges are strictly derived projections of this authoritative model.
3. **Structured Operation API (Single Mutation Path)**:
   - All topology changes (from mouse clicks, drag-and-drop, or future AI agents) flow through deterministic operations:
     - `addDevice({ deviceTypeId, position, name? })`
     - `removeDevice({ deviceId })`
     - `moveDevice({ deviceId, position })`
     - `connectInterfaces({ deviceA, interfaceA, deviceB, interfaceB })`
     - `disconnectLink({ linkId })`
     - `renameDevice({ deviceId, name })`
     - `loadProject({ project })`
     - `resetProject()`
4. **Deterministic Validation**:
   - Enforces physical constraints:
     - Prevents duplicate physical connections on the same interface.
     - Prevents self-loops (connecting a device to itself).
     - Validates interface existence and supported device types.
     - Warns on physical media mismatches (e.g., direct SFP+ to RJ45 without transceiver).
5. **Persistence**:
   - Automatic local storage sync and manual save.
   - Versioned JSON export and import (`schemaVersion: 1`) validated with Zod.
6. **CLI Terminal Placeholder**:
   - Bottom panel terminal powered by `@xterm/xterm` with device context and architected for future SSH/API websocket streaming.

---

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Build Production Bundle
```bash
npm run build
```
