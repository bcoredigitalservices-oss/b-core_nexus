import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.auth.security import RequiresPermission, User
from app.core.common.rls import apply_ownership_filter, check_ownership
from app.models.crm import (
    Contact, Lead, LeadContactLink, LeadActivity, LeadTag, LeadAttachment,
    Customer, CustomerAddress, CustomerContactLink, Deal
)
from app.core.crm.schemas import (
    ContactCreate, ContactUpdate, ContactRead,
    LeadCreate, LeadUpdate, LeadRead, LeadDetailRead,
    LeadContactLinkCreate, LeadContactLinkRead,
    LeadActivityCreate, LeadActivityRead,
    LeadTagCreate, LeadTagRead,
    LeadAttachmentCreate, LeadAttachmentRead,
    CustomerCreate, CustomerUpdate, CustomerRead, CustomerDetailRead,
    CustomerAddressCreate, CustomerAddressUpdate, CustomerAddressRead,
    CustomerContactLinkCreate, CustomerContactLinkRead,
    DealCreate, DealUpdate, DealRead
)

router = APIRouter(prefix="/crm", tags=["CRM"])


# ==========================================
# Contacts
# ==========================================

@router.post("/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact(
    payload: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:create"))
):
    contact = Contact(**payload.model_dump(), owner_id=current_user.id)
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.get("/contacts", response_model=List[ContactRead])
async def list_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    query = select(Contact).where(Contact.is_active == True)
    query = apply_ownership_filter(query, current_user, Contact, "contact")
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/contacts/{contact_id}", response_model=ContactRead)
async def get_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    res = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = res.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    await check_ownership(contact, current_user, db, "contact", "read")
    return contact


@router.put("/contacts/{contact_id}", response_model=ContactRead)
async def update_contact(
    contact_id: uuid.UUID,
    payload: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = res.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    await check_ownership(contact, current_user, db, "contact", "write")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)
        
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:delete"))
):
    res = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = res.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    await check_ownership(contact, current_user, db, "contact", "write", require_true_owner=True)
    contact.is_active = False
    await db.commit()
    return None


@router.get("/contacts/{contact_id}/leads")
async def get_contact_leads(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    # Verifies ownership of contact
    res = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = res.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await check_ownership(contact, current_user, db, "contact", "read")
    
    links_res = await db.execute(
        select(LeadContactLink)
        .options(selectinload(LeadContactLink.lead))
        .where(LeadContactLink.contact_id == contact_id)
    )
    return [link.lead for link in links_res.scalars().all() if link.lead]


@router.get("/contacts/{contact_id}/customers")
async def get_contact_customers(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    res = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = res.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await check_ownership(contact, current_user, db, "contact", "read")
    
    links_res = await db.execute(
        select(CustomerContactLink)
        .options(selectinload(CustomerContactLink.customer))
        .where(CustomerContactLink.contact_id == contact_id)
    )
    return [link.customer for link in links_res.scalars().all() if link.customer]


# ==========================================
# Leads
# ==========================================

@router.post("/leads", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:create"))
):
    lead_data = payload.model_dump(exclude={"primary_contact_id"})
    lead = Lead(**lead_data, owner_id=current_user.id)
    db.add(lead)
    await db.flush()
    
    if payload.primary_contact_id:
        contact_res = await db.execute(select(Contact).where(Contact.id == payload.primary_contact_id))
        contact = contact_res.scalars().first()
        if not contact:
            raise HTTPException(status_code=400, detail="Primary contact not found")
        
        link = LeadContactLink(lead_id=lead.id, contact_id=contact.id, role_at_lead="Primary Contact")
        db.add(link)
        
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("/leads", response_model=List[LeadRead])
async def list_leads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    query = select(Lead).where(Lead.is_active == True)
    query = apply_ownership_filter(query, current_user, Lead, "lead")
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/leads/{lead_id}", response_model=LeadDetailRead)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    query = select(Lead).where(Lead.id == lead_id).options(
        selectinload(Lead.contacts).selectinload(LeadContactLink.contact),
        selectinload(Lead.activities),
        selectinload(Lead.tags),
        selectinload(Lead.attachments),
        selectinload(Lead.deals), 
    )
    res = await db.execute(query)
    lead = res.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    await check_ownership(lead, current_user, db, "lead", "read")
    return lead


@router.put("/leads/{lead_id}", response_model=LeadRead)
async def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    await check_ownership(lead, current_user, db, "lead", "write")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, key, value)
        
    await db.commit()
    await db.refresh(lead)
    return lead


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:delete"))
):
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    await check_ownership(lead, current_user, db, "lead", "write", require_true_owner=True)
    lead.is_active = False
    await db.commit()
    return None


@router.post("/leads/{lead_id}/convert", response_model=CustomerRead)
async def convert_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:create"))
):
    """
    Converts a Lead to a Customer. Re-links all associated contacts.
    Requires crm:create (to create Customer) AND user must own the lead (checked in code).
    """
    query = select(Lead).where(Lead.id == lead_id).options(selectinload(Lead.contacts))
    res = await db.execute(query)
    lead = res.scalars().first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    await check_ownership(lead, current_user, db, "lead", "write")
    
    if lead.is_converted:
        raise HTTPException(status_code=400, detail="Lead is already converted")
        
    # Create Customer
    customer_name = lead.company_name or lead.title
    customer = Customer(
        owner_id=current_user.id,
        company_name=customer_name,
        is_active=True
    )
    db.add(customer)
    await db.flush()
    
    # Re-link Contacts
    for lead_link in lead.contacts:
        cust_link = CustomerContactLink(
            customer_id=customer.id,
            contact_id=lead_link.contact_id,
            role_at_customer=lead_link.role_at_lead
        )
        db.add(cust_link)
        
    # Update Lead
    lead.is_converted = True
    lead.pipeline_stage = "converted"
    
    # Create an initial Deal
    deal = Deal(
        owner_id=current_user.id,
        customer_id=customer.id,
        lead_id=lead.id,
        deal_name=f"{customer_name} Deal",
        pipeline_stage="discovery",
        is_active=True
    )
    db.add(deal)
    
    await db.commit()
    await db.refresh(customer)
    return customer


# ==========================================
# Leads - Activities, Contacts, Tags, Attachments
# ==========================================

@router.post("/leads/{lead_id}/activities", response_model=LeadActivityRead)
async def create_lead_activity(
    lead_id: uuid.UUID,
    payload: LeadActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:create"))
):
    # We only check if lead exists and user has rights to it
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    await check_ownership(lead, current_user, db, "lead", "write")
    
    activity = LeadActivity(**payload.model_dump(), lead_id=lead_id, created_by_id=current_user.id)
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity

@router.get("/leads/{lead_id}/activities", response_model=List[LeadActivityRead])
async def list_lead_activities(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead: raise HTTPException(404, "Lead not found")
    await check_ownership(lead, current_user, db, "lead", "read")
    
    act_res = await db.execute(select(LeadActivity).where(LeadActivity.lead_id == lead_id).order_by(LeadActivity.created_at.desc()))
    return act_res.scalars().all()


@router.post("/leads/{lead_id}/contacts", response_model=LeadContactLinkRead)
async def add_lead_contact(
    lead_id: uuid.UUID,
    payload: LeadContactLinkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead: raise HTTPException(404, "Lead not found")
    await check_ownership(lead, current_user, db, "lead", "write")
    
    c_res = await db.execute(select(Contact).where(Contact.id == payload.contact_id))
    if not c_res.scalars().first(): raise HTTPException(404, "Contact not found")
    
    link = LeadContactLink(lead_id=lead_id, contact_id=payload.contact_id, role_at_lead=payload.role_at_lead)
    db.add(link)
    await db.commit()
    
    query = select(LeadContactLink).where(LeadContactLink.id == link.id).options(selectinload(LeadContactLink.contact))
    res = await db.execute(query)
    return res.scalars().first()

@router.delete("/leads/{lead_id}/contacts/{contact_id}")
async def remove_lead_contact(
    lead_id: uuid.UUID,
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead: raise HTTPException(404, "Lead not found")
    await check_ownership(lead, current_user, db, "lead", "write")
    
    await db.execute(delete(LeadContactLink).where(LeadContactLink.lead_id == lead_id, LeadContactLink.contact_id == contact_id))
    await db.commit()
    return {"status": "success"}


# Tags
@router.post("/leads/{lead_id}/tags", response_model=LeadTagRead)
async def add_lead_tag(
    lead_id: uuid.UUID,
    payload: LeadTagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead: raise HTTPException(404, "Lead not found")
    await check_ownership(lead, current_user, db, "lead", "write")
    
    tag = LeadTag(lead_id=lead_id, tag_name=payload.tag_name)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag

@router.delete("/leads/{lead_id}/tags/{tag_id}")
async def remove_lead_tag(
    lead_id: uuid.UUID,
    tag_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = res.scalars().first()
    if not lead: raise HTTPException(404, "Lead not found")
    await check_ownership(lead, current_user, db, "lead", "write")
    
    await db.execute(delete(LeadTag).where(LeadTag.id == tag_id, LeadTag.lead_id == lead_id))
    await db.commit()
    return {"status": "success"}


# ==========================================
# Customers
# ==========================================

@router.post("/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:create"))
):
    customer = Customer(**payload.model_dump(), owner_id=current_user.id)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/customers", response_model=List[CustomerRead])
async def list_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    query = select(Customer).where(Customer.is_active == True)
    query = apply_ownership_filter(query, current_user, Customer, "customer")
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/customers/{customer_id}", response_model=CustomerDetailRead)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    query = select(Customer).where(Customer.id == customer_id).options(
        selectinload(Customer.addresses),
        selectinload(Customer.contacts).selectinload(CustomerContactLink.contact),
        selectinload(Customer.deals)
    )
    res = await db.execute(query)
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    await check_ownership(customer, current_user, db, "customer", "read")
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerRead)
async def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    await check_ownership(customer, current_user, db, "customer", "write")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
        
    await db.commit()
    await db.refresh(customer)
    return customer


@router.post("/customers/{customer_id}/addresses", response_model=CustomerAddressRead)
async def add_customer_address(
    customer_id: uuid.UUID,
    payload: CustomerAddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer: raise HTTPException(404, "Customer not found")
    await check_ownership(customer, current_user, db, "customer", "write")
    
    address = CustomerAddress(**payload.model_dump(), customer_id=customer_id)
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address

@router.put("/customers/{customer_id}/addresses/{address_id}", response_model=CustomerAddressRead)
async def update_customer_address(
    customer_id: uuid.UUID,
    address_id: uuid.UUID,
    payload: CustomerAddressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer: raise HTTPException(404, "Customer not found")
    await check_ownership(customer, current_user, db, "customer", "write")
    
    addr_res = await db.execute(select(CustomerAddress).where(CustomerAddress.id == address_id, CustomerAddress.customer_id == customer_id))
    address = addr_res.scalars().first()
    if not address: raise HTTPException(404, "Address not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(address, key, value)
        
    await db.commit()
    await db.refresh(address)
    return address

@router.post("/customers/{customer_id}/contacts", response_model=CustomerContactLinkRead)
async def add_customer_contact(
    customer_id: uuid.UUID,
    payload: CustomerContactLinkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer: raise HTTPException(404, "Customer not found")
    await check_ownership(customer, current_user, db, "customer", "write")
    
    c_res = await db.execute(select(Contact).where(Contact.id == payload.contact_id))
    if not c_res.scalars().first(): raise HTTPException(404, "Contact not found")
    
    link = CustomerContactLink(customer_id=customer_id, contact_id=payload.contact_id, role_at_customer=payload.role_at_customer)
    db.add(link)
    await db.commit()
    
    query = select(CustomerContactLink).where(CustomerContactLink.id == link.id).options(selectinload(CustomerContactLink.contact))
    res = await db.execute(query)
    return res.scalars().first()

@router.delete("/customers/{customer_id}/contacts/{contact_id}")
async def remove_customer_contact(
    customer_id: uuid.UUID,
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer: raise HTTPException(404, "Customer not found")
    await check_ownership(customer, current_user, db, "customer", "write")
    
    await db.execute(delete(CustomerContactLink).where(CustomerContactLink.customer_id == customer_id, CustomerContactLink.contact_id == contact_id))
    await db.commit()
    return {"status": "success"}

# ==========================================
# Deals
# ==========================================

@router.post("/deals", response_model=DealRead, status_code=status.HTTP_201_CREATED)
async def create_deal(
    payload: DealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:create"))
):
    deal = Deal(**payload.model_dump(), owner_id=current_user.id)
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal

@router.get("/deals", response_model=List[DealRead])
async def list_deals(
    customer_id: Optional[uuid.UUID] = None,
    lead_id: Optional[uuid.UUID] = None,
    pipeline_stage: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    query = select(Deal)
    if customer_id:
        query = query.where(Deal.customer_id == customer_id)
    if lead_id:
        query = query.where(Deal.lead_id == lead_id)
    if pipeline_stage:
        query = query.where(Deal.pipeline_stage == pipeline_stage)
        
    query = apply_ownership_filter(query, current_user, Deal, "deal")
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/deals/{deal_id}", response_model=DealRead)
async def get_deal(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:read"))
):
    res = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = res.scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    await check_ownership(deal, current_user, db, "deal", "read")
    return deal

@router.put("/deals/{deal_id}", response_model=DealRead)
async def update_deal(
    deal_id: uuid.UUID,
    payload: DealUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = res.scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    await check_ownership(deal, current_user, db, "deal", "write")
    
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(deal, k, v)
        
    await db.commit()
    await db.refresh(deal)
    return deal

@router.delete("/deals/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequiresPermission("crm:write"))
):
    res = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = res.scalars().first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    await check_ownership(deal, current_user, db, "deal", "write", require_true_owner=True)
    
    # Soft delete
    deal.is_active = False
    await db.commit()
