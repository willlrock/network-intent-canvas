# Third-party notices

Network Intent Canvas intentionally reuses upstream open-source projects instead of recreating their functionality.

## NetSim

Repository: https://github.com/joxorsayan/netsim  
Pinned commit: `fb07a807f86f2daa64822b54239e3fcb53850693`  
License: MIT  
Copyright (c) 2025 Sayan Roy Chowdhury

NetSim is used as a Git submodule and currently provides the browser topology editor, device/link workflow, CLI, simulation engine, automation/intent features and FastAPI application.

Its original license remains available inside `vendor/netsim/LICENSE`.

## NetBox Device Type Library

Repository: https://github.com/netbox-community/devicetype-library  
Pinned commit: `5c03c1a47b1f0bb504523b849d21a8575bfe80f4`  
License: CC0 1.0 Universal

The library is used as a Git submodule and is the source for hardware definitions, interfaces and existing front/rear elevation images.

Its original license remains available inside `vendor/netbox-device-type-library/LICENSE.txt`.

## Policy

When another OSS project already provides a capability, prefer an adapter or integration over copying/reimplementing it. Preserve upstream attribution and license obligations.
