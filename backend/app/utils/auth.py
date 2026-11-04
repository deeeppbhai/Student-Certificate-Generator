import os
import hmac
import hashlib
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "scg_super_secret_jwt_key_2026_antigravity_token")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        salt = "scg_secure_salt_2026"
        h = hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
        return f"sha256${h}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False

    if hashed_password.startswith("sha256$"):
        # Check current secure salt
        h1 = f"sha256${hashlib.sha256(f'scg_secure_salt_2026:{plain_password}'.encode('utf-8')).hexdigest()}"
        # Check legacy salt
        h2 = f"sha256${hashlib.sha256(('scg_salt_' + plain_password).encode('utf-8')).hexdigest()}"
        return hmac.compare_digest(hashed_password, h1) or hmac.compare_digest(hashed_password, h2)
        
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        h2 = f"sha256${hashlib.sha256(('scg_salt_' + plain_password).encode('utf-8')).hexdigest()}"
        return hmac.compare_digest(hashed_password, h2)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
