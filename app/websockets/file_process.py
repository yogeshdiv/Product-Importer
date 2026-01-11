"""WebSocket endpoints for file processing progress."""
import asyncio

from fastapi import APIRouter, Depends, WebSocket
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.redis import get_with_fallback
from app.utils.files import (
    get_error_count,
    get_file_progress,
    get_file_status,
    get_total_records,
)

router = APIRouter()


@router.websocket("/ws/progress/{file_id}")
async def websocket_endpoint(
    websocket: WebSocket, file_id: str, db: Session = Depends(get_db)
):
    """WebSocket endpoint for file processing progress updates."""
    await websocket.accept()
    status = get_with_fallback(
        "file_status", file_id, "str", lambda k: get_file_status(db, k)
    )
    file_id = str(file_id)
    while status != 'completed':
        await websocket.send_json({
            "status": "processing",
            "progress": get_with_fallback(
                "file_processing", file_id, "int",
                lambda k: get_file_progress(db, k)
            ),
            "total": get_with_fallback(
                "file_total", file_id, "int",
                lambda k: get_total_records(db, k)
            ),
            "errors": get_with_fallback(
                "row_with_errors", file_id, "int",
                lambda k: get_error_count(db, k)
            )
        })
        await asyncio.sleep(1)
        status = get_with_fallback(
            "file_status", file_id, "str", lambda k: get_file_status(db, k)
        )

    await websocket.send_json({
        "status": "completed",
        "progress": get_with_fallback(
            "file_processing", file_id, "int",
            lambda k: get_file_progress(db, k)
        ),
        "total": get_with_fallback(
            "file_total", file_id, "int",
            lambda k: get_total_records(db, k)
        ),
        "errors": get_with_fallback(
            "row_with_errors", file_id, "int",
            lambda k: get_error_count(db, k)
        )
    })

