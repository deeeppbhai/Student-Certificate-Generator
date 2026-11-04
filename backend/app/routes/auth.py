from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.schemas.user_schema import UserLogin, TokenResponse
from app.services.auth_service import authenticate_user, auto_login_demo
from app.utils.auth import decode_access_token
from app.database.database import get_db_connection

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    result, error = authenticate_user(credentials.email, credentials.password)
    if error:
        raise HTTPException(status_code=401, detail=error)
    return result

@router.post("/auto-login", response_model=TokenResponse)
def auto_login():
    """Automatic login route for 1-click admin demo sign in"""
    result, error = auto_login_demo()
    if error:
        raise HTTPException(status_code=401, detail=error)
    return result

@router.get("/me")
def get_current_user_profile(authorization: Optional[str] = Header(None)):
    """Validates JWT bearer token and returns administrator identity"""
    if not authorization or not authorization.startswith("Bearer "):
        # Return default admin demo profile if no token provided
        return {
            "authenticated": False,
            "message": "Authorization header missing"
        }

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid token.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, email, role, created_at FROM users WHERE email = ?", (payload.get("sub"),))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return {
            "authenticated": True,
            "user": {
                "id": payload.get("user_id", 1),
                "full_name": "System Administrator",
                "email": payload.get("sub", "admin@scg.edu"),
                "role": payload.get("role", "admin")
            }
        }

    return {
        "authenticated": True,
        "user": dict(user)
    }

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully."}
