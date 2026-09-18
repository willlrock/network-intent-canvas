from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import yaml


class DeviceTypeLibraryUnavailable(RuntimeError):
    """Raised when the NetBox device type library submodule is unavailable."""


@dataclass(frozen=True)
class DeviceTypeRecord:
    slug: str
    manufacturer: str
    model: str
    source_path: Path
    definition: dict[str, Any]

    def summary(self) -> dict[str, Any]:
        interfaces = self.definition.get("interfaces") or []
        return {
            "slug": self.slug,
            "manufacturer": self.manufacturer,
            "model": self.model,
            "part_number": self.definition.get("part_number"),
            "interface_count": len(interfaces),
            "front_image": bool(self.definition.get("front_image")),
            "rear_image": bool(self.definition.get("rear_image")),
            "source_path": self.source_path.as_posix(),
        }


class DeviceTypeLibrary:
    """Thin read-only adapter over netbox-community/devicetype-library.

    Keep the upstream NetBox schema intact. Network Intent Canvas should not
    maintain a second hand-authored hardware catalogue.
    """

    def __init__(self, root: Path | str):
        self.root = Path(root).resolve()
        self.device_types_root = self.root / "device-types"
        self.elevation_images_root = self.root / "elevation-images"
        self._index: dict[str, DeviceTypeRecord] | None = None

    @property
    def available(self) -> bool:
        return self.device_types_root.is_dir()

    def _ensure_available(self) -> None:
        if not self.available:
            raise DeviceTypeLibraryUnavailable(
                "NetBox Device Type Library is not initialized. "
                "Run `git submodule update --init --recursive`."
            )

    def _definition_paths(self) -> Iterable[Path]:
        self._ensure_available()
        yield from self.device_types_root.rglob("*.yaml")
        yield from self.device_types_root.rglob("*.yml")

    def _build_index(self) -> dict[str, DeviceTypeRecord]:
        if self._index is not None:
            return self._index

        index: dict[str, DeviceTypeRecord] = {}
        for path in self._definition_paths():
            try:
                data = yaml.safe_load(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeError, yaml.YAMLError):
                continue
            if not isinstance(data, dict):
                continue

            slug = str(data.get("slug") or "").strip()
            manufacturer = str(data.get("manufacturer") or "").strip()
            model = str(data.get("model") or "").strip()
            if not slug or not manufacturer or not model:
                continue

            index[slug] = DeviceTypeRecord(
                slug=slug,
                manufacturer=manufacturer,
                model=model,
                source_path=path.relative_to(self.root),
                definition=data,
            )

        self._index = index
        return index

    def search(
        self,
        query: str = "",
        manufacturer: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        query_folded = query.strip().casefold()
        manufacturer_folded = manufacturer.strip().casefold() if manufacturer else None

        matches: list[DeviceTypeRecord] = []
        for record in self._build_index().values():
            if manufacturer_folded and record.manufacturer.casefold() != manufacturer_folded:
                continue
            if query_folded:
                haystack = f"{record.manufacturer} {record.model} {record.slug}".casefold()
                if query_folded not in haystack:
                    continue
            matches.append(record)

        matches.sort(key=lambda item: (item.manufacturer.casefold(), item.model.casefold()))
        return [record.summary() for record in matches[: max(1, min(limit, 500))]]

    def get(self, slug: str) -> dict[str, Any] | None:
        record = self._build_index().get(slug)
        if record is None:
            return None
        return {
            "source": "netbox-community/devicetype-library",
            "source_path": record.source_path.as_posix(),
            "definition": record.definition,
            "assets": {
                "front": self.find_image(slug, "front") is not None,
                "rear": self.find_image(slug, "rear") is not None,
            },
        }

    def find_image(self, slug: str, side: str) -> Path | None:
        if side not in {"front", "rear"}:
            raise ValueError("side must be 'front' or 'rear'")

        record = self._build_index().get(slug)
        if record is None or not self.elevation_images_root.is_dir():
            return None

        manufacturer_dir = self.elevation_images_root / record.manufacturer
        if not manufacturer_dir.is_dir():
            return None

        candidates = sorted(manufacturer_dir.glob(f"{slug}.{side}.*"))
        return candidates[0] if candidates else None
