from network_intent_canvas.models import (
    ArpEntry,
    DeviceObservation,
    FdbEntry,
    InterfaceObservation,
    NeighborObservation,
)
from network_intent_canvas.topology import build_snapshot


def test_neighbor_creates_observed_link_when_peer_not_discovered() -> None:
    switch = DeviceObservation(
        device_id="SW-01",
        name="SW-01",
        management_address="192.0.2.10",
        vendor="MikroTik",
        model="CRS326-24G-2S+RM",
        interfaces=[
            InterfaceObservation(name="ether8"),
            InterfaceObservation(name="ether15"),
        ],
        neighbors=[
            NeighborObservation(
                local_interface="ether8,bridge-main",
                peer_name="U6PRO-03",
                peer_interface="eth0",
            )
        ],
        fdb=[
            FdbEntry(
                interface="ether15",
                mac_address="AA:BB:CC:DD:EE:FF",
                dynamic=True,
            )
        ],
        arp=[
            ArpEntry(
                interface="bridge-main",
                ip_address="192.0.2.55",
                mac_address="AA:BB:CC:DD:EE:FF",
            )
        ],
    )

    snapshot = build_snapshot([switch])

    assert len(snapshot.links) == 1
    assert snapshot.links[0].confidence == "observed"
    assert snapshot.links[0].endpoint_a.interface == "ether8"
    assert snapshot.links[0].endpoint_b.device_id == "U6PRO-03"
    assert snapshot.links[0].endpoint_b.interface == "eth0"

    assert len(snapshot.unknown_segments) == 1
    segment = snapshot.unknown_segments[0]
    assert segment.source.interface == "ether15"
    assert segment.members[0].mac_address == "AA:BB:CC:DD:EE:FF"
    assert segment.members[0].ip_addresses == ["192.0.2.55"]


def test_two_sided_neighbor_evidence_creates_confirmed_exact_port_link() -> None:
    left = DeviceObservation(
        device_id="SW-01",
        name="SW-01",
        management_address="192.0.2.10",
        vendor="MikroTik",
        interfaces=[InterfaceObservation(name="sfp-sfpplus1")],
        neighbors=[
            NeighborObservation(
                local_interface="sfp-sfpplus1",
                peer_name="SW-02",
                peer_interface="sfp-sfpplus2",
            )
        ],
    )
    right = DeviceObservation(
        device_id="SW-02",
        name="SW-02",
        management_address="192.0.2.11",
        vendor="MikroTik",
        interfaces=[InterfaceObservation(name="sfp-sfpplus2")],
        neighbors=[
            NeighborObservation(
                local_interface="sfp-sfpplus2",
                peer_name="SW-01",
                peer_interface="sfp-sfpplus1",
            )
        ],
    )

    snapshot = build_snapshot([left, right])

    assert len(snapshot.links) == 1
    link = snapshot.links[0]
    assert link.confidence == "confirmed"
    assert len(link.evidence) == 2
    assert {
        (link.endpoint_a.device_id, link.endpoint_a.interface),
        (link.endpoint_b.device_id, link.endpoint_b.interface),
    } == {
        ("SW-01", "sfp-sfpplus1"),
        ("SW-02", "sfp-sfpplus2"),
    }


def test_reverse_neighbor_can_supply_missing_remote_port() -> None:
    left = DeviceObservation(
        device_id="SW-01",
        name="SW-01",
        management_address="192.0.2.10",
        vendor="MikroTik",
        interfaces=[InterfaceObservation(name="ether1")],
        neighbors=[
            NeighborObservation(
                local_interface="ether1",
                peer_name="SW-02",
                peer_interface=None,
            )
        ],
    )
    right = DeviceObservation(
        device_id="SW-02",
        name="SW-02",
        management_address="192.0.2.11",
        vendor="MikroTik",
        interfaces=[InterfaceObservation(name="ether24")],
        neighbors=[
            NeighborObservation(
                local_interface="ether24",
                peer_name="SW-01",
                peer_interface="ether1",
            )
        ],
    )

    snapshot = build_snapshot([left, right])

    assert len(snapshot.links) == 1
    link = snapshot.links[0]
    assert link.confidence == "confirmed"
    assert {
        (link.endpoint_a.device_id, link.endpoint_a.interface),
        (link.endpoint_b.device_id, link.endpoint_b.interface),
    } == {
        ("SW-01", "ether1"),
        ("SW-02", "ether24"),
    }


def test_neighbor_resolves_discovered_peer_by_management_ip() -> None:
    left = DeviceObservation(
        device_id="SW-01",
        name="SW-01",
        management_address="192.0.2.10",
        vendor="MikroTik",
        interfaces=[InterfaceObservation(name="ether1")],
        neighbors=[
            NeighborObservation(
                local_interface="ether1",
                peer_name="some-advertised-name",
                peer_interface="ether2",
                peer_management_address="192.0.2.11",
            )
        ],
    )
    right = DeviceObservation(
        device_id="SW-02",
        name="SW-02",
        management_address="192.0.2.11",
        vendor="MikroTik",
        interfaces=[InterfaceObservation(name="ether2")],
    )

    snapshot = build_snapshot([left, right])

    assert len(snapshot.links) == 1
    assert snapshot.links[0].confidence == "confirmed"
    assert snapshot.links[0].endpoint_b.device_id == "SW-02"


def test_fdb_on_known_neighbor_port_does_not_invent_more_links() -> None:
    switch = DeviceObservation(
        device_id="SW-01",
        name="SW-01",
        management_address="192.0.2.10",
        vendor="MikroTik",
        interfaces=[InterfaceObservation(name="ether24")],
        neighbors=[
            NeighborObservation(
                local_interface="ether24",
                peer_name="SW-02",
                peer_interface="ether1",
            )
        ],
        fdb=[
            FdbEntry(
                interface="ether24",
                mac_address="00:00:00:00:00:01",
            ),
            FdbEntry(
                interface="ether24",
                mac_address="00:00:00:00:00:02",
            ),
        ],
    )

    snapshot = build_snapshot([switch])
    assert len(snapshot.links) == 1
    assert snapshot.unknown_segments == []
