import bcrypt


class Hasher:
    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Hash a plain-text password using bcrypt.
        
        Args:
            password: Plain-text password to hash
            
        Returns:
            Hashed password string
        """
        # Encode password and generate hash
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain password against its hash.
        
        Args:
            plain_password: Plain-text password to verify
            hashed_password: Previously hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
