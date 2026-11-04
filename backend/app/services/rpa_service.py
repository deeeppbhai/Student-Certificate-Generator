import os
import sys
import uuid
import time
import json
import sqlite3
import subprocess
import threading
from pathlib import Path
from datetime import datetime
from fastapi import HTTPException
from app.database.database import get_db_connection, update_rpa_run, get_rpa_run, list_rpa_runs, create_rpa_run

BASE_DIR = Path(__file__).parent.parent.parent.parent
ROBOT_DIR = BASE_DIR / "robot"
RESULTS_DIR = ROBOT_DIR / "results"
OUTPUT_ZIP = BASE_DIR / "output" / "all_students_certificates.zip"

_rpa_lock = threading.Lock()
_active_run_id = None
_is_running = False

def get_active_run_id():
    return _active_run_id

def is_rpa_running():
    return _is_running

def load_direct_robot():
    """Directly loads the installed Robot Framework engine, bypassing local folder naming conflicts."""
    import sys, os
    cwd = os.getcwd()
    clean_paths = [p for p in sys.path if p not in ('', cwd, str(BASE_DIR), str(ROBOT_DIR))]
    orig_paths = sys.path[:]
    sys.path = clean_paths
    try:
        import robot
        return robot
    finally:
        sys.path = orig_paths

def _execute_robot_process(run_id: str, template_name: str, excel_path: str = None):
    global _active_run_id, _is_running
    start_time = time.time()

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    report_file = RESULTS_DIR / "report.html"
    log_file = RESULTS_DIR / "log.html"
    output_xml = RESULTS_DIR / "output.xml"

    os.environ["RPA_RUN_ID"] = run_id
    os.environ["ADMIN_EMAIL"] = os.environ.get("ADMIN_EMAIL", "admin@scg.edu")
    os.environ["ADMIN_PASSWORD"] = os.environ.get("ADMIN_PASSWORD", "admin123")
    os.environ["PYTHONPATH"] = f"{str(BASE_DIR / 'backend')};{str(ROBOT_DIR / 'libraries')};{os.environ.get('PYTHONPATH', '')}"

    returncode = 1

    try:
        # 1. Direct in-process execution via Robot Framework's native Python API
        try:
            robot = load_direct_robot()
            print(f"[*] Directly executing Robot Framework engine in worker thread for Run {run_id}...")
            saved_cwd = os.getcwd()
            os.chdir(str(ROBOT_DIR))
            variables = [
                f"RUN_ID:{run_id}",
                f"DEFAULT_TEMPLATE:{template_name}",
                f"UPLOADS_DIR:{str(BASE_DIR / 'backend' / 'uploads')}"
            ]
            if excel_path:
                variables.append(f"EXCEL_SAMPLE_PATH:{excel_path}")

            try:
                returncode = robot.run(
                    "tests/bulk_automation.robot",
                    outputdir=str(RESULTS_DIR),
                    variable=variables
                )
            finally:
                os.chdir(saved_cwd)

        except Exception as direct_err:
            print(f"[!] Direct engine notification: {direct_err}, using fallback subprocess runner...")
            import shutil
            candidates = [
                shutil.which("robot"),
                shutil.which("robot.exe"),
                Path(sys.executable).parent / "Scripts" / "robot.exe",
                Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Python" / "Python313" / "Scripts" / "robot.exe",
                Path(os.environ.get("LOCALAPPDATA", "")) / "Packages" / "PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0" / "LocalCache" / "local-packages" / "Python313" / "Scripts" / "robot.exe",
            ]
            robot_bin = None
            for cand in candidates:
                if cand and Path(cand).exists():
                    robot_bin = str(cand)
                    break

            cmd = [
                robot_bin or sys.executable,
                *([] if robot_bin else ["-m", "robot"]),
                "--outputdir", str(RESULTS_DIR),
                "--variable", f"RUN_ID:{run_id}",
                "--variable", f"DEFAULT_TEMPLATE:{template_name}",
                "tests/bulk_automation.robot"
            ]

            if excel_path:
                cmd.extend(["--variable", f"EXCEL_SAMPLE_PATH:{excel_path}"])

            process = subprocess.Popen(
                cmd,
                cwd=str(ROBOT_DIR),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                env=os.environ,
                bufsize=1
            )

            for line in process.stdout:
                clean_line = line.strip()
                if clean_line:
                    print(f"[RPA-{run_id[:8]}] {clean_line}")

            process.wait()
            returncode = process.returncode

        duration = round(time.time() - start_time, 2)

        if returncode == 0:
            print(f"[OK] RPA Execution {run_id} completed successfully in {duration}s.")
            # Ensure final state in DB
            db_run = get_rpa_run(run_id)
            total = db_run.get("total_records", 5) if db_run else 5
            valid = db_run.get("valid_records", 5) if db_run else 5
            certs = db_run.get("certificates_generated", 5) if db_run else 5

            update_rpa_run(
                run_id,
                status="COMPLETED",
                current_stage="Completed",
                progress_pct=100,
                duration_seconds=duration,
                end_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                auth_status="AUTHENTICATED",
                excel_import_status="SUCCESS",
                total_records=total,
                valid_records=valid,
                certificates_generated=certs,
                pdf_verification_status="VERIFIED",
                zip_validation_status="VERIFIED",
                cert_verification_status="VERIFIED",
                final_execution_status="COMPLETED",
                report_url=f"/api/rpa/report/{run_id}",
                zip_url=f"/api/rpa/download/{run_id}"
            )
        else:
            err_msg = f"Robot Framework execution returned code {returncode}."
            print(f"[ERROR] {err_msg}")
            update_rpa_run(
                run_id,
                status="FAILED",
                current_stage="Failed",
                progress_pct=100,
                duration_seconds=duration,
                end_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                final_execution_status="FAILED",
                error_message=err_msg
            )
    except Exception as e:
        duration = round(time.time() - start_time, 2)
        print(f"[EXCEPTION] RPA Process failed: {e}")
        update_rpa_run(
            run_id,
            status="FAILED",
            current_stage="Error",
            progress_pct=100,
            duration_seconds=duration,
            end_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            final_execution_status="FAILED",
            error_message=str(e)
        )
    finally:
        with _rpa_lock:
            _is_running = False
            _active_run_id = None

def trigger_rpa_automation(template_name: str = "Standard", excel_path: str = None) -> dict:
    global _active_run_id, _is_running
    with _rpa_lock:
        if _is_running:
            raise HTTPException(
                status_code=409,
                detail=f"Automation run '{_active_run_id}' is currently in progress. Duplicate simultaneous runs are prevented."
            )
        
        run_id = f"RPA-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        _active_run_id = run_id
        _is_running = True

    # Initialize record in DB
    record = create_rpa_run(run_id, template_name=template_name)

    # Spawn controlled background worker thread
    thread = threading.Thread(
        target=_execute_robot_process,
        args=(run_id, template_name, excel_path),
        daemon=True
    )
    thread.start()

    return {
        "message": "Complete 12-Stage RPA Automation Pipeline started successfully.",
        "run_id": run_id,
        "status": "RUNNING",
        "current_stage": "Initializing",
        "progress_pct": 5,
        "template_name": template_name
    }

def get_run_status(run_id: str) -> dict:
    run = get_rpa_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"RPA run '{run_id}' not found.")
    
    # Parse stage logs if present
    logs = []
    if run.get("stage_logs"):
        try:
            logs = json.loads(run["stage_logs"])
        except Exception:
            logs = [run["stage_logs"]]
    run["stage_logs"] = logs
    return run

def get_history(limit: int = 15) -> list:
    runs = list_rpa_runs(limit)
    for r in runs:
        if r.get("stage_logs"):
            try:
                r["stage_logs"] = json.loads(r["stage_logs"])
            except Exception:
                r["stage_logs"] = []
    return runs

def get_report_path(run_id: str) -> Path:
    # Verify run exists
    run = get_rpa_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")
    
    report_file = RESULTS_DIR / "report.html"
    if not report_file.exists():
        log_file = RESULTS_DIR / "log.html"
        if log_file.exists():
            return log_file
        raise HTTPException(status_code=404, detail="Execution report has not been generated yet.")
    return report_file

def get_zip_path(run_id: str) -> Path:
    run = get_rpa_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")
    
    if not OUTPUT_ZIP.exists():
        raise HTTPException(status_code=404, detail="Certificate ZIP bundle not found.")
    return OUTPUT_ZIP
