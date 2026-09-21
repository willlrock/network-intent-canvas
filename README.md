# Network Intent Canvas

Network Intent Canvas is an OSS-first controller for discovering, modelling and later changing real networks.

The product goal is:

~~~text
real network
   ↓ discover
deterministic observed topology
   ↓ compare
desired topology / intent
   ↓ review
structured change plan
   ↓ approve
vendor adapter
   ↓
real devices
~~~

The AI layer will sit above this model. It must never invent a physical port, a cable, a device capability or arbitrary CLI.

## Current milestone: real-network discovery

The current code is deliberately **OBSERVE only**.

It connects to MikroTik RouterOS over SSH using **Netmiko** and parses supported RouterOS output using the existing **NTC Templates/TextFSM** templates. It collects:

- system identity and RouterOS version;
- hardware model / serial where available;
- interfaces and interface state;
- IP addresses;
- RouterOS neighbor data (LLDP/MNDP/CDP surfaced by /ip neighbor);
- bridge forwarding database (MAC table);
- ARP entries.

The discovery result is converted into an observed topology with evidence.

A direct neighbor with a known local and remote interface becomes a confirmed link. MAC-table data by itself never becomes a made-up physical cable: it becomes an **unknown downstream segment** until there is stronger evidence or an administrator confirms it.

## OSS components

We reuse existing projects instead of rebuilding them:

- **NetBox Device Type Library** — physical hardware definitions and existing device assets;
- **Netmiko** — RouterOS SSH transport;
- **NTC Templates / TextFSM** — RouterOS CLI parsing;
- **Nautobot** — planned canonical source of truth / desired state;
- **Nautobot Golden Config / Nornir** — planned compliance and deterministic execution.

NetSim is no longer the application foundation. Simulation can return later as an optional backend, but the product is centred on real-network state.

## Clone and bootstrap

~~~bash
git clone --recurse-submodules https://github.com/willlrock/network-intent-canvas.git
cd network-intent-canvas
make bootstrap
~~~

For an existing clone after this architecture change:

~~~bash
git pull
git submodule sync
git submodule update --init --recursive
make bootstrap
~~~

make bootstrap also builds a local index for the NetBox Device Type Library, so the first hardware lookup does not synchronously parse thousands of YAML files.

## Run

~~~bash
make run
~~~

The server binds to **127.0.0.1 only** because authentication/authorization is not implemented yet.

Open API documentation at:

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

The latest successful/partial observation can be read from:

~~~text
GET /api/topology/observed
~~~

Example link shape:

~~~json
{
  "endpoint_a": {"device_id": "SW-01", "interface": "ether8"},
  "endpoint_b": {"device_id": "U6PRO-03", "interface": "eth0"},
  "confidence": "confirmed",
  "evidence": [
    {
      "source": "routeros_neighbor",
      "source_device": "SW-01",
      "source_interface": "ether8"
    }
  ]
}
~~~

If only FDB/MAC evidence exists, the app emits an unknown segment rather than pretending to know the cable.

## Hardware catalogue

The project does not maintain a second hardware catalogue. It reads the upstream NetBox Device Type Library.

~~~text
GET /api/hardware/status
GET /api/hardware/device-types?q=RB5009
GET /api/hardware/device-types?q=CRS326
GET /api/hardware/device-types/mikrotik-rb5009ug-plus-s-plus-in
GET /api/hardware/device-types/mikrotik-crs326-24g-2s-plus-rm/image/front
~~~

Where the upstream library has an image, that existing asset is served directly. Nothing is redrawn here.

## Tests

~~~bash
make test
~~~

## What is intentionally not implemented yet

- no configuration writes;
- no AI-generated commands;
- no automatic remediation;
- no public/network-facing unauthenticated deployment;
- no inference of physical links from a single MAC address;
- no UniFi controller collector yet;
- no Nautobot write-back yet.

The next milestone is to test discovery against a real RouterOS network, fix vendor/firmware edge cases, then add UniFi Controller evidence and Nautobot reconciliation.

See THIRD_PARTY_NOTICES.md.
