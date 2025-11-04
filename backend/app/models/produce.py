from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import Optional, Any
from datetime import date as date_type, datetime
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


class ProduceItem(BaseModel):
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "name": "Tomato",
                "image_url": "https://example.com/tomato.jpg"
            }
        }
    }
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None, serialization_alias="id")
    name: str = Field(..., min_length=1, max_length=100)
    image_url: Optional[str] = None


class ProduceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    image_url: Optional[str] = None


class ProduceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    region: Optional[str] = Field(None, min_length=1, max_length=100)


class PriceEntry(BaseModel):
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "example": {
                "produce_id": "507f1f77bcf86cd799439011",
                "price": 150.50,
                "region": "Punjab",
                "date": "2025-11-04"
            }
        }
    }
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    produce_id: PyObjectId
    price: float = Field(..., gt=0)
    region: str = Field(..., min_length=1, max_length=100)
    date: date_type = Field(default_factory=date_type.today)


class PriceCreate(BaseModel):
    produce_id: str
    price: float = Field(..., gt=0)
    region: str = Field(..., min_length=1, max_length=100)
    date: Optional[date_type] = Field(default_factory=date_type.today)


class ProduceWithPrice(BaseModel):
    model_config = {
        "populate_by_name": True,
    }
    
    id: str = Field(alias="_id", serialization_alias="id")
    name: str
    image_url: Optional[str]
    latest_price: Optional[float] = None
    avg_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    region: Optional[str] = None
    date: Optional[str] = None
