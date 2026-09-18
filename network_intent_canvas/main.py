from __future__ import annotations

import sys
from pathlib import Path

from fastapi import HTTPException, Query
from fastapi.responses import FileResponse

ROOT = Path(__file__).resolve().parents[1]
NETSIM_ROOT = ROOT / "vendor" / "netsim"
DEVICE_LIBRARY_ROOT = ROOT / "vendor" / "netbox-device-type-library"

if not (NETSIM_ROOT / "app" / "main.py").is_file():
    raise RuntimeError(
        "NetSim submodule is not initialized. Run `git submodule update --init --recursive`."
    )

sys.path.insert(0, str(NETSIM_ROOT))

from app.main import app as app  # noqa: E402

from .device_library import (  # noqa: E402
    DeviceTypeLibrary,
    DeviceTypeLibraryUnavailable,
)

library = DeviceTypeLibrary(DEVICE_LIBRARY_ROOT)


@app.get("/api/hardware/status", tags=["hardware-catalog"])
def hardware_status() -> dict[str, object]:
    return {
        "provider": "netbox-community/devicetype-library",
        "available": library.available,
    }


@app.get("/api/hardware/device-types", tags=["hardware-catalog"])
def hardware_device_types(
    q: str = Query(default="", max_length=120),
    manufacturer: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=500),
) -> dict[str, object]:
    try:
        items = library.search(query=q, manufacturer=manufacturer, limit=limit)
    except DeviceTypeLibraryUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "provider": "netbox-community/devicetype-library",
        "count": len(items),
        "items": items,
    }


@app.get("/api/hardware/device-types/{slug}", tags=["hardware-catalog"])
def hardware_device_type(slug: str) -> dict[str, object]:
    try:
        item = library.get(slug)
    except DeviceTypeLibraryUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if item is None:
        raise HTTPException(status_code=404, detail="Device type not found")
    return item


@app.get("/api/hardware/device-types/{slug}/image/{side}", tags=["hardware-catalog"])
def hardware_device_image(slug: str, side: str) -> FileResponse:
    if side not in {"front", "rear"}:
        raise HTTPException(status_code=400, detail="side must be 'front' or 'rear'")
    try:
        image = library.find_image(slug, side)
    except DeviceTypeLibraryUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if image is None:
        raise HTTPException(status_code=404, detail="Upstream device image not available")
    return FileResponse(image)
