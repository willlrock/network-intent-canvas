from __future__ import annotations

import json
from pathlib import Path

from .models import DiscoverySnapshot


class ObservationStore:
    """Local cache for the latest live observation, not the source of truth."""

    def __init__(self, path: Path | str):
        self.path = Path(path)

    def save(self, snapshot: DiscoverySnapshot) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(self.path.suffix + ".tmp")
        temporary.write_text(snapshot.model_dump_json(indent=2), encoding="utf-8")
        temporary.replace(self.path)

    def load(self) -> DiscoverySnapshot | None:
        if not self.path.is_file():
            return None
        data = json.loads(self.path.read_text(encoding="utf-8"))
        return DiscoverySnapshot.model_validate(data)
