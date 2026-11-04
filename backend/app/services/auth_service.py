from app.database.database import get_db_connection
from app.utils.auth import verify_password, hash_password, create_access_token

def authenticate_user(email: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        # Fallback auto-provision for admin demo
        if email == "admin@scg.edu" and password == "admin123":
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                ("System Admin", "admin@scg.edu", hash_password("admin123"), "admin")
            )
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            conn.close()
        else:
            return None, "Invalid email or password"
            
    if not verify_password(password, user["password_hash"]):
        return None, "Invalid email or password"

    token = create_access_token({"sub": user["email"], "user_id": user["id"], "role": user["role"]})
    user_data = {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"]
    }
    return {"access_token": token, "user": user_data}, None

def auto_login_demo():
    return authenticate_user("admin@scg.edu", "admin123")
