from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .device_library import DeviceTypeLibrary, DeviceTypeLibraryUnavailable
from .discovery import RouterOSDiscoveryService, RouterOSTarget
from .models import DiscoverySnapshot
from .store import ObservationStore

ROOT = Path(__file__).resolve().parents[1]
DEVICE_LIBRARY_ROOT = ROOT / "vendor" / "netbox-device-type-library"
CACHE_ROOT = ROOT / ".cache"
STATE_ROOT = ROOT / ".state"

library = DeviceTypeLibrary(
    DEVICE_LIBRARY_ROOT,
    cache_path=CACHE_ROOT / "device-type-index.json",
)
observation_store = ObservationStore(
    Path(
        os.getenv(
            "NIC_OBSERVATION_PATH",
            str(STATE_ROOT / "observed_topology.json"),
        )
    )
)
discovery_service = RouterOSDiscoveryService(library)

app = FastAPI(
    title="Network Intent Canvas",
    version="0.2.0",
    description=(
        "OBSERVE-only discovery API. No configuration write endpoints are "
        "exposed at this milestone."
    ),
)


class RouterOSDiscoveryRequest(BaseModel):
    targets: list[RouterOSTarget] = Field(min_length=1, max_length=64)


@app.get("/", tags=["system"])
def root() -> dict[str, object]:
    return {
        "name": "Network Intent Canvas",
        "mode": "OBSERVE",
        "docs": "/docs",
        "authentication": False,
        "network_binding": (
            "run locally on 127.0.0.1 until authentication exists"
        ),
    }


@app.get("/api/hardware/status", tags=["hardware-catalog"])
def hardware_status() -> dict[str, object]:
    return {
        "provider": "netbox-community/devicetype-library",
        "available": library.available,
        "cache_ready": bool(
            library.cache_path and library.cache_path.is_file()
        ),
    }


@app.get("/api/hardware/device-types", tags=["hardware-catalog"])
def hardware_device_types(
    q: str = Query(default="", max_length=120),
    manufacturer: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=500),
) -> dict[str, object]:
    try:
        items = library.search(
            query=q,
            manufacturer=manufacturer,
            limit=limit,
        )
    except DeviceTypeLibraryUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "provider": "netbox-community/devicetype-library",
        "count": len(items),
        "items": items,
    }


@app.get(
    "/api/hardware/device-types/{slug}",
    tags=["hardware-catalog"],
)
def hardware_device_type(slug: str) -> dict[str, object]:
    try:
        item = library.get(slug)
    except DeviceTypeLibraryUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Device type not found",
        )
    return item


@app.get(
    "/api/hardware/device-types/{slug}/image/{side}",
    tags=["hardware-catalog"],
)
def hardware_device_image(slug: str, side: str) -> FileResponse:
    if side not in {"front", "rear"}:
        raise HTTPException(
            status_code=400,
            detail="side must be front or rear",
        )
    try:
        image = library.find_image(slug, side)
    except DeviceTypeLibraryUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Upstream device image not available",
        )
    return FileResponse(image)


@app.post(
    "/api/discovery/routeros",
    response_model=DiscoverySnapshot,
    tags=["discovery"],
)
def discover_routeros(
    request: RouterOSDiscoveryRequest,
) -> DiscoverySnapshot:
    try:
        snapshot = discovery_service.discover(request.targets)
    except DeviceTypeLibraryUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    observation_store.save(snapshot)
    return snapshot


@app.get(
    "/api/topology/observed",
    response_model=DiscoverySnapshot,
    tags=["topology"],
)
def observed_topology() -> DiscoverySnapshot:
    snapshot = observation_store.load()
    if snapshot is None:
        raise HTTPException(
            status_code=404,
            detail="No discovery snapshot exists yet",
        )
    return snapshot
