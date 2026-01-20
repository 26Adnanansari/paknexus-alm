from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

@router.post("/chat", response_model=dict)
async def chat_with_nexus(request: ChatRequest):
    """
    Mock AI chat endpoint for Nexus AI.
    """
    user_msg = request.message.lower()
    
    # Simulate thinking delay
    time.sleep(0.5)
    
    response_text = ""
    
    # Simple rule-based responses for now
    if "student" in user_msg and ("count" in user_msg or "many" in user_msg):
        response_text = "You currently have **450 active students**. You can view detailed records in the [Students](/dashboard/students) tab."
    elif "teacher" in user_msg:
        response_text = "There are **25 teachers** on your staff. Managing them is easy in the Staff section."
    elif "fee" in user_msg or "payment" in user_msg:
        response_text = "Fee collection is at **85%** for this month. Would you like to send reminders to pending parents?"
    elif "hello" in user_msg or "hi" in user_msg:
        response_text = "👋 Hello! I'm **Nexus AI**. I can help you with student stats, attendance, or finding your way around. What would you like to know?"
    else:
        response_text = "I'm still learning! Try asking about *students*, *teachers*, or *fees*. I'm here to assist you navigate your school's data."
        
    return {
        "role": "assistant",
        "content": response_text
    }
