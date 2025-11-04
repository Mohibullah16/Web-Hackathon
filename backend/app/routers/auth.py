from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserRegister, UserResponse
from app.database import users_collection
from app.utils.hashing import Hasher
from app.utils.jwt_handler import create_access_token
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register a new user.
    
    - Checks if username or email already exists
    - Hashes the password
    - Creates user in database
    """
    # Check if username already exists
    existing_user = await users_collection.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = await users_collection.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = Hasher.get_password_hash(user_data.password)
    
    # Create user document
    user_dict = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "role": user_data.role,
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    return UserResponse(**user_dict)


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint that returns a JWT access token.
    
    - Verifies username and password
    - Returns JWT token on success
    """
    # Find user by username
    user = await users_collection.find_one({"username": form_data.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not Hasher.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user["username"],
            "user_id": str(user["_id"]),
            "role": user["role"]
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    }


from datetime import datetime
