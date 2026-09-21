# Third-party notices

Network Intent Canvas intentionally composes existing open-source projects instead of recreating their functionality.

## NetBox Device Type Library

Repository: https://github.com/netbox-community/devicetype-library  
Pinned submodule commit: 5c03c1a47b1f0bb504523b849d21a8575bfe80f4  
License: CC0 1.0 Universal

Used as the hardware definition and existing elevation-image source.

## Netmiko

Repository: https://github.com/ktbyers/netmiko  
Runtime version: 4.7.0  
License: MIT

Used for RouterOS SSH transport. Netmiko already includes the mikrotik_routeros platform driver.

## NTC Templates

Repository: https://github.com/networktocode/ntc-templates  
Runtime version: 9.3.0  
License: Apache-2.0

Used for deterministic TextFSM parsing of RouterOS commands including interface, identity/resource, neighbor, ARP and bridge-host output.

## Nautobot ecosystem

Nautobot, Golden Config and Nornir are planned integration targets for source-of-truth, compliance and execution. They are not vendored into this repository at this milestone.

## Policy

Before implementing a network capability, first check whether a maintained OSS project already provides it. Prefer adapters and composition over a parallel implementation.
