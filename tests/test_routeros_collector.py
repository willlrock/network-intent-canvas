import pytest

from network_intent_canvas.discovery.routeros import (
    RouterOSCollector,
    RouterOSCommandError,
)


def test_normalize_textfsm_records() -> None:
    rows = RouterOSCollector._normalize_records(
        [
            {
                "NAME": "ether1",
                "STATUS": "R",
                "MAC_ADDRESS": "AA:BB:CC:DD:EE:FF",
            }
        ]
    )
    assert rows == [
        {
            "name": "ether1",
            "status": "R",
            "mac_address": "AA:BB:CC:DD:EE:FF",
        }
    ]


def test_unparsed_cli_is_rejected_instead_of_guessed() -> None:
    with pytest.raises(RouterOSCommandError):
        RouterOSCollector._normalize_records(
            "raw RouterOS output that was not parsed"
        )


def test_routeros_arp_command_matches_upstream_ntc_template() -> None:
    assert RouterOSCollector.OPTIONAL_COMMANDS["arp"] == "/ip arp print"
