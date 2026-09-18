from pathlib import Path

from network_intent_canvas.device_library import DeviceTypeLibrary


def test_device_type_library_preserves_upstream_schema(tmp_path: Path) -> None:
    vendor = tmp_path / "device-types" / "MikroTik"
    vendor.mkdir(parents=True)
    (vendor / "RB5009.yaml").write_text(
        """manufacturer: MikroTik
model: RB5009UG+S+IN
slug: mikrotik-rb5009ug-plus-s-plus-in
interfaces:
  - name: ether1
    type: 2.5gbase-t
  - name: sfp-sfpplus1
    type: 10gbase-x-sfpp
""",
        encoding="utf-8",
    )

    library = DeviceTypeLibrary(tmp_path)
    results = library.search("RB5009")
    assert results[0]["interface_count"] == 2

    detail = library.get("mikrotik-rb5009ug-plus-s-plus-in")
    assert detail is not None
    assert detail["definition"]["interfaces"][0]["name"] == "ether1"
    assert detail["definition"]["interfaces"][0]["type"] == "2.5gbase-t"


def test_device_type_library_uses_upstream_elevation_images(tmp_path: Path) -> None:
    vendor = tmp_path / "device-types" / "MikroTik"
    vendor.mkdir(parents=True)
    (vendor / "CRS326.yaml").write_text(
        """manufacturer: MikroTik
model: CRS326-24G-2S+RM
slug: mikrotik-crs326-24g-2s-plus-rm
front_image: true
rear_image: true
interfaces: []
""",
        encoding="utf-8",
    )
    images = tmp_path / "elevation-images" / "MikroTik"
    images.mkdir(parents=True)
    front = images / "mikrotik-crs326-24g-2s-plus-rm.front.png"
    front.write_bytes(b"not-a-real-image")

    library = DeviceTypeLibrary(tmp_path)
    assert library.find_image("mikrotik-crs326-24g-2s-plus-rm", "front") == front
    assert library.find_image("mikrotik-crs326-24g-2s-plus-rm", "rear") is None
