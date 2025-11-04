from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, Dict
from app.database import settings


def create_access_token(data: dict) -> str:
    """
    Create a JWT access token with expiration.
    
    Args:
        data: Payload data to encode in the token
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None
