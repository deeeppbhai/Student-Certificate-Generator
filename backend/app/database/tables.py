from app.database.database import get_db_connection

def seed_default_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Password for admin: admin123 (hashed or fallback check)
    # Check if admin exists
    cursor.execute("SELECT * FROM users WHERE email = ?", ("admin@scg.edu",))
    user = cursor.fetchone()
    
    if not user:
        # Simple hashed representation or plain salt
        from app.utils.auth import hash_password
        pwd = hash_password("admin123")
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("System Admin", "admin@scg.edu", pwd, "admin")
        )
        conn.commit()
    conn.close()

def seed_sample_students():
    # Disabled: Certificate generation is strictly restricted to user-uploaded Excel files
    pass
