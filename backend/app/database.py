from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_url: str
    database_name: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    openweather_api_key: str
    groq_api_key: str
    allowed_origins: str

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()

# MongoDB client
client = AsyncIOMotorClient(settings.mongodb_url)
database = client[settings.database_name]

# Collections
users_collection = database.get_collection("users")
produce_collection = database.get_collection("produce")
prices_collection = database.get_collection("prices")
posts_collection = database.get_collection("posts")
comments_collection = database.get_collection("comments")
