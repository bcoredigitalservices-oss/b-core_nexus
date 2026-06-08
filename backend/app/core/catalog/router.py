from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.core.auth.router import RoleTierChecker
from app.core.catalog.models import CatalogItem
from app.core.catalog.schemas import CatalogItemCreate, CatalogItemUpdate, CatalogItemResponse

router = APIRouter(prefix="/catalog", tags=["Universal Catalog"])

# Role guards
require_tier_2 = RoleTierChecker(required_tier=2) # Directional or Admin
require_tier_4 = RoleTierChecker(required_tier=4) # Operator or higher (Any authenticated user)

@router.post("", response_model=CatalogItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_in: CatalogItemCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    # Check duplicate SKU
    result = await db.execute(select(CatalogItem).filter(CatalogItem.sku == item_in.sku))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SKU '{item_in.sku}' already exists"
        )
        
    item = CatalogItem(**item_in.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("", response_model=List[CatalogItemResponse])
async def list_items(
    search: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    query = select(CatalogItem)
    if search:
        query = query.filter(
            (CatalogItem.sku.ilike(f"%{search}%")) | 
            (CatalogItem.title.ilike(f"%{search}%"))
        )
    
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{item_id}", response_model=CatalogItemResponse)
async def get_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    result = await db.execute(select(CatalogItem).filter(CatalogItem.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Catalog item not found")
    return item

@router.put("/{item_id}", response_model=CatalogItemResponse)
async def update_item(
    item_id: UUID,
    item_in: CatalogItemUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    result = await db.execute(select(CatalogItem).filter(CatalogItem.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Catalog item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    
    # If updating SKU, check for duplicates
    if "sku" in update_data and update_data["sku"] != item.sku:
        dup_result = await db.execute(select(CatalogItem).filter(CatalogItem.sku == update_data["sku"]))
        if dup_result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SKU '{update_data['sku']}' already exists"
            )

    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    result = await db.execute(select(CatalogItem).filter(CatalogItem.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Catalog item not found")
    
    # Soft delete
    item.is_active = False
    await db.commit()
    return None
