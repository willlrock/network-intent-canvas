# Architecture

## Core state separation

The product must keep three concepts separate.

### Observed state

Facts collected from the real network.

Examples:

- device serial/model/version;
- interface state;
- IP addresses;
- neighbor advertisements;
- FDB entries;
- ARP entries.

Observed state is timestamped and evidence-bearing.

### Desired state

What the operator wants the network to be.

Desired state may come from:

- manual UI edits;
- imported source-of-truth data;
- an AI proposal accepted by the operator.

Desired state is not proof of what exists physically.

### Canonical inventory / source of truth

Stable identity and approved network intent.

The target architecture should reconcile both observed and desired state around a canonical device/interface model, preferably by integrating an established OSS source-of-truth platform rather than rebuilding one.

## Discovery pipeline

~~~text
vendor collector
    |
    v
structured observations
    |
    v
identity resolution
    |
    v
evidence reconciliation
    |
    +---- contradictions -> conflict
    |
    v
observed topology snapshot
~~~

Collectors should be replaceable adapters.

Current collector:

- MikroTik RouterOS -> Netmiko + NTC Templates.

Planned collector:

- UniFi Controller API.

## Evidence rules

A topology edge is not just two endpoints. It carries provenance.

Conceptually:

~~~json
{
  "endpoint_a": {"device_id": "...", "interface": "..."},
  "endpoint_b": {"device_id": "...", "interface": "..."},
  "state": "confirmed",
  "evidence": [
    {"source": "lldp/routeros-neighbor", "observed_at": "..."},
    {"source": "controller-api", "observed_at": "..."}
  ]
}
~~~

FDB and ARP observations can locate endpoints behind a port but do not automatically prove a direct physical cable.

## Stable identity

A device ID must survive renames and management-IP changes.

The target resolver should treat serial/chassis identity as stronger than display names and addresses.

~~~text
stable identity > management locator > display label
~~~

Conflicting identity evidence must be surfaced, not silently merged.

## Visualization boundary

The visual layer consumes the canonical graph.

It does not decide network truth.

~~~text
observed/desired graph
        |
        v
topology adapter
        |
        v
OSS visualization/editor
        |
        v
layout / user interaction
~~~

Device artwork and topology interaction should come from suitable OSS assets/components wherever possible.

AI does not generate pixels, SVGs or authoritative canvas coordinates.

## Change architecture

Future write support must be capability-based.

~~~text
UI action / AI proposal
          |
          v
structured operation
          |
          v
schema + precondition validation
          |
          v
vendor/OS adapter
          |
          v
rendered exact change
          |
          v
PLAN
          |
     explicit approval
          |
          v
APPLY workflow
          |
          v
postcheck + rediscovery
~~~

Operations are allow-listed and version-aware.

No subsystem receives a generic “execute arbitrary CLI” permission as its normal mutation mechanism.

## AI boundary

AI is an intent translator and explanation layer.

It can:

- interpret a natural-language network request;
- query observed/canonical state;
- propose desired-state changes;
- explain conflicts and diffs;
- choose among valid structured operations.

It cannot:

- manufacture observed evidence;
- declare an unsupported link confirmed;
- invent ports/devices/capabilities;
- bypass operation validators;
- write arbitrary production CLI.

## OSS composition principle

The product should remain an integration layer whenever mature OSS already exists.

Before custom implementation, evaluate existing projects and their licensing, maintenance and fit.

A dependency is preferred when it replaces a generic subsystem without compromising deterministic behavior.

A custom implementation is justified when the missing functionality is specific to the product's core loop:

~~~text
discover -> reconcile -> visualize -> desire -> diff -> plan -> approve -> apply -> verify
~~~
