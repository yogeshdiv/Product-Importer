import asyncio
from fastapi import APIRouter, WebSocket
from app.redis import redis_client

router = APIRouter()

@router.websocket("/ws/progress/{file_id}")
async def websocket_endpoint(websocket: WebSocket,  file_id: str):
    await websocket.accept()
    status = redis_client.hget("file_status", file_id)
    if status:
        status = status.decode('utf-8')
    file_id = str(file_id)
    while status != 'completed':
        await websocket.send_json({
            "status": "processing",
            "progress": int(redis_client.hget("file_processing", file_id) or 0),
            "total": int(redis_client.hget("file_total", file_id) or 0),
            "errors": int(redis_client.hget("row_with_errors", file_id) or 0)
        })
        await asyncio.sleep(1)
        status = redis_client.hget("file_status", file_id)
        if status:
            status = status.decode('utf-8')

    await websocket.send_json({
        "status": "completed",
        "progress": int(redis_client.hget("file_processing", file_id) or 0)
    })