from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import urllib.request
import json
from app.config import settings

router = APIRouter()

class DeepSeekRequest(BaseModel):
    messages: List[Dict[str, Any]]
    jsonMode: Optional[bool] = False

@router.post("")
def proxy_deepseek(data: DeepSeekRequest):
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="DEEPSEEK_API_KEY environment variable is not set on the server."
        )
    
    payload = {
        "model": "deepseek-chat",
        "messages": data.messages,
        "temperature": 0.7,
        "max_tokens": 3000,
    }
    if data.jsonMode:
        payload["response_format"] = {"type": "json_object"}
        
    try:
        url = "https://api.deepseek.com/v1/chat/completions"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=40) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data
    except Exception as err:
        raise HTTPException(status_code=502, detail=f"Failed to reach DeepSeek API: {str(err)}")
