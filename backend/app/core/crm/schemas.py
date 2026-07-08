from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
import uuid

from app.models.crm import LeadType


# ---------------------------------------------------------
# Contacts
# ---------------------------------------------------------

class ContactBase(BaseModel):
    first_name: str = Field(..., description="First name of the contact")
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class ContactRead(ContactBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Leads
# ---------------------------------------------------------

class LeadBase(BaseModel):
    title: str = Field(..., description="Lead title or deal name")
    lead_type: LeadType
    company_name: Optional[str] = None
    pipeline_stage: str = "lead"
    priority: Optional[str] = None
    lead_source: Optional[str] = None
    is_converted: bool = False
    is_active: bool = True

class LeadCreate(LeadBase):
    primary_contact_id: Optional[uuid.UUID] = Field(None, description="Link an existing contact as the primary contact")

class LeadUpdate(BaseModel):
    title: Optional[str] = None
    pipeline_stage: Optional[str] = None
    priority: Optional[str] = None
    company_name: Optional[str] = None
    lead_source: Optional[str] = None
    is_active: Optional[bool] = None

class LeadRead(LeadBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Lead Relations
# ---------------------------------------------------------

class LeadContactLinkCreate(BaseModel):
    contact_id: uuid.UUID
    role_at_lead: Optional[str] = None

class LeadContactLinkRead(BaseModel):
    id: uuid.UUID
    contact_id: uuid.UUID
    role_at_lead: Optional[str]
    contact: Optional[ContactRead] = None
    model_config = ConfigDict(from_attributes=True)

class LeadActivityCreate(BaseModel):
    activity_type: str
    notes: Optional[str] = None

class LeadActivityRead(BaseModel):
    id: uuid.UUID
    activity_type: str
    notes: Optional[str]
    created_by_id: Optional[uuid.UUID]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LeadTagCreate(BaseModel):
    tag_name: str

class LeadTagRead(BaseModel):
    id: uuid.UUID
    tag_name: str
    model_config = ConfigDict(from_attributes=True)

class LeadAttachmentCreate(BaseModel):
    file_name: str
    file_url: str

class LeadAttachmentRead(BaseModel):
    id: uuid.UUID
    file_name: str
    file_url: str
    uploaded_by_id: Optional[uuid.UUID]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Extended Lead Read with all details
class LeadDetailRead(LeadRead):
    contacts: List[LeadContactLinkRead] = []
    activities: List[LeadActivityRead] = []
    tags: List[LeadTagRead] = []
    attachments: List[LeadAttachmentRead] = []
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Customers
# ---------------------------------------------------------

class CustomerBase(BaseModel):
    company_name: str
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None

class CustomerRead(CustomerBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Customer Relations
# ---------------------------------------------------------

class CustomerAddressBase(BaseModel):
    address_type: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    is_default: bool = False

class CustomerAddressCreate(CustomerAddressBase):
    pass

class CustomerAddressUpdate(BaseModel):
    address_type: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    is_default: Optional[bool] = None

class CustomerAddressRead(CustomerAddressBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class CustomerContactLinkCreate(BaseModel):
    contact_id: uuid.UUID
    role_at_customer: Optional[str] = None

class CustomerContactLinkRead(BaseModel):
    id: uuid.UUID
    contact_id: uuid.UUID
    role_at_customer: Optional[str]
    contact: Optional[ContactRead] = None
    model_config = ConfigDict(from_attributes=True)


# Extended Customer Read with all details
class CustomerDetailRead(CustomerRead):
    addresses: List[CustomerAddressRead] = []
    contacts: List[CustomerContactLinkRead] = []
    model_config = ConfigDict(from_attributes=True)
