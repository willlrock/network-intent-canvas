# Roadmap

The roadmap is ordered by product risk, not by visual polish.

## Milestone 0 — Harden observed topology

Goal: trust the graph before drawing it.

Next work:

- introduce stable device IDs based on serial/base MAC/other stable identifiers instead of RouterOS identity;
- keep RouterOS identity as display name;
- detect duplicate identities and emit warnings;
- implement explicit topology states: observed, confirmed, conflict and manual;
- require reciprocal or independent corroboration before promoting a physical link to confirmed;
- detect contradictory port claims;
- validate remote interface names against discovered device interfaces when the peer is known;
- record SSH host-key verification state in observations;
- add real RouterOS output fixtures from supported firmware versions;
- keep unsupported/unparsed command output as warnings/errors instead of guessing.

Definition of done:

- two or more real MikroTik devices can be discovered read-only;
- exact-port links are never marked confirmed when evidence conflicts;
- duplicate labels do not collapse distinct devices;
- unsupported parser output is visible and diagnosable.

## Milestone 1 — Visualize the observed network using OSS

Goal: turn the trusted graph into the first useful operator UI.

Rules:

- do not draw custom SVG device sets;
- do not build a new canvas until existing OSS editors/viewers have been evaluated;
- coordinates/layout are deterministic UI concerns, not LLM output.

Required UX:

- render discovered devices and links;
- label exact local and remote ports;
- distinguish observed / confirmed / conflict / manual visually;
- select a device and inspect interfaces, neighbor evidence, FDB/ARP evidence and last observation time;
- render unknown downstream segments instead of fake cables;
- preserve manual layout positions separately from observed network facts.

Definition of done:

- a discovery snapshot can be opened as a network diagram without manually creating nodes;
- clicking a link shows exactly which evidence produced it.

## Milestone 2 — Add independent UniFi evidence

Goal: improve AP and client-side topology without guessing.

Work:

- select a maintained UniFi Controller API client or direct documented API integration;
- collect AP identity, MAC, management IP, uplink information and controller-known relationships;
- correlate UniFi devices with RouterOS observations;
- allow independent evidence to corroborate a RouterOS neighbor relationship;
- never turn controller client association into a physical cable unless the API actually proves an uplink.

Definition of done:

- managed APs are resolved to stable devices;
- RouterOS + UniFi evidence can confirm an AP uplink to an exact switch port when both sources support it.

## Milestone 3 — Canonical source of truth and reconciliation

Goal: separate observed state from intended/documented state.

Preferred direction: Nautobot ecosystem, evaluated before custom storage.

Model:

~~~text
observed state  -> collected from real devices
desired state   -> operator/AI intent
source of truth -> canonical inventory and approved intent
diff            -> deterministic comparison
~~~

Work:

- evaluate Nautobot models/API/Jobs for devices, interfaces, VLANs, IPs and cables;
- import/match NetBox Device Type Library device definitions without maintaining a parallel catalogue;
- reconcile discovery observations into source-of-truth candidates;
- require review for ambiguous identity or cabling changes;
- preserve evidence and observation timestamps.

Definition of done:

- the same device/interface has a stable canonical identity across discovery runs;
- observed and desired state can be compared without overwriting one another.

## Milestone 4 — Desired topology and AI design

Goal: let the user describe a new network or desired change and receive a valid editable design.

AI responsibilities:

- translate natural language into structured desired-state objects;
- choose only known device types;
- use only real interfaces from authoritative device definitions;
- respect capacity, port count, speed and PoE constraints where data exists;
- explain unresolved constraints.

AI must not:

- invent hardware models;
- invent physical ports;
- invent actual-network observations;
- generate canvas coordinates as network facts;
- bypass validators.

The visualization layer lays out the resulting deterministic graph.

Definition of done:

- a request such as “RB5009, two access switches, twelve APs, cameras on VLAN 110” becomes a validated desired topology that the user can edit.

## Milestone 5 — PLAN mode and deterministic operations

Goal: change the model before changing a device.

Start with a very small operation catalogue.

Candidate first operations:

- set bridge-port PVID/access VLAN;
- set interface description/comment;
- enable/disable a supported interface only when rollback semantics are understood.

Each operation must provide:

- supported vendor/OS/version constraints;
- preconditions;
- exact rendered change;
- expected postconditions;
- validation;
- idempotency expectations;
- rollback strategy.

Test first against CHR/lab environments.

Definition of done:

- changing desired state generates an exact, reviewable plan without mutating production.

## Milestone 6 — APPLY mode

Goal: safely apply a small set of validated changes.

Before production writes:

- strict SSH host-key verification;
- authenticated/authorized application users;
- explicit human approval;
- configuration/export backup;
- RouterOS safe-mode or equivalent protection where technically valid;
- prechecks;
- controlled execution;
- postchecks;
- rediscovery;
- automatic failure detection;
- rollback/unroll path.

No generic “run arbitrary CLI” operation.

Definition of done:

~~~text
desired change
  -> plan
  -> approve
  -> apply
  -> rediscover
  -> verify actual == desired
~~~

for a small supported operation set in lab, then production.

## Later milestones

After the core loop works:

- additional vendors and operating systems;
- richer VLAN/trunk/routing/firewall intent;
- change history and audit views;
- Nautobot Golden Config integration;
- Nornir orchestration;
- optional GNS3/Containerlab/CORE test backends;
- incident analysis using observed topology and state;
- AI-assisted troubleshooting;
- generated designs for greenfield networks;
- policy validation before application.

## What we intentionally will not prioritize

Until the deterministic observe/plan/apply loop works:

- another network simulator;
- hand-built hardware catalogues;
- custom device artwork;
- generic raw-CLI AI agents;
- broad multi-vendor support with shallow correctness;
- autonomous production remediation.
