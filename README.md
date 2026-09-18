# Network Intent Canvas

Network Intent Canvas is an OSS-first network engineering cockpit.

The project deliberately does **not** reimplement a topology editor, terminal, simulator, device image set, or hardware catalogue when mature open-source projects already provide them.

## Current foundation

The repository pins two upstream projects as Git submodules:

- **NetSim** — the current topology editor, device/link interaction, CLI, simulator, intent/drift tooling and browser UI.
- **NetBox Device Type Library** — the hardware catalogue: real vendors/models, interfaces, console/power ports and upstream front/rear device images where available.

The custom code in this repository is intentionally small. It currently adds a read-only hardware-catalog API on top of the NetSim FastAPI application.

## Architecture rule

Before implementing any feature, first look for a maintained OSS implementation.

Examples:

- topology/canvas/CLI/simulation → NetSim first;
- real device definitions and images → NetBox Device Type Library;
- inventory/IPAM/source of truth → Nautobot/NetBox;
- intended config/compliance → Nautobot Golden Config;
- automation → Nornir;
- SSH → Scrapli/Netmiko;
- CLI parsing → NTC Templates/TextFSM;
- lab/emulation → Containerlab/GNS3/CORE where appropriate.

Do not add hand-drawn device graphics or a second hand-authored hardware catalogue.

## Clone

Because the project uses submodules:

```bash
git clone --recurse-submodules https://github.com/willlrock/network-intent-canvas.git
cd network-intent-canvas
```

If you already cloned the repository:

```bash
git pull
git submodule update --init --recursive
```

## Run

Linux / WSL:

```bash
make bootstrap
make run
```

Then open:

```text
http://127.0.0.1:8000
```

The UI you see is the reused NetSim web interface, not a separately rebuilt canvas.

## Hardware catalogue API

The wrapper exposes the upstream NetBox Device Type Library without maintaining another copy of the device data.

Examples:

```text
GET /api/hardware/status
GET /api/hardware/device-types?q=RB5009
GET /api/hardware/device-types?q=CRS326
GET /api/hardware/device-types?q=U6
GET /api/hardware/device-types/mikrotik-rb5009ug-plus-s-plus-in
GET /api/hardware/device-types/mikrotik-crs326-24g-2s-plus-rm/image/front
```

If the upstream library has a front/rear image for a model, the API serves that existing asset directly. Nothing is generated or redrawn by this project.

## Tests

```bash
make test
```

This runs the NetSim upstream tests plus the small integration-layer tests in this repository.

## Direction

Next steps are intentionally integration work, not rebuilding existing products:

1. expose Device Type Library models inside the existing NetSim device workflow;
2. map exact upstream interfaces into topology links;
3. add live-device adapters while keeping NetSim simulation as an optional backend;
4. add Nautobot/Nornir/Scrapli/NTC adapters;
5. add AI only as an orchestration layer over deterministic operations.

Mouse actions and future AI actions must use the same deterministic operations. The LLM must never invent unsupported hardware or arbitrary device CLI.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for upstream attribution.
