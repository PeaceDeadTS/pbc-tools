import importlib
import json
import re
from dataclasses import dataclass
from pathlib import Path

from fastapi import FastAPI

from app.core.config import MANIFEST_PATH

_TOOL_ID = re.compile(r"^[a-z][a-z0-9_]{0,31}$")
_TOOL_PATH = re.compile(r"^/[a-z][a-z0-9_-]{0,31}$")


@dataclass(frozen=True)
class ToolSpec:
    id: str
    path: str


def load_manifest(path: Path = MANIFEST_PATH) -> list[ToolSpec]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list) or not raw:
        raise RuntimeError(f"{path} must be a non-empty list of tools")

    specs: list[ToolSpec] = []
    seen_paths: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            raise RuntimeError(f"tool entry must be an object, got {item!r}")
        tool_id = item.get("id")
        tool_path = item.get("path")
        if not isinstance(tool_id, str) or not _TOOL_ID.fullmatch(tool_id):
            raise RuntimeError(f"invalid tool id: {tool_id!r}")
        if not isinstance(tool_path, str) or not _TOOL_PATH.fullmatch(tool_path):
            raise RuntimeError(f"invalid tool path: {tool_path!r}")
        if tool_id in {spec.id for spec in specs} or tool_path in seen_paths:
            raise RuntimeError(f"duplicate tool: {tool_id} {tool_path}")
        seen_paths.add(tool_path)
        specs.append(ToolSpec(id=tool_id, path=tool_path))
    return specs


def mount_plugins(app: FastAPI, specs: list[ToolSpec]) -> None:
    mounted: list[dict[str, str]] = []
    for spec in specs:
        module = importlib.import_module(f"app.plugins.{spec.id}")
        router = getattr(module, "router", None)
        if router is None:
            raise RuntimeError(f"app.plugins.{spec.id} must export router")
        app.include_router(router, prefix=f"/api/{spec.id}")
        mounted.append({"id": spec.id, "path": spec.path})
    app.state.tools = mounted
