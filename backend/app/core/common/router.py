from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.core.auth.security import get_current_user, User
from app.core.common.rls import apply_ownership_filter

from app.models.crm import Customer, Lead, Deal
from app.models.sales import Quotation, SalesOrder

router = APIRouter(prefix="/search", tags=["Global Search"])

class SearchResult(BaseModel):
    entity_type: Literal["customer", "lead", "deal", "quotation", "sales_order"]
    entity_id: uuid.UUID
    reference_number: str
    display_name: str

@router.get("", response_model=List[SearchResult])
async def global_search(
    q: str = Query(..., description="The reference number or exact search term"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search globally across core entities by reference_number.
    Returns matching entities that the current user has access to.
    """
    results = []
    
    # 1. Search Customer
    q_cust = select(Customer).where(Customer.reference_number.ilike(q))
    q_cust = apply_ownership_filter(q_cust, current_user, Customer, "customer")
    for row in (await db.execute(q_cust)).scalars().all():
        results.append(SearchResult(
            entity_type="customer",
            entity_id=row.id,
            reference_number=row.reference_number,
            display_name=row.company_name
        ))

    # 2. Search Lead
    q_lead = select(Lead).where(Lead.reference_number.ilike(q))
    q_lead = apply_ownership_filter(q_lead, current_user, Lead, "lead")
    for row in (await db.execute(q_lead)).scalars().all():
        results.append(SearchResult(
            entity_type="lead",
            entity_id=row.id,
            reference_number=row.reference_number,
            display_name=row.title
        ))

    # 3. Search Deal
    q_deal = select(Deal).where(Deal.reference_number.ilike(q))
    q_deal = apply_ownership_filter(q_deal, current_user, Deal, "deal")
    for row in (await db.execute(q_deal)).scalars().all():
        results.append(SearchResult(
            entity_type="deal",
            entity_id=row.id,
            reference_number=row.reference_number,
            display_name=row.deal_name
        ))

    # 4. Search Quotation
    q_quo = select(Quotation).where(Quotation.reference_number.ilike(q))
    q_quo = apply_ownership_filter(q_quo, current_user, Quotation, "quotation")
    for row in (await db.execute(q_quo)).scalars().all():
        results.append(SearchResult(
            entity_type="quotation",
            entity_id=row.id,
            reference_number=row.reference_number,
            display_name=row.quotation_number
        ))

    # 5. Search SalesOrder
    q_so = select(SalesOrder).where(SalesOrder.reference_number.ilike(q))
    q_so = apply_ownership_filter(q_so, current_user, SalesOrder, "sales_order")
    for row in (await db.execute(q_so)).scalars().all():
        results.append(SearchResult(
            entity_type="sales_order",
            entity_id=row.id,
            reference_number=row.reference_number,
            display_name=row.order_number
        ))

    return results
