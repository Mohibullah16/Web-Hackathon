from fastapi import APIRouter, HTTPException, status, Depends, Header, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from typing import Optional, List
from app.models.produce import ProduceCreate, ProduceItem, PriceCreate, PriceEntry, ProduceWithPrice, ProduceUpdate
from app.database import produce_collection, prices_collection, users_collection
from app.utils.jwt_handler import decode_access_token
from bson import ObjectId
from datetime import datetime, timedelta, date
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/produce", tags=["Produce & Prices"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/produce_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Dependency to get current user from JWT token.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user_id = payload.get("user_id")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "role": user["role"]
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_produce(
    name: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Add a new produce item with optional image upload (Admin only).
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add produce items"
        )
    
    # Check if produce already exists (case-insensitive)
    existing = await produce_collection.find_one({
        "name": {"$regex": f"^{name}$", "$options": "i"}
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Produce item '{name}' already exists"
        )
    
    # Handle image upload
    image_url = None
    if image:
        # Create unique filename
        file_extension = os.path.splitext(image.filename)[1]
        unique_filename = f"{name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_url = f"/uploads/produce_images/{unique_filename}"
    
    produce_dict = {
        "name": name.strip(),
        "image_url": image_url
    }
    result = await produce_collection.insert_one(produce_dict)
    
    # Fetch the created document
    created_produce = await produce_collection.find_one({"_id": result.inserted_id})
    created_produce["_id"] = str(created_produce["_id"])
    
    return created_produce


@router.put("/{item_id}")
async def update_produce(
    item_id: str,
    name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    price: Optional[float] = Form(None),
    region: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a produce item and optionally its price/region (Admin only).
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update produce items"
        )
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid produce ID"
        )
    
    # Check if produce exists
    existing_produce = await produce_collection.find_one({"_id": ObjectId(item_id)})
    if not existing_produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce item not found"
        )
    
    update_dict = {}
    
    # Update name if provided and different from existing
    if name and name.strip():
        name_stripped = name.strip()
        if name_stripped.lower() != existing_produce["name"].lower():
            # Check if name already exists for another item (case-insensitive)
            duplicate = await produce_collection.find_one({
                "name": {"$regex": f"^{name_stripped}$", "$options": "i"},
                "_id": {"$ne": ObjectId(item_id)}
            })
            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Produce item '{name_stripped}' already exists"
                )
        update_dict["name"] = name_stripped
    
    # Handle image upload if provided
    if image and image.filename:
        # Delete old image if exists
        if existing_produce.get("image_url"):
            old_image_path = Path("." + existing_produce["image_url"])
            if old_image_path.exists():
                try:
                    old_image_path.unlink()
                except:
                    pass
        
        # Save new image
        file_extension = os.path.splitext(image.filename)[1]
        file_name = name.strip() if name and name.strip() else existing_produce['name']
        unique_filename = f"{file_name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        update_dict["image_url"] = f"/uploads/produce_images/{unique_filename}"
    
    # Update produce if there are changes
    if update_dict:
        result = await produce_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_dict}
        )
        print(f"Update result - matched: {result.matched_count}, modified: {result.modified_count}")
        print(f"Update dict: {update_dict}")
    
    # Add/Update price if provided
    if price is not None:
        price_date = datetime.now()
        
        # Use provided region or get the latest region from price history
        price_region = region.strip() if region and region.strip() else None
        
        if not price_region:
            # Get the most recent region from price history
            latest_price_entry = await prices_collection.find_one(
                {"produce_id": ObjectId(item_id)},
                sort=[("date", -1)]
            )
            price_region = latest_price_entry["region"] if latest_price_entry else "Unknown"
        
        price_dict = {
            "produce_id": ObjectId(item_id),
            "price": float(price),
            "region": price_region,
            "date": price_date
        }
        
        await prices_collection.insert_one(price_dict)
        print(f"Price added: {price_dict}")
    
    # Fetch updated produce
    updated_produce = await produce_collection.find_one({"_id": ObjectId(item_id)})
    if not updated_produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to fetch updated produce"
        )
    
    updated_produce["_id"] = str(updated_produce["_id"])
    
    return updated_produce


@router.delete("/{item_id}")
async def delete_produce(item_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a produce item and all its associated prices (Admin only).
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete produce items"
        )
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid produce ID"
        )
    
    # Check if produce exists
    produce = await produce_collection.find_one({"_id": ObjectId(item_id)})
    if not produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce item not found"
        )
    
    # Delete associated image if exists
    if produce.get("image_url"):
        image_path = Path("." + produce["image_url"])
        if image_path.exists():
            image_path.unlink()
    
    # Delete all associated prices first
    await prices_collection.delete_many({"produce_id": ObjectId(item_id)})
    
    # Delete the produce item
    result = await produce_collection.delete_one({"_id": ObjectId(item_id)})
    
    return {
        "message": f"Produce '{produce['name']}' deleted successfully",
        "deleted_count": result.deleted_count
    }


@router.post("/prices", response_model=PriceEntry, status_code=status.HTTP_201_CREATED)
async def create_price(price: PriceCreate, current_user: dict = Depends(get_current_user)):
    """
    Add a new price entry for a produce item (Admin only).
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add price entries"
        )
    
    # Verify produce exists
    produce = await produce_collection.find_one({"_id": ObjectId(price.produce_id)})
    if not produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce item not found"
        )
    
    # Convert date to datetime for MongoDB compatibility
    price_date = price.date
    if isinstance(price_date, date) and not isinstance(price_date, datetime):
        price_date = datetime.combine(price_date, datetime.min.time())
    
    price_dict = {
        "produce_id": ObjectId(price.produce_id),
        "price": price.price,
        "region": price.region,
        "date": price_date
    }
    
    result = await prices_collection.insert_one(price_dict)
    price_dict["_id"] = str(result.inserted_id)
    price_dict["produce_id"] = price.produce_id
    
    return PriceEntry(**price_dict)


@router.get("/", response_model=List[ProduceWithPrice])
async def get_all_produce(current_user: dict = Depends(get_current_user)):
    """
    Get all produce items with their latest prices and price statistics.
    """
    produce_list = []
    
    async for produce in produce_collection.find():
        # Get latest price for this produce
        latest_price = await prices_collection.find_one(
            {"produce_id": produce["_id"]},
            sort=[("date", -1)]
        )
        
        # Calculate price statistics
        all_prices = []
        async for price_doc in prices_collection.find({"produce_id": produce["_id"]}):
            all_prices.append(price_doc["price"])
        
        avg_price = sum(all_prices) / len(all_prices) if all_prices else None
        min_price = min(all_prices) if all_prices else None
        max_price = max(all_prices) if all_prices else None
        
        produce_data = {
            "_id": str(produce["_id"]),
            "name": produce["name"],
            "image_url": produce.get("image_url"),
            "latest_price": latest_price["price"] if latest_price else None,
            "avg_price": round(avg_price, 2) if avg_price else None,
            "min_price": round(min_price, 2) if min_price else None,
            "max_price": round(max_price, 2) if max_price else None,
            "region": latest_price["region"] if latest_price else None,
            "date": latest_price["date"].isoformat() if latest_price else None
        }
        
        produce_list.append(ProduceWithPrice(**produce_data))
    
    return produce_list


@router.get("/{item_id}/history")
async def get_price_history(item_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get the last 7 days of price history for a specific produce item.
    """
    # Verify produce exists
    if not ObjectId.is_valid(item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid produce ID"
        )
    
    produce = await produce_collection.find_one({"_id": ObjectId(item_id)})
    if not produce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce item not found"
        )
    
    # Get price history for last 7 days
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    price_history = []
    async for price in prices_collection.find(
        {
            "produce_id": ObjectId(item_id),
            "date": {"$gte": seven_days_ago}
        }
    ).sort("date", 1):
        price_history.append({
            "date": price["date"].isoformat(),
            "price": price["price"],
            "region": price["region"]
        })
    
    return {
        "produce_name": produce["name"],
        "history": price_history
    }
