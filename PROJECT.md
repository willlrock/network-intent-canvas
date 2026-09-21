# Product Definition

## What Network Intent Canvas is

Network Intent Canvas is an OSS-first, deterministic network controller for real networks.

The end-state product should let an operator:

1. connect an existing network;
2. discover devices, interfaces, neighbors, VLAN/IP state and other observable facts;
3. automatically build a physical/logical network graph with exact ports where evidence supports them;
4. inspect why every discovered relationship exists;
5. describe a desired network or desired change in natural language;
6. turn that request into a validated desired-state model;
7. compare desired state with actual state;
8. review a deterministic change plan;
9. apply supported changes through vendor-aware adapters;
10. rediscover the network and verify that actual state now matches desired state.

The product is not primarily a simulator. Simulation/lab systems may be attached as optional execution backends later.

## North-star workflow

~~~text
REAL NETWORK
    |
    | collectors
    v
OBSERVED STATE
    |
    | evidence + reconciliation
    v
CANONICAL NETWORK MODEL
    |                         ^
    |                         |
    v                         | AI or human intent
VISUAL TOPOLOGY <------> DESIRED STATE
                              |
                              | deterministic diff
                              v
                         CHANGE PLAN
                              |
                         human approval
                              |
                              v
                            APPLY
                              |
                              v
                         REDISCOVER
                              |
                              v
                    VERIFY actual == desired
~~~

## What the project provides today

Current mode: **OBSERVE only**.

Implemented today:

- RouterOS discovery over SSH with Netmiko;
- deterministic parsing through NTC Templates/TextFSM;
- collection of identity, RouterOS version, hardware model/serial where available;
- interface inventory and interface state;
- IP addresses;
- RouterOS neighbor observations;
- bridge forwarding database observations;
- ARP observations;
- evidence-bearing topology links;
- unknown downstream segments instead of invented physical cables;
- read-only access to NetBox Device Type Library definitions and existing assets;
- local persistence of the latest observed snapshot;
- hardware catalogue indexing to avoid parsing the entire upstream library on each request;
- CI and unit tests.

The current project does **not** yet provide a graphical topology UI, configuration writes, Nautobot reconciliation or AI-generated desired state.

## Product contract

### 1. Facts must be deterministic

The system must never promote an unsupported guess to a physical fact.

Examples:

- one MAC address behind a port does not prove a direct cable;
- an advertised hostname does not by itself prove device identity;
- an AI suggestion does not become observed state;
- a port that does not exist in the hardware catalogue cannot be used in desired state.

Every important observed fact should be traceable to evidence.

### 2. Device identity must be stable

Display names are labels, not primary keys.

Target identity preference:

~~~text
physical RouterOS device:
routerboard serial
    -> chassis/base MAC fallback
    -> other stable observed identifier

virtual device:
platform/instance UUID where available
    -> stable MAC fallback

management IP:
locator, not identity

/system identity:
display name only
~~~

### 3. Topology confidence is explicit

Target topology states:

- **observed** — one valid source reports the relationship, but it is not independently corroborated;
- **confirmed** — endpoint identity and exact ports are corroborated without contradiction;
- **conflict** — sources disagree about the physical relationship;
- **manual** — an administrator explicitly confirmed the relationship.

Unknown must remain unknown.

### 4. AI operates on structured intent, not raw device commands

Target flow:

~~~text
human language
    ->
AI proposal
    ->
validated desired-state objects
    ->
deterministic operation
    ->
vendor adapter
    ->
exact device/API/CLI change
~~~

Never:

~~~text
LLM -> arbitrary SSH command -> production device
~~~

The AI may choose among real device types, capabilities and free physical ports only after validation against authoritative data.

### 5. UI actions and AI actions use the same operation layer

A mouse action and an AI request must eventually converge on the same structured operations, for example:

~~~text
interface.access_vlan.set
interface.description.set
link.create
link.remove
device.rename
~~~

There must not be a privileged hidden mutation path for AI.

### 6. OSS first

Before adding a subsystem, search for a maintained OSS implementation.

Preferred directions:

- hardware definitions/assets -> NetBox Device Type Library;
- source of truth / inventory / IPAM -> Nautobot or NetBox;
- compliance / intended configuration -> Nautobot Golden Config;
- automation -> Nornir;
- SSH / network transport -> Netmiko or Scrapli where supported;
- deterministic CLI parsing -> NTC Templates/TextFSM;
- lab/emulation -> Containerlab, GNS3 or CORE where appropriate;
- topology visualization/editor -> reuse an existing OSS editor before building one.

Custom code should be glue, reconciliation, deterministic intent modelling and the missing product workflow.

## Safety modes

The intended progression is:

~~~text
OBSERVE
  read-only discovery and visualization

PLAN
  desired state, diff, rendered changes, prechecks
  no device mutation

APPLY
  explicit approval, verified target identity,
  backup/rollback strategy, postchecks and rediscovery
~~~

A feature must not jump directly from OBSERVE to arbitrary write access.
