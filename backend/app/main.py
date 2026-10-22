from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.errors import ToolError, error_body
from app.core.plugins import load_manifest, mount_plugins


def create_app() -> FastAPI:
    app = FastAPI(title="PBC Tools")
    mount_plugins(app, load_manifest())

    @app.get("/api/health")
    def health() -> dict[str, bool]:
        return {"ok": True}

    @app.get("/api/tools")
    def tools(request: Request) -> dict[str, list[dict[str, str]]]:
        return {"tools": request.app.state.tools}

    @app.exception_handler(ToolError)
    async def tool_error(_request: Request, exc: ToolError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_body(exc.code, exc.params),
        )

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_request: Request, _exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(status_code=422, content=error_body("invalid_request"))

    return app


app = create_app()
