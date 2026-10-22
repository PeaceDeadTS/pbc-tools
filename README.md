# PBC Tools

Один сайт для небольших утилит вики. Сейчас внутри два инструмента:

| Адрес | Инструмент |
|---|---|
| `/fn` | Генератор вики-галереи по шаблону `Photo #.jpg` |
| `/ic` | Кадрирование изображений, в том числе стандарт PBC 2:3 |

Список инструментов — `shared/tools.json`. Его читают и FastAPI, и React. Оболочка (шапка, вкладки, язык) общая. У каждого инструмента свой пакет `backend/app/plugins/<id>/` и `frontend/src/plugins/<id>/`.

Кадрирование считается в браузере. Генератор галереи — `POST /api/fn/gallery`.

## Стек

- React 19.3, React Router 8, Vite 8, Tailwind CSS 4
- TypeScript 6.0.3. TypeScript 7 уже есть в npm, но `typescript-eslint` 8.72 принимает только версии младше 6.1
- `cropperjs` 1.7: `react-cropper` не работает с `cropperjs` 2
- FastAPI 0.159, uvicorn 0.54, Python 3.11+

## Локально

Два процесса. Фронт проксирует `/api` на uvicorn.

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements-dev.txt
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm ci
npm run dev
```

На Debian вместо `.venv\Scripts\` используется `.venv/bin/`. Продакшен-зависимости бэкенда — `backend/requirements.txt`. `requirements-dev.txt` нужен для pytest.

## Новый инструмент

1. Добавить объект в `shared/tools.json`: `id`, `path` (`/xx`), `titleKey` (ключ заголовка вкладки в переводах инструмента).
2. `backend/app/plugins/xx/__init__.py` должен экспортировать `router` (`APIRouter`). Он монтируется на `/api/xx`.
3. `frontend/src/plugins/xx/Page.tsx` экспортирует функцию `Page`. Оболочка подхватывает её по `id`, отдельный реестр страниц не нужен.
4. Переводы: `frontend/src/plugins/xx/locales/en.json`. Имя файла — код языка, пространство имён — `id`. Ключ `summary` показывается на главной. `titleKey` из манифеста — подпись вкладки.

`id` — `[a-z][a-z0-9_]{0,31}`. `path` — `/` и такой же короткий сегмент.
