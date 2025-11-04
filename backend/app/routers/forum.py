from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from app.models.forum import PostCreate, Post, CommentCreate, Comment, PostResponse, PostDetailResponse, CommentResponse
from app.database import posts_collection, comments_collection, users_collection
from app.routers.produce import get_current_user
from bson import ObjectId
import shutil
from pathlib import Path

router = APIRouter(prefix="/forum", tags=["Community Forum"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/forum")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new forum post with optional image.
    """
    image_url = None
    if image:
        # Save image
        file_extension = image.filename.split(".")[-1]
        file_name = f"{datetime.utcnow().timestamp()}_{current_user['id']}.{file_extension}"
        file_path = UPLOAD_DIR / file_name
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_url = f"/uploads/forum/{file_name}"
    
    post_dict = {
        "title": title,
        "content": content,
        "image_url": image_url,
        "author_id": ObjectId(current_user["id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await posts_collection.insert_one(post_dict)
    
    return PostResponse(
        _id=str(result.inserted_id),
        title=title,
        content=content,
        image_url=image_url,
        author_id=current_user["id"],
        author_username=current_user["username"],
        created_at=post_dict["created_at"],
        updated_at=post_dict["updated_at"],
        comment_count=0
    )


@router.get("/posts", response_model=List[PostResponse])
async def get_all_posts(current_user: dict = Depends(get_current_user)):
    """
    Get all forum posts with author information and comment count.
    """
    posts = []
    
    async for post in posts_collection.find().sort("created_at", -1):
        # Get author info
        author = await users_collection.find_one({"_id": post["author_id"]})
        
        # Count comments
        comment_count = await comments_collection.count_documents({"post_id": post["_id"]})
        
        posts.append(PostResponse(
            _id=str(post["_id"]),
            title=post["title"],
            content=post["content"],
            image_url=post.get("image_url"),
            author_id=str(post["author_id"]),
            author_username=author["username"] if author else "Unknown",
            created_at=post["created_at"],
            updated_at=post["updated_at"],
            comment_count=comment_count
        ))
    
    return posts


@router.get("/posts/{post_id}", response_model=PostDetailResponse)
async def get_post_detail(post_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get a single post with all its comments.
    """
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get author info
    author = await users_collection.find_one({"_id": post["author_id"]})
    
    # Get all comments
    comments = []
    async for comment in comments_collection.find({"post_id": ObjectId(post_id)}).sort("created_at", 1):
        comment_author = await users_collection.find_one({"_id": comment["author_id"]})
        comments.append(CommentResponse(
            _id=str(comment["_id"]),
            post_id=post_id,
            author_id=str(comment["author_id"]),
            author_username=comment_author["username"] if comment_author else "Unknown",
            content=comment["content"],
            created_at=comment["created_at"]
        ))
    
    return PostDetailResponse(
        _id=str(post["_id"]),
        title=post["title"],
        content=post["content"],
        image_url=post.get("image_url"),
        author_id=str(post["author_id"]),
        author_username=author["username"] if author else "Unknown",
        created_at=post["created_at"],
        updated_at=post["updated_at"],
        comment_count=len(comments),
        comments=comments
    )


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(post_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    """
    Add a comment to a post.
    """
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    # Verify post exists
    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comment_dict = {
        "post_id": ObjectId(post_id),
        "author_id": ObjectId(current_user["id"]),
        "content": comment_data.content,
        "created_at": datetime.utcnow()
    }
    
    result = await comments_collection.insert_one(comment_dict)
    
    return CommentResponse(
        _id=str(result.inserted_id),
        post_id=post_id,
        author_id=current_user["id"],
        author_username=current_user["username"],
        content=comment_data.content,
        created_at=comment_dict["created_at"]
    )


@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    title: str = Form(...),
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a post. Only the author or admin can update.
    """
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user is author or admin
    if str(post["author_id"]) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this post"
        )
    
    update_dict = {
        "title": title,
        "content": content,
        "updated_at": datetime.utcnow()
    }
    
    # Handle image upload
    if image:
        file_extension = image.filename.split(".")[-1]
        file_name = f"{datetime.utcnow().timestamp()}_{current_user['id']}.{file_extension}"
        file_path = UPLOAD_DIR / file_name
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        update_dict["image_url"] = f"/uploads/forum/{file_name}"
        
        # Delete old image if exists
        if post.get("image_url"):
            old_file_path = Path(".") / post["image_url"].lstrip("/")
            if old_file_path.exists():
                old_file_path.unlink()
    
    await posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": update_dict}
    )
    
    # Get updated post
    updated_post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    author = await users_collection.find_one({"_id": updated_post["author_id"]})
    comment_count = await comments_collection.count_documents({"post_id": ObjectId(post_id)})
    
    return PostResponse(
        _id=str(updated_post["_id"]),
        title=updated_post["title"],
        content=updated_post["content"],
        image_url=updated_post.get("image_url"),
        author_id=str(updated_post["author_id"]),
        author_username=author["username"] if author else "Unknown",
        created_at=updated_post["created_at"],
        updated_at=updated_post["updated_at"],
        comment_count=comment_count
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a post. Only the author or admin can delete.
    """
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user is author or admin
    if str(post["author_id"]) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this post"
        )
    
    # Delete image if exists
    if post.get("image_url"):
        file_path = Path(".") / post["image_url"].lstrip("/")
        if file_path.exists():
            file_path.unlink()
    
    # Delete post
    await posts_collection.delete_one({"_id": ObjectId(post_id)})
    
    # Delete all comments
    await comments_collection.delete_many({"post_id": ObjectId(post_id)})
    
    return None
