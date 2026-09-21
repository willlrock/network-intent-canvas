# Network Intent Canvas

Network Intent Canvas is an OSS-first, deterministic controller for discovering, visualizing, designing and later changing real networks.

The target user experience is simple:

~~~text
connect real network
      ->
network is discovered and drawn with real ports
      ->
inspect actual state and evidence
      ->
edit the desired network or describe the change to AI
      ->
review deterministic diff/change plan
      ->
approve supported changes
      ->
apply, rediscover and verify
~~~

The project is not trying to rebuild Packet Tracer, NetBox/Nautobot, Nornir, SSH libraries, device catalogues or network parsers. Existing OSS should be reused wherever it fits. Our unique layer is the deterministic workflow that connects real-network discovery, topology evidence, desired intent, visualization, AI and safe change execution.

## Project documents

- **[PROJECT.md](PROJECT.md)** — what the product is, what it provides today and non-negotiable rules.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — observed/desired/canonical state boundaries, evidence model, AI boundary and future change architecture.
- **[ROADMAP.md](ROADMAP.md)** — ordered milestones from reliable discovery to visualization, desired state and safe APPLY.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — OSS-first development rules.

## Current milestone: OBSERVE

Today the project is a Python API for read-only RouterOS discovery.

It currently provides:

- RouterOS SSH collection through Netmiko;
- deterministic parsing through NTC Templates/TextFSM;
- device/interface/IP/neighbor/FDB/ARP observations;
- evidence-bearing physical topology;
- unknown downstream segments instead of invented direct cables;
- read-only NetBox Device Type Library lookup and existing upstream hardware assets;
- local persistence of the latest observation;
- tests and CI.

It does **not** yet have a graphical topology frontend, AI desired-state generation, Nautobot reconciliation or production configuration writes.

The immediate priority is to make observed topology trustworthy before adding visualization. See ROADMAP.md.

## Deterministic rule

The AI layer must never invent a physical fact.

~~~text
real network evidence -> observed state
human/AI proposal     -> desired state
observed != desired
~~~

A MAC table entry is not automatically a cable. A hostname is not automatically stable identity. An AI suggestion is never observed state.

## OSS components

Current:

- **NetBox Device Type Library** — real hardware definitions and existing device assets;
- **Netmiko** — RouterOS SSH transport;
- **NTC Templates / TextFSM** — deterministic RouterOS CLI parsing.

Planned/evaluated before custom alternatives:

- **Nautobot / NetBox** — canonical source of truth, inventory and IPAM;
- **Nautobot Golden Config / Nornir** — compliance and deterministic execution;
- **existing OSS topology editors/viewers** — visualization and editing;
- **Containerlab / GNS3 / CORE** — optional lab/emulation backends.

NetSim is not the application foundation.

## Clone and bootstrap

~~~bash
git clone --recurse-submodules https://github.com/willlrock/network-intent-canvas.git
cd network-intent-canvas
make bootstrap
~~~

For an existing clone:

~~~bash
git pull
git submodule sync
git submodule update --init --recursive
make bootstrap
~~~

Bootstrap builds a local index for the NetBox Device Type Library so the first lookup does not synchronously parse thousands of YAML files.

## Run

~~~bash
make run
~~~

The server binds to **127.0.0.1 only** because authentication/authorization is not implemented yet.

Open:

~~~text
http://127.0.0.1:8000/docs
~~~

## Discover RouterOS devices

Use a dedicated least-privilege/read-only RouterOS account.

~~~bash
curl -X POST http://127.0.0.1:8000/api/discovery/routeros \
  -H 'Content-Type: application/json' \
  -d '{
    "targets": [
      {
        "host": "192.0.2.10",
        "username": "discovery",
        "password": "REPLACE_ME"
      },
      {
        "host": "192.0.2.11",
        "username": "discovery",
        "password": "REPLACE_ME"
      }
    ]
  }'
~~~

Credentials are used for the connection and are not persisted in the discovery snapshot.

Read the latest snapshot:

~~~text
GET /api/topology/observed
~~~

Current topology confidence is still being hardened. ROADMAP.md documents the stricter target model: observed, confirmed, conflict and manual.

## Hardware catalogue

The project does not maintain a second hardware catalogue.

~~~text
GET /api/hardware/status
GET /api/hardware/device-types?q=RB5009
GET /api/hardware/device-types?q=CRS326
GET /api/hardware/device-types/mikrotik-rb5009ug-plus-s-plus-in
GET /api/hardware/device-types/mikrotik-crs326-24g-2s-plus-rm/image/front
~~~

Where the upstream library has an asset, that existing asset is served directly. Nothing is redrawn here.

## Tests

~~~bash
make test
~~~

## Current safety boundary

There are intentionally:

- no configuration-write endpoints;
- no AI-generated raw commands;
- no automatic remediation;
- no production APPLY mode;
- no public unauthenticated deployment.

The future write path is **PLAN -> approve -> APPLY -> postcheck -> rediscover -> verify**, never “LLM sends arbitrary SSH”.

See THIRD_PARTY_NOTICES.md for upstream attribution.
