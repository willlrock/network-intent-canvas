# Contributing

The main project rule is **OSS first, deterministic always**.

Read these documents before changing architecture:

- PROJECT.md — product definition and invariants;
- ARCHITECTURE.md — state and integration boundaries;
- ROADMAP.md — ordered milestones.

Before implementing a feature, check whether a maintained open-source project already provides it. Prefer adapters and composition over a parallel implementation.

Do not introduce:

- a second hand-built hardware catalogue when the NetBox Device Type Library already contains the device;
- custom device SVGs/images when upstream assets exist;
- a new topology canvas before suitable OSS editors/viewers have been evaluated;
- a duplicate terminal/SSH implementation when an established library already fits;
- arbitrary LLM-generated device commands;
- a mutation path available only to AI;
- inferred physical links promoted to facts without evidence.

Custom code should focus on:

- evidence reconciliation;
- deterministic intent models;
- vendor-specific gaps not covered by existing OSS;
- adapters between upstream projects;
- the observe -> desired -> diff -> plan -> approve -> apply -> verify workflow.

When adding a dependency, submodule or vendored upstream, document:

1. repository URL;
2. pinned version/commit;
3. license;
4. what responsibility it replaces in our own code;
5. why integration is preferable to implementing the subsystem ourselves.

New network-write functionality must first exist as a structured PLAN operation with tests. Do not add generic raw-CLI write endpoints.
