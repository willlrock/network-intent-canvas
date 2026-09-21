from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class InterfaceObservation(BaseModel):
    name: str
    kind: str | None = None
    mac_address: str | None = None
    enabled: bool = True
    running: bool = False
    addresses: list[str] = Field(default_factory=list)


class NeighborObservation(BaseModel):
    local_interface: str
    peer_name: str
    peer_interface: str | None = None
    peer_management_address: str | None = None
    peer_mac_address: str | None = None
    peer_platform: str | None = None
    peer_model: str | None = None
    peer_version: str | None = None


class FdbEntry(BaseModel):
    interface: str
    mac_address: str
    vlan_id: int | None = None
    dynamic: bool = False
    local: bool = False


class ArpEntry(BaseModel):
    interface: str | None = None
    ip_address: str
    mac_address: str | None = None
    status: str | None = None


class DeviceObservation(BaseModel):
    device_id: str
    name: str
    management_address: str
    vendor: str
    model: str | None = None
    os_version: str | None = None
    serial_number: str | None = None
    hardware_slug: str | None = None
    interfaces: list[InterfaceObservation] = Field(default_factory=list)
    neighbors: list[NeighborObservation] = Field(default_factory=list)
    fdb: list[FdbEntry] = Field(default_factory=list)
    arp: list[ArpEntry] = Field(default_factory=list)


class Endpoint(BaseModel):
    device_id: str
    interface: str


class Evidence(BaseModel):
    source: Literal["routeros_neighbor", "bridge_fdb", "arp", "manual"]
    source_device: str
    source_interface: str | None = None
    observed_at: datetime


class TopologyLink(BaseModel):
    link_id: str
    endpoint_a: Endpoint
    endpoint_b: Endpoint
    confidence: Literal["confirmed", "observed"]
    evidence: list[Evidence]


class UnknownMember(BaseModel):
    mac_address: str
    ip_addresses: list[str] = Field(default_factory=list)


class UnknownSegment(BaseModel):
    segment_id: str
    source: Endpoint
    members: list[UnknownMember]
    evidence: list[Evidence]


class DiscoveryWarning(BaseModel):
    source_device: str
    command: str
    message: str


class DiscoverySnapshot(BaseModel):
    observed_at: datetime
    devices: list[DeviceObservation]
    links: list[TopologyLink]
    unknown_segments: list[UnknownSegment]
    warnings: list[DiscoveryWarning] = Field(default_factory=list)
