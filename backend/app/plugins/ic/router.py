from fastapi import APIRouter

router = APIRouter()


@router.get("")
def info() -> dict[str, str]:
    # Cropping stays in the browser. The route exists so every tool is mounted the same way.
    return {"id": "ic", "mode": "client"}
