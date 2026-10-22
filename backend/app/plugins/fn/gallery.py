from dataclasses import dataclass

ALLOWED_EXTENSIONS = (
    "png",
    "jpg",
    "jpeg",
    "webp",
    "svg",
    "pdf",
    "ogg",
    "ogv",
    "oga",
    "flac",
    "opus",
    "wav",
    "webm",
    "mp3",
    "midi",
    "mid",
    "mpg",
    "mpeg",
)

MAX_GALLERY_ITEMS = 500


@dataclass(frozen=True)
class GalleryFailure:
    code: str
    params: dict[str, str | int]


def validate_filename(base_name: str) -> str | GalleryFailure:
    if "#" not in base_name:
        return GalleryFailure("missing_hash", {})

    if base_name.startswith("File:") or base_name.startswith("Media:"):
        base_name = base_name.split(":", 1)[1]
    elif ":" in base_name:
        return GalleryFailure("invalid_prefix", {})

    if "." in base_name:
        extension = base_name.rsplit(".", 1)[-1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            return GalleryFailure(
                "invalid_extension",
                {
                    "extension": extension,
                    "allowed_extensions": ", ".join(ALLOWED_EXTENSIONS),
                },
            )
    else:
        base_name += ".jpg"

    return base_name


def generate_gallery(
    base_name: str,
    start_num: int,
    end_num: int,
    num_length: int,
    tabber_title: str,
    tabber_mode: str,
) -> str | GalleryFailure:
    validated = validate_filename(base_name)
    if isinstance(validated, GalleryFailure):
        return validated

    if start_num > end_num:
        return GalleryFailure("start_greater_than_end", {})
    if start_num < 0 or end_num < 0 or num_length < 0:
        return GalleryFailure("negative_value", {})
    count = end_num - start_num + 1
    if count > MAX_GALLERY_ITEMS:
        return GalleryFailure("range_too_large", {"max": MAX_GALLERY_ITEMS})

    files = [
        f"File:{validated.replace('#', str(number).zfill(num_length))}"
        for number in range(start_num, end_num + 1)
    ]
    gallery = "\n".join(files)
    if tabber_mode == "first":
        opening = f"<tabber>{tabber_title}=\n<gallery mode=\"nolines\">\n"
        closing = "\n</gallery>\n</tabber>"
    else:
        opening = f"|-|{tabber_title}=\n<gallery mode=\"nolines\">\n"
        closing = "\n</gallery>\n"
    return f"{opening}{gallery}{closing}"
