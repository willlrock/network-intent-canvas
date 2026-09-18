# Contributing

The main project rule is **OSS first**.

Before implementing a feature, check whether a maintained open-source project already provides it. Prefer adapters and composition over a parallel implementation.

Do not introduce:

- a second topology engine while NetSim is the selected topology foundation;
- a second terminal/CLI renderer;
- hand-authored copies of hardware already present in NetBox Device Type Library;
- custom device SVGs/images when upstream assets exist;
- arbitrary LLM-generated device commands.

Custom code should be limited to the missing integration/orchestration layer.

When adding a dependency or vendored/submodule upstream, document:

1. repository URL;
2. pinned version/commit;
3. license;
4. what responsibility it replaces in our own code.
