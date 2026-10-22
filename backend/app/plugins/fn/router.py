from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.errors import ToolError
from app.plugins.fn.gallery import GalleryFailure, generate_gallery

router = APIRouter()


class GalleryRequest(BaseModel):
    base_name: str = Field(min_length=1, max_length=240)
    start_num: int
    end_num: int
    num_length: int
    tabber_title: str = Field(min_length=1, max_length=300)
    tabber_mode: Literal["first", "additional"]


@router.post("/gallery")
def create_gallery(body: GalleryRequest) -> dict[str, str]:
    result = generate_gallery(
        body.base_name,
        body.start_num,
        body.end_num,
        body.num_length,
        body.tabber_title,
        body.tabber_mode,
    )
    if isinstance(result, GalleryFailure):
        raise ToolError(result.code, **result.params)
    return {"wikitext": result}
