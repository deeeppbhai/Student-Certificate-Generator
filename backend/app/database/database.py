import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "scg_database.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Students Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        course TEXT NOT NULL,
        grade TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        certificate_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Certificates Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        certificate_id TEXT UNIQUE NOT NULL,
        student_id INTEGER NOT NULL,
        student_name TEXT NOT NULL,
        course_name TEXT NOT NULL,
        grade TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        template_name TEXT DEFAULT 'Standard',
        pdf_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id)
    )
    """)
    
    # Generation Logs & Error Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS generation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        total_records INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # RPA Automation Runs & Pipeline History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rpa_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        current_stage TEXT NOT NULL,
        progress_pct INTEGER DEFAULT 0,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        duration_seconds REAL DEFAULT 0,
        template_name TEXT DEFAULT 'Standard',
        auth_status TEXT DEFAULT 'PENDING',
        excel_import_status TEXT DEFAULT 'PENDING',
        total_records INTEGER DEFAULT 0,
        valid_records INTEGER DEFAULT 0,
        invalid_records INTEGER DEFAULT 0,
        certificates_generated INTEGER DEFAULT 0,
        pdf_verification_status TEXT DEFAULT 'PENDING',
        zip_validation_status TEXT DEFAULT 'PENDING',
        cert_verification_status TEXT DEFAULT 'PENDING',
        final_execution_status TEXT DEFAULT 'PENDING',
        error_message TEXT,
        report_url TEXT,
        zip_url TEXT,
        stage_logs TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()

def create_rpa_run(run_id: str, template_name: str = "Standard") -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO rpa_runs 
        (run_id, status, current_stage, progress_pct, template_name, auth_status, stage_logs)
        VALUES (?, 'INITIALIZING', 'Initializing', 5, ?, 'IN_PROGRESS', '[]')""",
        (run_id, template_name)
    )
    conn.commit()
    cursor.execute("SELECT * FROM rpa_runs WHERE run_id = ?", (run_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row

def update_rpa_run(run_id: str, **kwargs):
    if not kwargs:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in kwargs.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.append(run_id)
    query = f"UPDATE rpa_runs SET {', '.join(fields)} WHERE run_id = ?"
    cursor.execute(query, tuple(values))
    conn.commit()
    conn.close()

def get_rpa_run(run_id: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rpa_runs WHERE run_id = ?", (run_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def list_rpa_runs(limit: int = 20) -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rpa_runs ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def record_log(event_type: str, status: str, total_records: int = 0, success_count: int = 0, error_count: int = 0, details: str = ""):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO generation_logs 
            (event_type, status, total_records, success_count, error_count, details)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (event_type, status, total_records, success_count, error_count, details)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to record log: {e}")

def reset_student_and_certificate_data():
    """Wipes student and certificate records to ensure certificates are generated strictly for the uploaded Excel file"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM certificates")
        cursor.execute("DELETE FROM students")
        try:
            cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('students', 'certificates')")
        except Exception:
            pass
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to reset student and certificate tables: {e}")
