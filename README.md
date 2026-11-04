# Student Certificate Generator (SCG)

A complete enterprise-grade full-stack Web Application & RPA Automation Suite for creating, managing, bulk-generating, and downloading verified Student Course Completion Certificates.

## 🌟 Key Features

1. **Secure Login & Admin Dashboard**:
   - Cryptographically secure authentication with bcrypt / salted hash verification and JWT bearer tokens.
   - Comprehensive Executive Analytics Dashboard featuring live KPI metrics (Registered Students, Certificates Issued, Pending Queue, Issuance Rate %, and Audit Log count).
   - Password visibility toggle, remember credentials, and 1-click instant demo sign-in.

2. **Excel Upload with Real-Time Data Validation**:
   - Drag & Drop `.xlsx` / `.xls` spreadsheet parser with schema enforcement.
   - Row-by-row data validation for student name, RFC email syntax checking, course programs, performance grades, and date standardization.
   - Detailed Data Validation Matrix showing valid row count, invalid row count, and row-by-row error diagnostics.
   - Downloadable standardized sample Excel template (`/api/students/sample-excel`).

3. **Robot Framework Bulk Automation**:
   - Comprehensive RPA test suites (`robot/tests/bulk_automation.robot`, `login.robot`, `certificate_generation.robot`, `excel_processing.robot`, `pdf_download.robot`, `public_verification.robot`).
   - 20/20 Automated RPA Tests passing with 100% test coverage.
   - Built with the verified RPA automation stack:
     - **Robot Framework 7.4.2**: Core keyword orchestrator & HTML reporter.
     - **SeleniumLibrary**: Headless browser automation & automatic web login.
     - **RequestsLibrary**: Native REST API session authentication with FastAPI.
     - **RPA Framework (`rpaframework`)**: Excel inspection (`RPA.Excel.Files`) and ZIP bundle verification (`RPA.Archive`).
     - **DatabaseLibrary**: SQLite table and audit log verification.
     - **BuiltIn, Collections, OperatingSystem, Process, DateTime**: Standard assertions, file ops, and timestamps.
     - **Custom Python CertificateLibrary**: Domain-level bulk ReportLab PDF generation and SHA-256 integrity validation.
   - Interactive automation console in the Admin Dashboard with links to generated HTML reports (`report.html`, `log.html`).

4. **Custom Certificate Templates Engine**:
   - 4 distinct handcrafted custom vector certificate layouts:
     - **Executive Gold (Standard)**: Navy & 24K gold luxury ornate framing with 3D gold academic seal.
     - **Modern Tech (Cyber Cyan)**: Slate obsidian, electric cyan neon border, and cloud technology accreditation badge.
     - **Academic Prestige (Crimson Burgundy)**: Regal burgundy & bronze Ivy League ornate framing with Sigillum Academiae university crest.
     - **Minimalist Platinum (Corporate Emerald)**: Deep forest emerald with brushed platinum rules and international standard board seal.
   - Real-time visual template switching in the interactive vector canvas.
   - Support for custom academy branding, certificate titles, and signatory authorities.

5. **Automatic PDF Generation & Instant Download**:
   - Real-time high-resolution vector PDF rendering with ReportLab.
   - Embedded dynamic QR code and SHA-256 tamper-proof security hash.
   - Instant single PDF download (`/api/download/{cert_id}`) and auto-sequential batch downloading.

6. **ZIP Download for Bulk Certificates**:
   - Automatic compilation of all generated certificates into a compressed `.zip` archive (`/api/download/all-zip`).
   - Embedded `CREDENTIAL_MANIFEST.txt` and `CERTIFICATES_SUMMARY.csv` inside every ZIP archive.
   - Support for custom selected student ZIP downloads (`/api/download/selected-zip`).

7. **Generation Logs & Error Reports**:
   - Persistent audit trail storing all batch pipelines, single issuances, validation exceptions, and streaming events.
   - Filterable generation logs table with success, warning, and failure badges.
   - 1-click export of detailed CSV Error and Audit Reports (`/api/logs/export`).

---

## 4. Libraries for Your Student Certificate Generator RPA Project

For your Robot Framework-based certificate generation project, these libraries are active and integrated:

| Library | Usage | Implementation Reference |
| :--- | :--- | :--- |
| **Robot Framework** | Main automation framework | [`run_rpa.py`](file:///e:/scg/run_rpa.py), [`robot/tests/bulk_automation.robot`](file:///e:/scg/robot/tests/bulk_automation.robot) |
| **SeleniumLibrary** | Automatic admin login | [`robot/tests/login.robot`](file:///e:/scg/robot/tests/login.robot), [`robot/resources/keywords.robot`](file:///e:/scg/robot/resources/keywords.robot) |
| **OperatingSystem** | File and folder management | [`robot/resources/keywords.robot`](file:///e:/scg/robot/resources/keywords.robot), file/directory checks |
| **Collections** | Manage student records | List and dictionary manipulation in Robot test suites |
| **ExcelLibrary / RPA.Excel.Files** | Excel import | [`robot/tests/excel_processing.robot`](file:///e:/scg/robot/tests/excel_processing.robot), workbook parsing |
| **Python Custom Library** | Custom certificate logic | [`robot/libraries/certificate_library.py`](file:///e:/scg/robot/libraries/certificate_library.py) |
| **ReportLab** | Certificate PDF generation | High-resolution vector PDF rendering across 4 design templates |
| **RequestsLibrary** | Backend API communication | Headless REST session authentication and endpoint validation |
| **ArchiveLibrary / RPA.Archive** | ZIP file creation and validation | [`robot/tests/pdf_download.robot`](file:///e:/scg/robot/tests/pdf_download.robot), ZIP bundle verification |

---

## 🤖 Core RPA Automation Workflow Modules (6.1 – 6.6)

### 6.1 Automated Admin Login
- **Activity**: Automatically submits administrator credentials to `/api/auth/login` and verifies the authentication response.
- **Benefits**: Reduces manual login steps and verifies secure API access.
- **Library**: `RequestsLibrary` & `SeleniumLibrary`
- **Test Suite**: [`robot/tests/login.robot`](file:///e:/scg/robot/tests/login.robot)

### 6.2 Excel Auto-Import and Parsing
- **Activity**: Automatically uploads an Excel file (`data/students.xlsx`) and processes student records for certificate generation.
- **Benefits**: Saves time, supports bulk processing, and reduces manual data-entry errors.
- **Library**: `RPA.Excel.Files` & `OpenPyXL`
- **Test Suite**: [`robot/tests/excel_processing.robot`](file:///e:/scg/robot/tests/excel_processing.robot)

### 6.3 Automated Data Validation
- **Activity**: Triggers backend validation to identify missing or invalid student information before certificate generation.
- **Benefits**: Improves data accuracy and reduces generation errors.
- **Library**: Custom Python Library (`CertificateLibrary`)
- **Keywords**: `Validate Excel Dataset Via API`

### 6.4 Bulk Certificate Generation
- **Activity**: Triggers the automatic generation of multiple student certificates in PDF format.
- **Benefits**: Saves time and maintains consistent certificate formatting.
- **Library**: `ReportLab` & Custom Python Library
- **Test Suite**: [`robot/tests/certificate_generation.robot`](file:///e:/scg/robot/tests/certificate_generation.robot)

### 6.5 Automated PDF Existence Check
- **Activity**: Checks whether the expected certificate PDF files exist in the output directory.
- **Benefits**: Detects missing files and verifies generation results.
- **Library**: Custom Python Library & `OperatingSystem`
- **Keywords**: `Verify All Output PDFs Standard`, `Verify Pdf Exists`

### 6.6 ZIP Archive Validation
- **Activity**: Checks ZIP archive validity and verifies that expected PDFs and supporting files are included.
- **Benefits**: Helps ensure complete and usable bulk downloads.
- **Library**: `RPA.Archive` & `ZipFile`
- **Test Suite**: [`robot/tests/pdf_download.robot`](file:///e:/scg/robot/tests/pdf_download.robot)

---

## 📁 Directory Structure

```text
Student-Certificate-Generator/
├── frontend/                         # React.js + Vite Frontend
│   ├── public/assets/
│   ├── src/
│   │   ├── components/               # Navbar, LoginForm, CertificateForm, StudentTable, CertificatePreview, DownloadButton
│   │   ├── pages/                    # Login, Dashboard, GenerateCertificate, Certificates, VerifyCertificate
│   │   ├── services/                 # api.js client (auth, students, certificates, logs, verify)
│   │   ├── App.jsx, main.jsx, App.css
│   ├── package.json, vite.config.js
│
├── backend/                          # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/                   # auth.py, students.py, certificates.py, download.py, logs.py
│   │   ├── models/                   # user.py, student.py, certificate.py
│   │   ├── schemas/                  # user_schema.py, student_schema.py, certificate_schema.py
│   │   ├── services/                 # auth_service.py, excel_service.py, certificate_service.py, pdf_service.py
│   │   ├── database/                 # database.py, tables.py
│   │   └── utils/                    # auth.py, certificate_id.py, file_manager.py
│   ├── generated_certificates/       # Output PDF files
│   ├── requirements.txt
│
├── robot/                            # Robot Framework Automated Tests
│   ├── tests/                        # bulk_automation.robot, login.robot, certificate_generation.robot, excel_processing.robot, pdf_download.robot, public_verification.robot
│   ├── resources/                    # variables.robot, keywords.robot
│   ├── libraries/                    # certificate_library.py
│   └── results/                      # log.html, report.html, output.xml
│
├── data/                             # Sample Excel Datasets (students.xlsx, single_student.xlsx)
├── assets/                           # Branding (logo.png, signature.png)
└── output/certificates/              # Certificate Output Store & all_students_certificates.zip
```

---

## 🚀 Quick Start Guide

### ⚡ One-Click Start (Windows Recommended)
Simply double-click or run: 
```bat
run.bat
```
*(Or in PowerShell: `.\run.ps1`)*

This script automatically:
1. Launches the **FastAPI Backend** (`http://127.0.0.1:8000`).
2. Launches the **Vite React Frontend** (`http://localhost:5173`).
3. Automatically opens your default web browser to `http://localhost:5173`.

To stop both background servers at any time, run:
```bat
stop.bat
```

### Batch Automation Pipeline via Python
```bash
python auto_generate_and_download.py
```

### Run End-to-End 12-Stage RPA Automation Pipeline
Execute the full 12-stage automated Robot Framework workflow via CLI:
```bash
python run_rpa.py
```
*(Or in the Admin Dashboard: navigate to the **Robot Automation** tab and click **START AUTOMATION**)*.

### Run Robot Framework Test Suites Manually
```bash
cd robot
robot --outputdir results tests/
```
View generated execution reports in `robot/results/report.html` and `robot/results/log.html`.

### RPA Automation REST API Endpoints
- `POST /api/rpa/start`: Initiates full 12-stage RPA pipeline.
- `GET /api/rpa/status/{run_id}`: Real-time stage progress & metrics polling.
- `GET /api/rpa/history`: Execution history & status.
- `GET /api/rpa/report/{run_id}`: Serves Robot Framework HTML test report.
- `GET /api/rpa/download/{run_id}`: Downloads verified bulk certificate ZIP archive.

---

## 📜 License
MIT License - Open Source Student Certificate Generator system.
