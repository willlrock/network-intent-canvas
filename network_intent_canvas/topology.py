from __future__ import annotations

import hashlib
from collections import defaultdict
from datetime import datetime, timezone

from .models import (
    ArpEntry,
    DeviceObservation,
    DiscoverySnapshot,
    DiscoveryWarning,
    Endpoint,
    Evidence,
    TopologyLink,
    UnknownMember,
    UnknownSegment,
)


def _physical_interface_name(value: str) -> str:
    return value.split(",", 1)[0].strip()


def _link_id(a: Endpoint, b: Endpoint) -> str:
    ordered = sorted(
        [f"{a.device_id}:{a.interface}", f"{b.device_id}:{b.interface}"]
    )
    digest = hashlib.sha1("|".join(ordered).encode("utf-8")).hexdigest()[:12]
    return f"link-{digest}"


def _segment_id(endpoint: Endpoint) -> str:
    digest = hashlib.sha1(
        f"{endpoint.device_id}:{endpoint.interface}".encode("utf-8")
    ).hexdigest()[:12]
    return f"segment-{digest}"


def _arp_by_mac(entries: list[ArpEntry]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = defaultdict(list)
    for entry in entries:
        if not entry.mac_address:
            continue
        mac = entry.mac_address.upper()
        if entry.ip_address not in result[mac]:
            result[mac].append(entry.ip_address)
    return result


def build_snapshot(
    devices: list[DeviceObservation],
    warnings: list[DiscoveryWarning] | None = None,
) -> DiscoverySnapshot:
    observed_at = datetime.now(timezone.utc)
    links_by_key: dict[str, TopologyLink] = {}
    neighbor_ports: set[tuple[str, str]] = set()

    for device in devices:
        for neighbor in device.neighbors:
            local_interface = _physical_interface_name(neighbor.local_interface)
            if not local_interface:
                continue

            peer_name = neighbor.peer_name.strip()
            if not peer_name:
                continue

            peer_interface = (neighbor.peer_interface or "unknown").strip() or "unknown"
            a = Endpoint(device_id=device.device_id, interface=local_interface)
            b = Endpoint(device_id=peer_name, interface=peer_interface)
            link_id = _link_id(a, b)
            confidence = "confirmed" if peer_interface != "unknown" else "observed"
            evidence = Evidence(
                source="routeros_neighbor",
                source_device=device.device_id,
                source_interface=local_interface,
                observed_at=observed_at,
            )

            if link_id in links_by_key:
                links_by_key[link_id].evidence.append(evidence)
                if confidence == "confirmed":
                    links_by_key[link_id].confidence = "confirmed"
            else:
                links_by_key[link_id] = TopologyLink(
                    link_id=link_id,
                    endpoint_a=a,
                    endpoint_b=b,
                    confidence=confidence,
                    evidence=[evidence],
                )

            neighbor_ports.add((device.device_id, local_interface))

    unknown_segments: list[UnknownSegment] = []
    for device in devices:
        arp_map = _arp_by_mac(device.arp)
        fdb_by_interface: dict[str, set[str]] = defaultdict(set)

        for entry in device.fdb:
            if entry.local:
                continue
            interface = _physical_interface_name(entry.interface)
            if not interface or (device.device_id, interface) in neighbor_ports:
                continue
            fdb_by_interface[interface].add(entry.mac_address.upper())

        for interface, macs in sorted(fdb_by_interface.items()):
            endpoint = Endpoint(device_id=device.device_id, interface=interface)
            members = [
                UnknownMember(
                    mac_address=mac,
                    ip_addresses=sorted(arp_map.get(mac, [])),
                )
                for mac in sorted(macs)
            ]
            if not members:
                continue

            unknown_segments.append(
                UnknownSegment(
                    segment_id=_segment_id(endpoint),
                    source=endpoint,
                    members=members,
                    evidence=[
                        Evidence(
                            source="bridge_fdb",
                            source_device=device.device_id,
                            source_interface=interface,
                            observed_at=observed_at,
                        )
                    ],
                )
            )

    return DiscoverySnapshot(
        observed_at=observed_at,
        devices=devices,
        links=sorted(links_by_key.values(), key=lambda link: link.link_id),
        unknown_segments=unknown_segments,
        warnings=warnings or [],
    )
