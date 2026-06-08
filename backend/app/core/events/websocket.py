import json
import logging
from fastapi import WebSocket
from typing import Dict, Any

logger = logging.getLogger("bcore.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps WebSocket connection -> metadata dict containing user_id and workspace
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, workspace: str = None):
        await websocket.accept()
        self.active_connections[websocket] = {
            "user_id": user_id,
            "workspace": workspace
        }
        logger.info(json.dumps({
            "event": "websocket_connected",
            "user_id": user_id,
            "workspace": workspace
        }))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            meta = self.active_connections[websocket]
            logger.info(json.dumps({
                "event": "websocket_disconnected",
                "user_id": meta.get("user_id"),
                "workspace": meta.get("workspace")
            }))
            del self.active_connections[websocket]

    def update_workspace(self, websocket: WebSocket, workspace: str):
        if websocket in self.active_connections:
            old_workspace = self.active_connections[websocket].get("workspace")
            self.active_connections[websocket]["workspace"] = workspace
            logger.info(json.dumps({
                "event": "websocket_workspace_updated",
                "user_id": self.active_connections[websocket].get("user_id"),
                "old_workspace": old_workspace,
                "new_workspace": workspace
            }))

    async def send_personal_message(self, user_id: str, message: Any):
        msg_str = json.dumps(message) if isinstance(message, dict) else str(message)
        dead_connections = []
        for socket, meta in list(self.active_connections.items()):
            if meta.get("user_id") == user_id:
                try:
                    await socket.send_text(msg_str)
                except Exception:
                    dead_connections.append(socket)
        for socket in dead_connections:
            self.disconnect(socket)

    async def broadcast_to_workspace(self, workspace: str, message: Any):
        msg_str = json.dumps(message) if isinstance(message, dict) else str(message)
        dead_connections = []
        for socket, meta in list(self.active_connections.items()):
            if meta.get("workspace") == workspace:
                try:
                    await socket.send_text(msg_str)
                except Exception:
                    dead_connections.append(socket)
        for socket in dead_connections:
            self.disconnect(socket)

    async def broadcast(self, message: Any):
        msg_str = json.dumps(message) if isinstance(message, dict) else str(message)
        dead_connections = []
        for socket in list(self.active_connections.keys()):
            try:
                await socket.send_text(msg_str)
            except Exception:
                dead_connections.append(socket)
        for socket in dead_connections:
            self.disconnect(socket)

ws_manager = ConnectionManager()
