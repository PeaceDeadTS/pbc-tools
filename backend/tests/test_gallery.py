from fastapi.testclient import TestClient

from app.main import app
from app.plugins.fn.gallery import MAX_GALLERY_ITEMS, generate_gallery

client = TestClient(app)


def test_first_gallery_pads_numbers_and_strips_file_prefix() -> None:
    wikitext = generate_gallery("File:Photo #.jpg", 1, 2, 3, "Set", "first")
    assert wikitext == (
        "<tabber>Set=\n"
        "<gallery mode=\"nolines\">\n"
        "File:Photo 001.jpg\n"
        "File:Photo 002.jpg\n"
        "</gallery>\n"
        "</tabber>"
    )


def test_additional_gallery_uses_tabber_continuation() -> None:
    wikitext = generate_gallery("Media:Photo #", 8, 8, 2, "More", "additional")
    assert wikitext == (
        "|-|More=\n"
        "<gallery mode=\"nolines\">\n"
        "File:Photo 08.jpg\n"
        "</gallery>\n"
    )


def test_filename_errors() -> None:
    assert generate_gallery("Photo.jpg", 1, 1, 1, "A", "first").code == "missing_hash"
    assert generate_gallery("User:Photo #.jpg", 1, 1, 1, "A", "first").code == "invalid_prefix"
    failure = generate_gallery("Photo #.exe", 1, 1, 1, "A", "first")
    assert failure.code == "invalid_extension"
    assert failure.params["extension"] == "exe"


def test_range_errors() -> None:
    assert generate_gallery("Photo #.jpg", 5, 1, 1, "A", "first").code == "start_greater_than_end"
    assert generate_gallery("Photo #.jpg", -1, 1, 1, "A", "first").code == "negative_value"
    failure = generate_gallery("Photo #.jpg", 0, MAX_GALLERY_ITEMS, 1, "A", "first")
    assert failure.code == "range_too_large"
    assert failure.params["max"] == MAX_GALLERY_ITEMS


def test_http_gallery_and_tool_list() -> None:
    listed = client.get("/api/tools")
    assert listed.status_code == 200
    assert listed.json()["tools"] == [
        {"id": "fn", "path": "/fn"},
        {"id": "ic", "path": "/ic"},
    ]

    created = client.post(
        "/api/fn/gallery",
        json={
            "base_name": "Photo #.jpg",
            "start_num": 1,
            "end_num": 1,
            "num_length": 3,
            "tabber_title": "Set",
            "tabber_mode": "first",
        },
    )
    assert created.status_code == 200
    assert "File:Photo 001.jpg" in created.json()["wikitext"]

    rejected = client.post(
        "/api/fn/gallery",
        json={
            "base_name": "Photo.jpg",
            "start_num": 1,
            "end_num": 1,
            "num_length": 1,
            "tabber_title": "Set",
            "tabber_mode": "first",
        },
    )
    assert rejected.status_code == 400
    assert rejected.json()["error"]["code"] == "missing_hash"

    assert client.get("/api/ic").json() == {"id": "ic", "mode": "client"}
    assert client.get("/api/health").json() == {"ok": True}
