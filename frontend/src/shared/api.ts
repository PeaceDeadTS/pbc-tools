export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly params: Record<string, string | number>;

  constructor(status: number, code: string, params: Record<string, string | number>) {
    super(code);
    this.status = status;
    this.code = code;
    this.params = params;
  }
}

type ErrorBody = {
  error?: {
    code?: string;
    params?: Record<string, string | number>;
  };
};

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'request_failed', {});
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = payload as ErrorBody | null;
    throw new ApiError(
      response.status,
      failure?.error?.code ?? 'invalid_request',
      failure?.error?.params ?? {},
    );
  }

  return payload as T;
}
