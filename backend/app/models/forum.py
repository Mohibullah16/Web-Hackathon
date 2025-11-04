from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ],
        serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x)
        ))
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class Post(BaseModel):
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    author_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)


class Comment(BaseModel):
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    post_id: PyObjectId
    author_id: PyObjectId
    content: str = Field(..., min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentResponse(BaseModel):
    model_config = {"populate_by_name": True}
    
    id: str = Field(alias="_id", serialization_alias="id")
    post_id: str
    author_id: str
    author_username: str
    content: str
    created_at: datetime


class PostResponse(BaseModel):
    model_config = {"populate_by_name": True}
    
    id: str = Field(alias="_id", serialization_alias="id")
    title: str
    content: str
    author_id: str
    author_username: str
    created_at: datetime
    updated_at: datetime
    comment_count: int = 0


class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []
