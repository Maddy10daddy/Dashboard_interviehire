from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime, timezone

class BaseWSMessage(BaseModel):
    type: str

class IncomingMessage(BaseWSMessage):
    content: Optional[str] = None

class OutgoingMessage(BaseWSMessage):
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    sender: Optional[str] = None

class ErrorMessage(BaseWSMessage):
    type: str = "error"
    code: int
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
