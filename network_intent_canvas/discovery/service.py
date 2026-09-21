from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed

from ..device_library import DeviceTypeLibrary
from ..models import DeviceObservation, DiscoverySnapshot, DiscoveryWarning
from ..topology import build_snapshot
from .routeros import RouterOSCollector, RouterOSTarget


class RouterOSDiscoveryService:
    def __init__(self, device_library: DeviceTypeLibrary):
        self.collector = RouterOSCollector(device_library)

    def discover(self, targets: list[RouterOSTarget]) -> DiscoverySnapshot:
        devices: list[DeviceObservation] = []
        warnings: list[DiscoveryWarning] = []

        if not targets:
            return build_snapshot(devices, warnings)

        workers = min(8, len(targets))
        with ThreadPoolExecutor(max_workers=workers) as executor:
            future_to_target = {
                executor.submit(self.collector.collect, target): target
                for target in targets
            }
            for future in as_completed(future_to_target):
                target = future_to_target[future]
                try:
                    device, device_warnings = future.result()
                    devices.append(device)
                    warnings.extend(device_warnings)
                except Exception as exc:
                    warnings.append(
                        DiscoveryWarning(
                            source_device=target.host,
                            command="connect/discover",
                            message=str(exc),
                        )
                    )

        devices.sort(key=lambda device: device.name.casefold())
        return build_snapshot(devices, warnings)
