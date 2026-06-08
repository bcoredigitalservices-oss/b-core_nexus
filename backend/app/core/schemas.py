from pydantic import BaseModel
from datetime import datetime

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    timestamp: datetime
    path: str
