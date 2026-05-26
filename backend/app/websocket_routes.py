from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket_manager import manager
from app.schemas import OutgoingMessage, ErrorMessage
import json

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send welcome message
    welcome_msg = OutgoingMessage(type="welcome", content="Connected to IntervieHire server").model_dump_json()
    await manager.send_personal_message(welcome_msg, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_data = json.loads(data)
                msg_type = msg_data.get("type")
                
                if msg_type == "ping":
                    pong_msg = OutgoingMessage(type="pong", content="").model_dump_json()
                    await manager.send_personal_message(pong_msg, websocket)
                    
                elif msg_type == "echo":
                    content = msg_data.get("content", "")
                    echo_msg = OutgoingMessage(type="echo", content=f"Echo: {content}").model_dump_json()
                    await manager.send_personal_message(echo_msg, websocket)
                    
                elif msg_type == "broadcast":
                    content = msg_data.get("content", "")
                    broadcast_msg = OutgoingMessage(type="broadcast", content=content, sender="Client").model_dump_json()
                    await manager.broadcast(broadcast_msg)
                    
                else:
                    err_msg = ErrorMessage(code=4001, content=f"Unknown message type: {msg_type}").model_dump_json()
                    await manager.send_personal_message(err_msg, websocket)
            except json.JSONDecodeError:
                err_msg = ErrorMessage(code=4000, content="Invalid JSON payload").model_dump_json()
                await manager.send_personal_message(err_msg, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
