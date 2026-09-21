from __future__ import annotations

from pathlib import Path

from .device_library import DeviceTypeLibrary


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    library = DeviceTypeLibrary(
        root / "vendor" / "netbox-device-type-library",
        cache_path=root / ".cache" / "device-type-index.json",
    )
    count = library.build_cache()
    print(f"Indexed {count} device types into {library.cache_path}")


if __name__ == "__main__":
    main()
