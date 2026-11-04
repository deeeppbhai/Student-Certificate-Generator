#!/usr/bin/env python
"""
Student Certificate Generator (SCG) - Standalone RPA Automation Runner
Executes the full 12-Stage End-to-End Robot Framework Bulk Automation Pipeline.
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).parent.resolve()

ROBOT_DIR = ROOT_DIR / "robot"
RESULTS_DIR = ROBOT_DIR / "results"
BACKEND_DIR = ROOT_DIR / "backend"

# Ensure root, backend, and robot libraries are on Python path
for p in [str(BACKEND_DIR), str(ROOT_DIR), str(ROBOT_DIR / "libraries")]:
    if p not in sys.path:
        sys.path.insert(0, p)

def load_robot_engine():
    """Directly loads the installed Robot Framework engine, bypassing local folder naming conflicts."""
    cwd = os.getcwd()
    clean_paths = [p for p in sys.path if p not in ('', cwd, str(ROOT_DIR), str(ROBOT_DIR))]
    orig_paths = sys.path[:]
    sys.path = clean_paths
    try:
        import robot
        return robot
    finally:
        sys.path = orig_paths

def run_rpa():
    print("=" * 75)
    print(" STUDENT CERTIFICATE GENERATOR - DIRECT RPA AUTOMATION ENGINE")
    print("=" * 75)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Environment: Python {sys.version.split()[0]} | Direct In-Process Robot Framework")
    print("-" * 75)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    run_id = f"RPA-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Setup environment
    os.environ["RPA_RUN_ID"] = run_id
    os.environ["ADMIN_EMAIL"] = os.environ.get("ADMIN_EMAIL", "admin@scg.edu")
    os.environ["ADMIN_PASSWORD"] = os.environ.get("ADMIN_PASSWORD", "admin123")
    os.environ["PYTHONPATH"] = f"{str(BACKEND_DIR)};{str(ROOT_DIR)};{str(ROBOT_DIR / 'libraries')};{os.environ.get('PYTHONPATH', '')}"

    # Initialize DB if needed (with resilient dual-path import)
    try:
        try:
            from app.database.database import init_db, create_rpa_run
        except (ModuleNotFoundError, ImportError):
            from backend.app.database.database import init_db, create_rpa_run
        init_db()
        create_rpa_run(run_id, template_name="Standard")
    except Exception as e:
        print(f"[!] Database initialization notice: {e}")

    start_time = time.time()
    returncode = 1

    # Direct in-process execution via Robot Framework's native Python API
    try:
        robot = load_robot_engine()
        print(f"[*] Directly executing Robot Framework engine (zero subprocess overhead)...")
        print(f"[*] Run ID: {run_id}")
        print("-" * 75)

        saved_cwd = os.getcwd()
        os.chdir(str(ROBOT_DIR))
        try:
            returncode = robot.run(
                "tests/bulk_automation.robot",
                outputdir=str(RESULTS_DIR),
                variable=[
                    f"RUN_ID:{run_id}",
                    "DEFAULT_TEMPLATE:Standard",
                    f"UPLOADS_DIR:{str(ROOT_DIR / 'backend' / 'uploads')}"
                ],
                stdout=sys.stdout,
                stderr=sys.stderr
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
            "--variable", "DEFAULT_TEMPLATE:Standard",
            "tests/bulk_automation.robot"
        ]

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
            clean = line.strip()
            if clean:
                print(f"  {clean}")
        process.wait()
        returncode = process.returncode

    duration = round(time.time() - start_time, 2)

    print("-" * 75)
    if returncode == 0:
        print(f"[OK] COMPLETE DIRECT RPA AUTOMATION FINISHED SUCCESSFULLY in {duration}s!")
        print(f"  * HTML Report:  {RESULTS_DIR / 'report.html'}")
        print(f"  * Execution Log: {RESULTS_DIR / 'log.html'}")
        print(f"  * Bulk ZIP:     {ROOT_DIR / 'output' / 'all_students_certificates.zip'}")
        print("=" * 75)
        return 0
    else:
        print(f"[FAILED] Automation encountered errors (Exit Code: {returncode}) in {duration}s.")
        print(f"  * Check Log:    {RESULTS_DIR / 'log.html'}")
        print("=" * 75)
        return returncode

if __name__ == "__main__":
    sys.exit(run_rpa())
