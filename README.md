# Product-Importer

**Product-Importer** is a backend-driven system for importing large product catalogs from CSV files using asynchronous processing, validation, and progress tracking.

The project demonstrates how real-world ingestion workflows can be built in a **scalable, retry-safe, and observable** manner, instead of processing uploads synchronously or relying on fragile batch scripts. A React-based UI is included to visualize import progress and manage uploaded files.

---

## Why Product-Importer?

Importing product data via CSV is a common requirement in e-commerce and catalog-driven systems, but naive implementations often suffer from:

- Blocking API requests during file processing
- Duplicate records caused by retries or repeated uploads
- Poor visibility into long-running background jobs
- Tight coupling between upload, validation, and persistence logic

**Product-Importer** addresses these issues by modeling CSV ingestion as an **asynchronous pipeline**, where uploads, processing, validation, and persistence are decoupled and observable.

---

## High-Level Architecture

- API requests handle file ingestion and metadata creation only
- CSV processing runs asynchronously in background workers
- Product writes are idempotent to handle retries safely
- Import progress and failures are tracked and surfaced in real time
- UI consumes APIs and WebSockets for visibility, not business logic

---

## Design Decisions

### Asynchronous processing
CSV files are processed using **Celery background workers**, keeping the API responsive even for large uploads and enabling horizontal scaling of workers.

### Idempotent product writes
Products are inserted or updated based on a unique identifier (e.g., SKU) to ensure:
- repeated file uploads do not create duplicates
- task retries do not corrupt data

This makes the pipeline retry-safe and resilient to partial failures.

### Progress tracking
Each uploaded file has a corresponding database record tracking:
- processing state (`pending`, `processing`, `completed`, `failed`)
- row counts and error counts

Progress updates are pushed to clients via **WebSockets**, providing near-real-time visibility into long-running imports.

### Failure isolation
Validation or persistence errors in individual rows do **not** fail the entire file. Errors are recorded and surfaced while allowing the remaining rows to be processed successfully.

### Separation of concerns
- API layer handles ingestion and querying state
- Worker layer handles parsing and persistence
- UI focuses on visibility and control

This separation keeps the system extensible and easier to evolve.

---

## Tech Stack

FastAPI · PostgreSQL · Redis · Celery · WebSockets · React · TypeScript

---

## Features

- CSV file upload and asynchronous processing
- Product validation and idempotent database writes
- File-level and row-level status tracking
- Real-time progress updates via WebSockets
- React UI for managing files and viewing imported products

---

## Key Flows

### Upload CSV file
1. User uploads a file via UI or API.
2. Backend stores file metadata and creates a database record.
3. A Celery task is enqueued to process the file.

### Process file (Celery worker)
1. Task reads the file and parses rows.
2. Each row is validated and upserted into the database.
3. File status and progress are updated and pushed via WebSocket.

### View status in UI
1. React app fetches file and product state via REST APIs.
2. WebSocket channel provides live progress updates.

---

## Backend – Getting Started

### 1. Create and activate virtual environment

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Set environment variables for:

1. Database connection URL

2. Redis URL

3. AWS Credentials

You may use a .env file and load it in the application.

### 4. Run the FastAPI app

```bash
uvicorn app.main:app --reload
```

### 5. Run Celery worker

```bash
celery -A app.celery_app.celery_app worker --loglevel=info
```

### 6. Starting Frontend

```bash
cd product-importer
npm install
npm run dev
```

The frontend runs on http://localhost:5173 by default and communicates with the FastAPI backend.
