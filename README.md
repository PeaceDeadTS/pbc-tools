# PBC Tools

One site for small wiki utilities. Two tools ship today:

| Path | Tool |
|---|---|
| `/fn` | Wiki gallery generator for file names like `Photo #.jpg` |
| `/ic` | Image cropper, including the PBC 2:3 preset |

The tool list is `shared/tools.json`. FastAPI and React both read it. The shell (header, tabs, language) is shared. Each tool is its own package: `backend/app/plugins/<id>/` and `frontend/src/plugins/<id>/`.

Cropping runs in the browser. The gallery generator is `POST /api/fn/gallery`. Shared routes are `GET /api/health` and `GET /api/tools`. Each plugin router is mounted at `/api/<id>`.

## Stack

- React 19.3, React Router 8, Vite 8, Tailwind CSS 4
- TypeScript 6.0.3. `typescript-eslint` 8.72 accepts only versions below 6.1
- `cropperjs` 1.7. `react-cropper` does not work with `cropperjs` 2
- FastAPI 0.159, uvicorn 0.54, Python 3.11+

## Run

Two processes. The Vite dev server proxies `/api` to uvicorn on port 8000.

```bash
cd backend
python -m venv .venv
```

Activate that virtualenv, then:

```bash
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm ci
npm run dev
```

Production backend dependencies are `backend/requirements.txt`. `requirements-dev.txt` adds pytest. `npm run build` typechecks and writes `frontend/dist`. If `VITE_CDN_BASE` is set, it becomes the Vite `base` for those built assets; otherwise the base is `/`.

## Adding a tool

1. Add an object to `shared/tools.json`: `id`, `path` (`/xx`), `titleKey` (tab label key in that tool's translations).
2. `backend/app/plugins/xx/__init__.py` must export `router` (`APIRouter`). It is mounted at `/api/xx`.
3. `frontend/src/plugins/xx/Page.tsx` must export `Page` (or a default component). The shell loads it from the manifest `id`. There is no separate page registry.
4. Translations: `frontend/src/plugins/xx/locales/en.json`. The file name is the language code, the i18n namespace is the tool `id`. The `summary` key is shown on the home page. `titleKey` from the manifest is the tab label. Shell strings live in `frontend/src/locales/shell/`.

`id` matches `[a-z][a-z0-9_]{0,31}`. `path` is `/` plus a segment of the same length, with hyphens allowed.
