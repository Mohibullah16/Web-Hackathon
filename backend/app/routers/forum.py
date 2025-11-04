from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from app.models.forum import PostCreate, Post, CommentCreate, Comment, PostResponse, PostDetailResponse, CommentResponse
from app.database import posts_collection, comments_collection, users_collection
from app.routers.produce import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/forum", tags=["Community Forum"])


@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    """
    Create a new forum post.
    """
    post_dict = {
        "title": post_data.title,
        "content": post_data.content,
        "author_id": ObjectId(current_user["id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await posts_collection.insert_one(post_dict)
    
    return PostResponse(
        _id=str(result.inserted_id),
        title=post_data.title,
        content=post_data.content,
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
