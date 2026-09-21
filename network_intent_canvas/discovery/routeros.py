from __future__ import annotations

from typing import Any

from netmiko import ConnectHandler
from pydantic import BaseModel, Field, SecretStr

from ..device_library import DeviceTypeLibrary
from ..models import (
    ArpEntry,
    DeviceObservation,
    DiscoveryWarning,
    FdbEntry,
    InterfaceObservation,
    NeighborObservation,
)


class RouterOSTarget(BaseModel):
    host: str = Field(min_length=1, max_length=255)
    username: str = Field(min_length=1, max_length=255)
    password: SecretStr
    port: int = Field(default=22, ge=1, le=65535)
    connect_timeout: int = Field(default=10, ge=1, le=120)


class RouterOSCommandError(RuntimeError):
    pass


class RouterOSCollector:
    REQUIRED_COMMANDS = {
        "identity": "/system identity print",
        "resource": "/system resource print",
        "interfaces": "/interface print terse without-paging",
    }
    OPTIONAL_COMMANDS = {
        "routerboard": "/system routerboard print",
        "addresses": "/ip address print",
        "neighbors": "/ip neighbor print detail",
        "fdb": "/interface bridge host print terse without-paging",
        # Keep the command aligned with the upstream NTC template index.
        "arp": "/ip arp print",
    }

    def __init__(self, device_library: DeviceTypeLibrary):
        self.device_library = device_library

    @staticmethod
    def _normalize_records(value: Any) -> list[dict[str, str]]:
        if value in ("", None):
            return []
        if not isinstance(value, list):
            raise RouterOSCommandError(
                "NTC Templates did not return structured data for this command"
            )

        normalized: list[dict[str, str]] = []
        for row in value:
            if not isinstance(row, dict):
                continue
            normalized.append(
                {
                    str(key).strip().lower(): str(item).strip()
                    for key, item in row.items()
                    if item is not None
                }
            )
        return normalized

    def _send_parsed(self, connection: Any, command: str) -> list[dict[str, str]]:
        output = connection.send_command(
            command,
            use_textfsm=True,
            read_timeout=30,
        )
        return self._normalize_records(output)

    @staticmethod
    def _first(records: list[dict[str, str]]) -> dict[str, str]:
        return records[0] if records else {}

    def collect(
        self, target: RouterOSTarget
    ) -> tuple[DeviceObservation, list[DiscoveryWarning]]:
        warnings: list[DiscoveryWarning] = []
        connection = ConnectHandler(
            device_type="mikrotik_routeros",
            host=target.host,
            username=target.username,
            password=target.password.get_secret_value(),
            port=target.port,
            conn_timeout=target.connect_timeout,
            banner_timeout=target.connect_timeout,
            auth_timeout=target.connect_timeout,
            fast_cli=False,
        )

        try:
            tables: dict[str, list[dict[str, str]]] = {}
            for name, command in self.REQUIRED_COMMANDS.items():
                try:
                    tables[name] = self._send_parsed(connection, command)
                except Exception as exc:
                    raise RouterOSCommandError(
                        f"Required discovery command failed: {command}: {exc}"
                    ) from exc

            for name, command in self.OPTIONAL_COMMANDS.items():
                try:
                    tables[name] = self._send_parsed(connection, command)
                except Exception as exc:
                    tables[name] = []
                    warnings.append(
                        DiscoveryWarning(
                            source_device=target.host,
                            command=command,
                            message=str(exc),
                        )
                    )
        finally:
            connection.disconnect()

        identity = self._first(tables["identity"])
        resource = self._first(tables["resource"])
        routerboard = self._first(tables.get("routerboard", []))

        name = identity.get("name") or target.host
        model = (
            routerboard.get("hardware_model")
            or routerboard.get("board_name")
            or resource.get("board_name")
            or None
        )
        serial = routerboard.get("serial_number") or None
        version = resource.get("version") or None

        hardware_slug = None
        if model:
            match = self.device_library.match_model("MikroTik", model)
            if match:
                hardware_slug = match["slug"]

        addresses_by_interface: dict[str, list[str]] = {}
        for row in tables.get("addresses", []):
            interface = row.get("interface")
            ip = row.get("ip")
            subnet = row.get("subnet")
            if not interface or not ip:
                continue
            address = f"{ip}/{subnet}" if subnet else ip
            addresses_by_interface.setdefault(interface, []).append(address)

        interfaces: list[InterfaceObservation] = []
        for row in tables["interfaces"]:
            interface_name = row.get("name")
            if not interface_name:
                continue
            status = row.get("status", "")
            interfaces.append(
                InterfaceObservation(
                    name=interface_name,
                    kind=row.get("type") or None,
                    mac_address=row.get("mac_address") or None,
                    enabled=status != "X",
                    running=status == "R",
                    addresses=sorted(
                        addresses_by_interface.get(interface_name, [])
                    ),
                )
            )

        neighbors: list[NeighborObservation] = []
        for row in tables.get("neighbors", []):
            local_interface = row.get("interface")
            peer_name = (
                row.get("identity")
                or row.get("mac_address")
                or row.get("ip_address")
            )
            if not local_interface or not peer_name:
                continue
            neighbors.append(
                NeighborObservation(
                    local_interface=local_interface,
                    peer_name=peer_name,
                    peer_interface=row.get("interface_name") or None,
                    peer_management_address=(
                        row.get("ipv4_address")
                        or row.get("ip_address")
                        or row.get("ipv6_address")
                        or None
                    ),
                    peer_mac_address=row.get("mac_address") or None,
                    peer_platform=row.get("platform") or None,
                    peer_model=row.get("board") or None,
                    peer_version=row.get("version") or None,
                )
            )

        fdb: list[FdbEntry] = []
        for row in tables.get("fdb", []):
            interface = row.get("on_interface") or row.get("interface")
            mac = row.get("mac_address")
            if not interface or not mac:
                continue
            vlan_id = None
            try:
                vlan_id = int(row["vlan_id"]) if row.get("vlan_id") else None
            except ValueError:
                vlan_id = None
            fdb.append(
                FdbEntry(
                    interface=interface,
                    mac_address=mac,
                    vlan_id=vlan_id,
                    dynamic=row.get("dynamic") == "D",
                    local=row.get("local") == "L",
                )
            )

        arp: list[ArpEntry] = []
        for row in tables.get("arp", []):
            ip = row.get("ip_address")
            if not ip:
                continue
            arp.append(
                ArpEntry(
                    interface=row.get("interface") or None,
                    ip_address=ip,
                    mac_address=row.get("mac_address") or None,
                    status=row.get("flags") or row.get("status") or None,
                )
            )

        device = DeviceObservation(
            device_id=name,
            name=name,
            management_address=target.host,
            vendor="MikroTik",
            model=model,
            os_version=version,
            serial_number=serial,
            hardware_slug=hardware_slug,
            interfaces=interfaces,
            neighbors=neighbors,
            fdb=fdb,
            arp=arp,
        )
        return device, warnings
