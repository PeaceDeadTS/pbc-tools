class ToolError(Exception):
    """Domain failure a tool page can translate by `code`."""

    def __init__(self, code: str, status_code: int = 400, **params: str | int) -> None:
        super().__init__(code)
        self.code = code
        self.status_code = status_code
        self.params = params


def error_body(code: str, params: dict[str, str | int] | None = None) -> dict[str, dict[str, object]]:
    return {"error": {"code": code, "params": params or {}}}
