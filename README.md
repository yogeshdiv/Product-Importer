## Product-Importer

**Product-Importer** is a full-stack application for importing product data from CSV files into a database, with async processing, validation, and a React-based UI to track and manage imports.

- **Backend**: FastAPI + PostgreSQL (or another SQL DB) + Redis + Celery
- **Frontend**: React + TypeScript + Vite (in the `product-importer` folder)
- **Async processing**: Celery workers + Redis broker
- **Realtime updates**: WebSocket endpoint for file processing events

---

### Features

- **CSV file upload and processing**
  - Upload CSV files via the API / UI
  - Store file metadata and processing status in the database
  - Process rows asynchronously using Celery tasks

- **Product import pipeline**
  - Parse CSV rows into products
  - Validate required fields (e.g. SKU, name, price)
  - Write products into the database with idempotent behavior (avoid duplicate SKUs / repeated files)

- **Status tracking & files view**
  - Track per-file status: pending, processing, completed, failed
  - Expose file + product status via REST APIs
  - WebSocket channel for live progress updates (e.g. rows processed, errors)

- **Frontend UI (React)**
  - Products screen (list products, basic info)
  - Edit screen (edit product details)
  - Files screen (see uploaded CSV files and their processing state)

> The original brainstorming for AI features (description generation, normalization, etc.) can be implemented on top of this core pipeline later.

---

### Repository structure

- `app/`
  - `main.py`: FastAPI application entrypoint (API + WebSockets)
  - `api_routes/`
    - `files.py`: Endpoints for uploading files and querying file status
    - `products.py`: Endpoints for listing and managing products
  - `db/`
    - `connection.py`: Database engine/session configuration
    - `models.py`: SQLAlchemy models for products, files, etc.
    - `file_process.py`: DB helpers for file processing metadata
    - `products.py`: DB helpers for product operations
  - `tasks/`
    - `csv_task.py`: Celery tasks to process CSV files asynchronously
  - `utils/`
    - `aws.py`: Helpers for S3 (or similar) file storage (if used)
    - `files.py`: File utilities (file saving, parsing helpers, etc.)
  - `websockets/`
    - `file_process.py`: WebSocket manager for pushing file processing updates
  - `redis/`, `pydantic_models/`: Supporting modules for config and request/response schemas
  - `celery_app.py`: Celery application configuration

- `product-importer/`
  - React + TypeScript frontend (see `product-importer/README.md` for details)

---

### Backend – Getting started

#### 1. Create and activate virtual environment

```bash
python -m venv vscodeenv
.\vscodeenv\Scripts\activate  # on Windows
# source vscodeenv/bin/activate  # on macOS/Linux
```

#### 2. Install dependencies

```bash
pip install -r requirements.txt
```

#### 3. Configure environment

Set the necessary environment variables for:

- Database connection URL
- Redis URL
- Any S3 / object storage credentials (if `aws.py` is used)

You can use a `.env` file and load it in `main.py` / `celery_app.py`.

#### 4. Run the FastAPI app

```bash
uvicorn app.main:app --reload
```

By default this serves the API at `http://localhost:8000` (unless you configured another host/port).

#### 5. Run Celery worker

In another terminal (with the same virtualenv activated):

```bash
celery -A app.celery_app.celery_app worker --loglevel=info
```

This worker will pick up CSV processing tasks and update DB + WebSocket clients.

---

### Frontend – Getting started

The React app lives in the `product-importer` directory.

```bash
cd product-importer
npm install
npm run dev
```

The dev server usually runs on `http://localhost:5173`. Make sure the FastAPI backend is running so the UI can hit the API endpoints.

---

### Key flows

- **Upload CSV file**
  1. User uploads a file via UI or `files` API.
  2. Backend stores file (locally or in S3) and creates a DB record.
  3. A Celery task is enqueued to process the file.

- **Process file (Celery)**
  1. Task reads the file, parses rows.
  2. For each row, validate and upsert into `products` table.
  3. Update file status and progress; push updates over WebSocket.

- **View status in UI**
  1. React app polls REST endpoints and/or listens on WebSocket.
  2. Files page shows status and counts; products page shows imported items.

---

### Future AI enhancements (optional)

Once the core import pipeline is stable, you can layer in AI capabilities such as:

- Auto-generating product descriptions from name/category/attributes.
- Normalizing product names and SKUs and detecting semantic duplicates.
- Converting raw validation errors into human-friendly explanations.
- Auto-categorizing products based on text.

These map directly to the earlier “Phase” ideas and can be implemented as extra endpoints/services that the existing pipeline calls into.
