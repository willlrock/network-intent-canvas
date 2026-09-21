from __future__ import annotations

import json
import re
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
    part_number: str | None
    source_path: Path
    front_image: bool
    rear_image: bool
    interface_count: int

    def summary(self) -> dict[str, Any]:
        return {
            "slug": self.slug,
            "manufacturer": self.manufacturer,
            "model": self.model,
            "part_number": self.part_number,
            "interface_count": self.interface_count,
            "front_image": self.front_image,
            "rear_image": self.rear_image,
            "source_path": self.source_path.as_posix(),
        }


class DeviceTypeLibrary:
    """Read-only adapter over netbox-community/devicetype-library.

    Upstream YAML remains authoritative. The local JSON index stores lookup
    metadata only so API requests do not parse thousands of YAML files.
    """

    def __init__(self, root: Path | str, cache_path: Path | str | None = None):
        self.root = Path(root).resolve()
        self.device_types_root = self.root / "device-types"
        self.elevation_images_root = self.root / "elevation-images"
        self.cache_path = Path(cache_path).resolve() if cache_path else None
        self._index: dict[str, DeviceTypeRecord] | None = None

    @property
    def available(self) -> bool:
        return self.device_types_root.is_dir()

    def _ensure_available(self) -> None:
        if not self.available:
            raise DeviceTypeLibraryUnavailable(
                "NetBox Device Type Library is not initialized. "
                "Run git submodule update --init --recursive."
            )

    def _definition_paths(self) -> Iterable[Path]:
        self._ensure_available()
        yield from self.device_types_root.rglob("*.yaml")
        yield from self.device_types_root.rglob("*.yml")

    @staticmethod
    def _record_from_definition(
        path: Path, root: Path, data: dict[str, Any]
    ) -> DeviceTypeRecord | None:
        slug = str(data.get("slug") or "").strip()
        manufacturer = str(data.get("manufacturer") or "").strip()
        model = str(data.get("model") or "").strip()
        if not slug or not manufacturer or not model:
            return None
        interfaces = data.get("interfaces") or []
        return DeviceTypeRecord(
            slug=slug,
            manufacturer=manufacturer,
            model=model,
            part_number=(
                str(data.get("part_number")).strip()
                if data.get("part_number")
                else None
            ),
            source_path=path.relative_to(root),
            front_image=bool(data.get("front_image")),
            rear_image=bool(data.get("rear_image")),
            interface_count=len(interfaces) if isinstance(interfaces, list) else 0,
        )

    def _scan_index(self) -> dict[str, DeviceTypeRecord]:
        index: dict[str, DeviceTypeRecord] = {}
        for path in self._definition_paths():
            try:
                data = yaml.safe_load(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeError, yaml.YAMLError):
                continue
            if not isinstance(data, dict):
                continue
            record = self._record_from_definition(path, self.root, data)
            if record:
                index[record.slug] = record
        return index

    def build_cache(self) -> int:
        index = self._scan_index()
        self._index = index
        if self.cache_path:
            self.cache_path.parent.mkdir(parents=True, exist_ok=True)
            payload = [record.summary() for record in index.values()]
            temporary = self.cache_path.with_suffix(self.cache_path.suffix + ".tmp")
            temporary.write_text(
                json.dumps(payload, ensure_ascii=False),
                encoding="utf-8",
            )
            temporary.replace(self.cache_path)
        return len(index)

    def _load_cached_index(self) -> dict[str, DeviceTypeRecord] | None:
        if not self.cache_path or not self.cache_path.is_file():
            return None
        try:
            rows = json.loads(self.cache_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            return None
        if not isinstance(rows, list):
            return None

        index: dict[str, DeviceTypeRecord] = {}
        for row in rows:
            if not isinstance(row, dict):
                continue
            try:
                record = DeviceTypeRecord(
                    slug=str(row["slug"]),
                    manufacturer=str(row["manufacturer"]),
                    model=str(row["model"]),
                    part_number=(
                        str(row["part_number"]) if row.get("part_number") else None
                    ),
                    source_path=Path(str(row["source_path"])),
                    front_image=bool(row.get("front_image")),
                    rear_image=bool(row.get("rear_image")),
                    interface_count=int(row.get("interface_count", 0)),
                )
            except (KeyError, TypeError, ValueError):
                continue
            index[record.slug] = record
        return index

    def _build_index(self) -> dict[str, DeviceTypeRecord]:
        if self._index is not None:
            return self._index
        cached = self._load_cached_index()
        self._index = cached if cached is not None else self._scan_index()
        return self._index

    def search(
        self,
        query: str = "",
        manufacturer: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        query_folded = query.strip().casefold()
        manufacturer_folded = (
            manufacturer.strip().casefold() if manufacturer else None
        )

        matches: list[DeviceTypeRecord] = []
        for record in self._build_index().values():
            if (
                manufacturer_folded
                and record.manufacturer.casefold() != manufacturer_folded
            ):
                continue
            if query_folded:
                haystack = (
                    f"{record.manufacturer} {record.model} "
                    f"{record.part_number or ''} {record.slug}"
                ).casefold()
                if query_folded not in haystack:
                    continue
            matches.append(record)

        matches.sort(
            key=lambda item: (
                item.manufacturer.casefold(),
                item.model.casefold(),
            )
        )
        return [
            record.summary()
            for record in matches[: max(1, min(limit, 500))]
        ]

    @staticmethod
    def _normalize_model(value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "", value.casefold())

    def match_model(
        self, manufacturer: str, model: str
    ) -> dict[str, Any] | None:
        manufacturer_folded = manufacturer.casefold().strip()
        wanted = self._normalize_model(model)
        if not wanted:
            return None

        exact: list[DeviceTypeRecord] = []
        prefix: list[DeviceTypeRecord] = []
        for record in self._build_index().values():
            if record.manufacturer.casefold() != manufacturer_folded:
                continue
            candidates = [record.model]
            if record.part_number:
                candidates.append(record.part_number)
            normalized = [self._normalize_model(value) for value in candidates]
            if wanted in normalized:
                exact.append(record)
                continue
            if len(wanted) >= 6 and any(
                item.startswith(wanted) or wanted.startswith(item)
                for item in normalized
                if item
            ):
                prefix.append(record)

        candidates = exact or prefix
        if len(candidates) != 1:
            return None
        return candidates[0].summary()

    def get(self, slug: str) -> dict[str, Any] | None:
        record = self._build_index().get(slug)
        if record is None:
            return None

        path = self.root / record.source_path
        try:
            definition = yaml.safe_load(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, yaml.YAMLError):
            return None
        if not isinstance(definition, dict):
            return None

        return {
            "source": "netbox-community/devicetype-library",
            "source_path": record.source_path.as_posix(),
            "definition": definition,
            "assets": {
                "front": self.find_image(slug, "front") is not None,
                "rear": self.find_image(slug, "rear") is not None,
            },
        }

    def find_image(self, slug: str, side: str) -> Path | None:
        if side not in {"front", "rear"}:
            raise ValueError("side must be front or rear")

        record = self._build_index().get(slug)
        if record is None or not self.elevation_images_root.is_dir():
            return None

        manufacturer_dir = self.elevation_images_root / record.manufacturer
        if not manufacturer_dir.is_dir():
            return None

        candidates = sorted(manufacturer_dir.glob(f"{slug}.{side}.*"))
        return candidates[0] if candidates else None
