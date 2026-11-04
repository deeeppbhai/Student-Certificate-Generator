import csv
from io import StringIO
from fastapi import APIRouter, HTTPException, Query, Response
from app.database.database import get_db_connection, record_log

router = APIRouter(prefix="/api/logs", tags=["Logs & Reports"])

@router.get("")
def get_generation_logs(
    limit: int = Query(50, ge=1, le=200),
    event_type: str = Query(None),
    status: str = Query(None)
):
    """Retrieve audit generation logs and error reports with optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM generation_logs WHERE 1=1"
    params = []

    if event_type:
        query += " AND UPPER(event_type) = UPPER(?)"
        params.append(event_type)

    if status:
        query += " AND UPPER(status) = UPPER(?)"
        params.append(status)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs

@router.get("/stats")
def get_log_stats():
    """Aggregated generation & error metrics for executive dashboard"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_events FROM generation_logs")
    total_events = cursor.fetchone()["total_events"]

    cursor.execute("SELECT SUM(total_records) as total_records, SUM(success_count) as total_success, SUM(error_count) as total_errors FROM generation_logs")
    sums = cursor.fetchone()
    total_records = sums["total_records"] or 0
    total_success = sums["total_success"] or 0
    total_errors = sums["total_errors"] or 0

    cursor.execute("SELECT status, COUNT(*) as count FROM generation_logs GROUP BY status")
    status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}

    conn.close()

    success_rate = round((total_success / total_records * 100), 1) if total_records > 0 else 100.0

    return {
        "total_events": total_events,
        "total_records_processed": total_records,
        "total_success_count": total_success,
        "total_error_count": total_errors,
        "success_rate_percentage": success_rate,
        "status_breakdown": status_counts
    }

@router.get("/export")
def export_error_and_generation_logs():
    """Export generation logs and error audit trail as CSV report"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM generation_logs ORDER BY id DESC")
    logs = cursor.fetchall()
    conn.close()

    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow([
        "Log_ID",
        "Timestamp",
        "Event_Type",
        "Status",
        "Total_Records",
        "Success_Count",
        "Error_Count",
        "Details_and_Error_Report"
    ])

    for log in logs:
        writer.writerow([
            log["id"],
            log["created_at"],
            log["event_type"],
            log["status"],
            log["total_records"],
            log["success_count"],
            log["error_count"],
            log["details"]
        ])

    csv_output = csv_buffer.getvalue()
    return Response(
        content=csv_output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=generation_audit_and_error_report.csv"}
    )

@router.delete("")
def clear_generation_logs():
    """Clear audit logs table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM generation_logs")
    conn.commit()
    conn.close()
    return {"message": "Audit generation logs cleared successfully."}
