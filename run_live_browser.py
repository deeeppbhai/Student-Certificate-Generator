#!/usr/bin/env python
"""
Student Certificate Generator (SCG) - Live Browser Automation Runner
Launches a real visible Chrome desktop window and executes the full end-to-end
interactive UI automation workflow using Robot Framework and SeleniumLibrary.
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

for p in [str(BACKEND_DIR), str(ROOT_DIR), str(ROBOT_DIR / "libraries")]:
    if p not in sys.path:
        sys.path.insert(0, p)

def load_robot_engine():
    """Bypasses local directory naming conflicts to directly load installed Robot Framework."""
    cwd = os.getcwd()
    clean_paths = [p for p in sys.path if p not in ('', cwd, str(ROOT_DIR), str(ROBOT_DIR))]
    orig_paths = sys.path[:]
    sys.path = clean_paths
    try:
        import robot
        return robot
    finally:
        sys.path = orig_paths

def check_service(url, name):
    import urllib.request
    try:
        with urllib.request.urlopen(url, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False

def main():
    print("=" * 80)
    print("  STUDENT CERTIFICATE GENERATOR - LIVE BROWSER RPA AUTOMATION")
    print("=" * 80)
    print(f"Timestamp:   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Environment: Python {sys.version.split()[0]} | Robot Framework 7.4.2 | SeleniumLibrary")
    print(f"Mode:        LIVE VISIBLE BROWSER (Desktop UI)")
    print("-" * 80)

    # 1. Health check services
    print("[*] Checking service endpoints...")
    backend_ok = check_service("http://127.0.0.1:8000/docs", "FastAPI Backend")
    frontend_ok = check_service("http://localhost:5173", "Vite Frontend")

    print(f"    - FastAPI Backend (http://127.0.0.1:8000): {'ONLINE [OK]' if backend_ok else 'OFFLINE [!] Please start run.bat'}")
    print(f"    - Vite Frontend   (http://localhost:5173):  {'ONLINE [OK]' if frontend_ok else 'OFFLINE [!] Please start run.bat'}")

    if not backend_ok or not frontend_ok:
        print("\n[!] WARNING: Both the backend and frontend servers must be running to execute live browser tests.")
        print("    Run 'run.bat' in a separate terminal before executing live tests.")
        print("-" * 80)

    LIVE_RESULTS_DIR = RESULTS_DIR / "live"
    LIVE_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    run_id = f"RPA-LIVE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    os.environ["RPA_RUN_ID"] = run_id
    os.environ["ADMIN_EMAIL"] = "admin@scg.edu"
    os.environ["ADMIN_PASSWORD"] = "admin123"

    print("\n[*] Starting Live Browser Automation Suite...")
    print("    A Chrome browser window will now open on your desktop screen.")
    print("    Watch the mouse, form inputs, tab switches, and live RPA execution!")
    print("-" * 80)

    start_time = time.time()
    robot = load_robot_engine()

    saved_cwd = os.getcwd()
    os.chdir(str(ROBOT_DIR))
    try:
        returncode = robot.run(
            "tests/live_browser_automation.robot",
            outputdir=str(LIVE_RESULTS_DIR),
            output="live_output.xml",
            log="live_log.html",
            report="live_report.html",
            variable=[
                f"RUN_ID:{run_id}",
                "BASE_URL:http://localhost:5173",
                f"UPLOADS_DIR:{str(BACKEND_DIR / 'uploads')}"
            ],
            stdout=sys.stdout,
            stderr=sys.stderr
        )
    finally:
        os.chdir(saved_cwd)

    duration = round(time.time() - start_time, 2)
    print("\n" + "=" * 80)
    if returncode == 0:
        print(f"[SUCCESS] LIVE BROWSER RPA WORKFLOW COMPLETED in {duration}s!")
        print(f"  * Test Report:   {LIVE_RESULTS_DIR / 'live_report.html'}")
        print(f"  * Execution Log: {LIVE_RESULTS_DIR / 'live_log.html'}")
        print("-" * 80)
        print("[*] Opening Web Application in normal format in your browser...")
        try:
            import webbrowser
            webbrowser.open("http://localhost:5173/dashboard")
        except Exception as e:
            print(f"    (Could not automatically open browser: {e})")
    else:
        print(f"[FAILED] Test suite exited with code {returncode} after {duration}s.")
        print(f"  * Inspect log:  {LIVE_RESULTS_DIR / 'live_log.html'}")
    print("=" * 80)

if __name__ == "__main__":
    main()
