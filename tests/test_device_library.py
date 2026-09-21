from pathlib import Path

from network_intent_canvas.device_library import DeviceTypeLibrary


def _write_device(
    path: Path,
    model: str,
    slug: str,
    part_number: str | None = None,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    extra = f"part_number: {part_number}\n" if part_number else ""
    path.write_text(
        f"""manufacturer: MikroTik
model: {model}
slug: {slug}
{extra}interfaces:
  - name: ether1
    type: 2.5gbase-t
  - name: sfp-sfpplus1
    type: 10gbase-x-sfpp
""",
        encoding="utf-8",
    )


def test_cache_avoids_rescanning_for_normal_lookup(
    tmp_path: Path,
) -> None:
    root = tmp_path / "library"
    cache = tmp_path / "cache" / "device-index.json"
    _write_device(
        root / "device-types" / "MikroTik" / "RB5009.yaml",
        "RB5009UG+S+IN",
        "mikrotik-rb5009ug-plus-s-plus-in",
    )

    builder = DeviceTypeLibrary(root, cache_path=cache)
    assert builder.build_cache() == 1
    assert cache.is_file()

    reader = DeviceTypeLibrary(root, cache_path=cache)
    results = reader.search("RB5009")
    assert results[0]["interface_count"] == 2

    detail = reader.get("mikrotik-rb5009ug-plus-s-plus-in")
    assert detail is not None
    assert detail["definition"]["interfaces"][0]["name"] == "ether1"


def test_model_match_is_deterministic_prefix_not_fuzzy_guess(
    tmp_path: Path,
) -> None:
    root = tmp_path / "library"
    cache = tmp_path / "cache.json"
    _write_device(
        root / "device-types" / "MikroTik" / "RB5009.yaml",
        "RB5009UG+S+IN",
        "mikrotik-rb5009ug-plus-s-plus-in",
    )

    library = DeviceTypeLibrary(root, cache_path=cache)
    library.build_cache()

    match = library.match_model("MikroTik", "RB5009UG+S+")
    assert match is not None
    assert match["slug"] == "mikrotik-rb5009ug-plus-s-plus-in"

    assert (
        library.match_model(
            "MikroTik",
            "completely-unknown-model",
        )
        is None
    )
