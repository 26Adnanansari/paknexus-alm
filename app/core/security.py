import base64
import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.core.config import settings

# Fix for bcrypt 4.0+ 72-byte limit error in passlib
_orig_hashpw = bcrypt.hashpw
def _fixed_hashpw(password, salt):
    if isinstance(password, str):
        password = password.encode("utf-8")
    if len(password) > 72:
        password = password[:72]
    return _orig_hashpw(password, salt)
bcrypt.hashpw = _fixed_hashpw

# Workaround for passlib/bcrypt incompatibility (AttributeError: module 'bcrypt' has no attribute '__about__')
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SecurityService:
    _fernet_cache: Optional[Fernet] = None

    @staticmethod
    def _get_fernet() -> Fernet:
        if SecurityService._fernet_cache:
            return SecurityService._fernet_cache

        # Use the master key to derive a Fernet key
        # In a real scenario, VAULT_MASTER_KEY should be a secure random hex string
        key_material = bytes.fromhex(settings.VAULT_MASTER_KEY)
        
        # We use a static salt because we want deterministic key generation from the master key
        # For even higher security, we could store a random salt per tenant, but this complicates the simple vault requirements
        salt = b'control_plane_static_salt' 
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_material))
        SecurityService._fernet_cache = Fernet(key)
        return SecurityService._fernet_cache

    @staticmethod
    def encrypt(data: str) -> str:
        f = SecurityService._get_fernet()
        return f.encrypt(data.encode()).decode()

    @staticmethod
    def decrypt(token: str) -> str:
        f = SecurityService._get_fernet()
        return f.decrypt(token.encode()).decode()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        print(f"DEBUG: verify_password called.")
        print(f"DEBUG: plain_password length: {len(plain_password)}")
        
        if not plain_password or not hashed_password:
            return False
            
        # bcrypt has a 72-byte limit for the secret.
        # Passlib should handle this, but if it doesn't, we truncate to avoid ValueError.
        safe_password = plain_password[:72] if len(plain_password) > 72 else plain_password

        try:
            return pwd_context.verify(safe_password, hashed_password)
        except Exception as e:
            print(f"ERROR: verify_password failed: {str(e)}")
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode = {"exp": expire, "sub": str(subject)}
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
