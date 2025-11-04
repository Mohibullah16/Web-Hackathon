from pydantic import BaseModel, EmailStr, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import Optional, Any
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


class User(BaseModel):
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "example": {
                "username": "john_farmer",
                "email": "john@example.com",
                "role": "farmer"
            }
        }
    }
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    hashed_password: str
    role: str = Field(default="farmer", pattern="^(admin|farmer)$")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="farmer", pattern="^(admin|farmer)$")


class UserResponse(BaseModel):
    model_config = {"populate_by_name": True}
    
    id: str = Field(alias="_id")
    username: str
    email: EmailStr
    role: str
    created_at: datetime
