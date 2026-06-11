from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID
from typing import Optional, Dict, Any

class UserBase(BaseModel):
    # Use plain str so Pydantic v2 strict email validation doesn't reject
    # internal / special-use domains such as *.local (mDNS) in dev environments.
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_tier: int = Field(default=4, ge=0, le=4, description="0=Root, 1=Exec, 2=Dir, 3=Lead, 4=Exec")
    clearance_level: int = Field(default=4, ge=0, le=4)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)
    functional_roles: list[str] = Field(default_factory=list)
    department_id: Optional[UUID] = None
    workspaces: list[str] = Field(default_factory=list)

class UserCreate(UserBase):
    password: str = Field(..., min_length=12)

class UserRead(UserBase):
    id: UUID
    is_active: bool
    is_totp_enabled: bool

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role_tier: Optional[int] = Field(None, ge=0, le=4)
    is_active: Optional[bool] = None
    custom_attributes: Optional[Dict[str, Any]] = None
    password: Optional[str] = Field(None, min_length=12)
    functional_roles: Optional[list[str]] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role_tier: Optional[int] = None

# For backward compatibility with existing route type hints
UserResponse = UserRead

class VerifyTOTPRequest(BaseModel):
    temp_token: str
    code: str

class UserInviteRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    role_tier: int = Field(default=1, ge=0, le=4)

class OnboardVerifyRequest(BaseModel):
    token: str

class OnboardCompleteRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=12)
    totp_code: str

class OnboardPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=12)

class UserRegisterRequest(BaseModel):
    invite_token: str
    password: str = Field(..., min_length=12)


