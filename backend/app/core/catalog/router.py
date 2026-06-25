from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.core.auth.router import RoleTierChecker
from app.core.catalog.models import Item, ItemGroup
from app.core.catalog.schemas import (
    ItemCreate, 
    ItemUpdate, 
    ItemRead, 
    ItemGroupCreate, 
    ItemGroupResponse
)

router = APIRouter(prefix="/catalog", tags=["Universal Catalog"])

# Role guards
require_tier_2 = RoleTierChecker(required_tier=2) # Directional or Admin
require_tier_4 = RoleTierChecker(required_tier=4) # Operator or higher (Any authenticated user)

@router.get("/items", response_model=List[ItemRead])
async def list_items(
    search: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    query = select(Item)
    if search:
        query = query.filter(
            (Item.sku.ilike(f"%{search}%")) | 
            (Item.name.ilike(f"%{search}%"))
        )
    
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/items", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_in: ItemCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    # Check duplicate SKU
    result = await db.execute(select(Item).filter(Item.sku == item_in.sku))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SKU '{item_in.sku}' already exists"
        )
        
    # Check item_group_id if provided
    if item_in.item_group_id:
        group_res = await db.execute(select(ItemGroup).filter(ItemGroup.id == item_in.item_group_id))
        if not group_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item Group ID {item_in.item_group_id} not found"
            )

    item = Item(**item_in.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("/items/{item_id}", response_model=ItemRead)
async def get_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    result = await db.execute(select(Item).filter(Item.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/items/{item_id}", response_model=ItemRead)
async def update_item(
    item_id: UUID,
    item_in: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    result = await db.execute(select(Item).filter(Item.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    
    # If updating SKU, check for duplicates
    if "sku" in update_data and update_data["sku"] != item.sku:
        dup_result = await db.execute(select(Item).filter(Item.sku == update_data["sku"]))
        if dup_result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SKU '{update_data['sku']}' already exists"
            )

    # Check item_group_id if updating
    if "item_group_id" in update_data and update_data["item_group_id"]:
        group_res = await db.execute(select(ItemGroup).filter(ItemGroup.id == update_data["item_group_id"]))
        if not group_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item Group ID {update_data['item_group_id']} not found"
            )

    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    result = await db.execute(select(Item).filter(Item.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await db.delete(item)
    await db.commit()
    return None

@router.get("/groups", response_model=List[ItemGroupResponse])
async def list_groups(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_4)
):
    result = await db.execute(select(ItemGroup))
    return result.scalars().all()

@router.post("/groups", response_model=ItemGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_in: ItemGroupCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    # Check duplicate name
    result = await db.execute(select(ItemGroup).filter(ItemGroup.name == group_in.name))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item Group name '{group_in.name}' already exists"
        )
        
    # Check parent_id if provided
    if group_in.parent_id:
        parent_res = await db.execute(select(ItemGroup).filter(ItemGroup.id == group_in.parent_id))
        if not parent_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent Item Group ID {group_in.parent_id} not found"
            )

    group = ItemGroup(**group_in.model_dump())
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group

@router.post("/items/import", status_code=status.HTTP_201_CREATED)
async def import_items(
    items_in: List[ItemCreate],
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_tier_2)
):
    imported_count = 0
    errors = []
    
    # Pre-fetch existing SKUs to avoid hitting DB in a loop
    existing_skus_result = await db.execute(select(Item.sku))
    existing_skus = set(existing_skus_result.scalars().all())
    
    seen_skus = set()
    to_add = []
    
    for idx, item_data in enumerate(items_in):
        sku = item_data.sku.strip().upper()
        if sku in existing_skus or sku in seen_skus:
            errors.append(f"Row {idx + 1}: SKU '{sku}' is a duplicate")
            continue
            
        # Check item_group_id if provided
        if item_data.item_group_id:
            group_res = await db.execute(select(ItemGroup).filter(ItemGroup.id == item_data.item_group_id))
            if not group_res.scalars().first():
                errors.append(f"Row {idx + 1}: Item Group ID {item_data.item_group_id} not found")
                continue
                
        seen_skus.add(sku)
        new_item = Item(**item_data.model_dump())
        to_add.append(new_item)
        imported_count += 1
        
    if errors and len(to_add) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No valid items to import", "errors": errors}
        )
        
    if to_add:
        db.add_all(to_add)
        await db.commit()
        
    return {
        "status": "success",
        "imported_count": imported_count,
        "errors": errors
    }
