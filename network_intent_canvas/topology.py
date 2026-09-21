from __future__ import annotations

import hashlib
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone

from .models import (
    ArpEntry,
    DeviceObservation,
    DiscoverySnapshot,
    DiscoveryWarning,
    Endpoint,
    Evidence,
    NeighborObservation,
    TopologyLink,
    UnknownMember,
    UnknownSegment,
)


def _physical_interface_name(value: str) -> str:
    return value.split(",", 1)[0].strip()


def _normalize_name(value: str) -> str:
    return value.strip().casefold()


def _normalize_mac(value: str | None) -> str | None:
    if not value:
        return None
    return value.replace("-", ":").upper().strip()


def _management_host(value: str | None) -> str | None:
    if not value:
        return None
    return value.split("/", 1)[0].strip()


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
        mac = _normalize_mac(entry.mac_address)
        if not mac:
            continue
        if entry.ip_address not in result[mac]:
            result[mac].append(entry.ip_address)
    return result


@dataclass(frozen=True)
class _ResolvedNeighbor:
    source_device_id: str
    local_interface: str
    peer_device_id: str
    peer_interface: str | None
    peer_is_discovered: bool
    original: NeighborObservation


class _DeviceResolver:
    """Resolve neighbor identities only from observed deterministic identifiers."""

    def __init__(self, devices: list[DeviceObservation]):
        self.by_name: dict[str, str] = {}
        self.by_management_ip: dict[str, str] = {}
        self.by_interface_mac: dict[str, str] = {}

        for device in devices:
            for value in {device.device_id, device.name}:
                if value:
                    self.by_name[_normalize_name(value)] = device.device_id

            host = _management_host(device.management_address)
            if host:
                self.by_management_ip[host] = device.device_id

            for interface in device.interfaces:
                mac = _normalize_mac(interface.mac_address)
                if mac:
                    self.by_interface_mac[mac] = device.device_id

    def resolve(self, neighbor: NeighborObservation) -> tuple[str, bool]:
        peer_name = neighbor.peer_name.strip()
        if peer_name:
            match = self.by_name.get(_normalize_name(peer_name))
            if match:
                return match, True

        management = _management_host(neighbor.peer_management_address)
        if management:
            match = self.by_management_ip.get(management)
            if match:
                return match, True

        mac = _normalize_mac(neighbor.peer_mac_address)
        if mac:
            match = self.by_interface_mac.get(mac)
            if match:
                return match, True

        fallback = peer_name or management or mac or "unknown-peer"
        return fallback, False


def _resolve_neighbors(
    devices: list[DeviceObservation],
) -> list[_ResolvedNeighbor]:
    resolver = _DeviceResolver(devices)
    facts: list[_ResolvedNeighbor] = []

    for device in devices:
        for neighbor in device.neighbors:
            local_interface = _physical_interface_name(neighbor.local_interface)
            if not local_interface:
                continue

            peer_device_id, peer_is_discovered = resolver.resolve(neighbor)
            if peer_device_id == device.device_id:
                continue

            peer_interface = (
                _physical_interface_name(neighbor.peer_interface)
                if neighbor.peer_interface
                else None
            )
            if peer_interface == "":
                peer_interface = None

            facts.append(
                _ResolvedNeighbor(
                    source_device_id=device.device_id,
                    local_interface=local_interface,
                    peer_device_id=peer_device_id,
                    peer_interface=peer_interface,
                    peer_is_discovered=peer_is_discovered,
                    original=neighbor,
                )
            )

    # If one side does not report the remote port but the reverse observation
    # does, correlate the two neighbor records instead of guessing.
    enriched: list[_ResolvedNeighbor] = []
    for fact in facts:
        if fact.peer_interface is not None or not fact.peer_is_discovered:
            enriched.append(fact)
            continue

        inferred_peer_interface = None
        for reverse in facts:
            if (
                reverse.source_device_id == fact.peer_device_id
                and reverse.peer_device_id == fact.source_device_id
                and reverse.peer_interface == fact.local_interface
            ):
                inferred_peer_interface = reverse.local_interface
                break

        enriched.append(
            _ResolvedNeighbor(
                source_device_id=fact.source_device_id,
                local_interface=fact.local_interface,
                peer_device_id=fact.peer_device_id,
                peer_interface=inferred_peer_interface,
                peer_is_discovered=fact.peer_is_discovered,
                original=fact.original,
            )
        )

    return enriched


def build_snapshot(
    devices: list[DeviceObservation],
    warnings: list[DiscoveryWarning] | None = None,
) -> DiscoverySnapshot:
    observed_at = datetime.now(timezone.utc)
    links_by_key: dict[str, TopologyLink] = {}
    neighbor_ports: set[tuple[str, str]] = set()

    for fact in _resolve_neighbors(devices):
        a = Endpoint(
            device_id=fact.source_device_id,
            interface=fact.local_interface,
        )
        peer_interface = fact.peer_interface or "unknown"
        b = Endpoint(
            device_id=fact.peer_device_id,
            interface=peer_interface,
        )
        link_id = _link_id(a, b)

        # "confirmed" means both endpoint devices are part of this discovery
        # snapshot and both exact ports are known. A named but undiscovered
        # neighbor remains "observed" rather than being promoted to fact.
        confidence = (
            "confirmed"
            if fact.peer_is_discovered and fact.peer_interface is not None
            else "observed"
        )
        evidence = Evidence(
            source="routeros_neighbor",
            source_device=fact.source_device_id,
            source_interface=fact.local_interface,
            observed_at=observed_at,
        )

        existing = links_by_key.get(link_id)
        if existing:
            if not any(
                item.source_device == evidence.source_device
                and item.source_interface == evidence.source_interface
                and item.source == evidence.source
                for item in existing.evidence
            ):
                existing.evidence.append(evidence)
            if confidence == "confirmed":
                existing.confidence = "confirmed"
        else:
            links_by_key[link_id] = TopologyLink(
                link_id=link_id,
                endpoint_a=a,
                endpoint_b=b,
                confidence=confidence,
                evidence=[evidence],
            )

        neighbor_ports.add((fact.source_device_id, fact.local_interface))

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
            mac = _normalize_mac(entry.mac_address)
            if mac:
                fdb_by_interface[interface].add(mac)

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
