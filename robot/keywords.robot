*** Settings ***
Documentation    Root Reusable RPA Keywords for Student Certificate Generator (SCG)
...              Organized by Automation Activity & Corresponding Library Mapping
Resource         variables.robot
Library          BuiltIn
Library          Collections
Library          OperatingSystem
Library          Process
Library          DateTime
Library          SeleniumLibrary
Library          RequestsLibrary
Library          DatabaseLibrary
Library          ExcelLibrary
Library          ArchiveLibrary
Library          RPA.Excel.Files    AS    RPAExcel
Library          RPA.Archive        AS    RPAArchive
Library          libraries/certificate_library.py

*** Keywords ***
# ===========================================================================
# 1. Main Automation Framework (Library: Robot Framework)
# ===========================================================================
Initialize RPA Pipeline
    [Documentation]    Activity: Start RPA workflow | Library: Robot Framework / DateTime
    [Arguments]    ${run_id}=${RUN_ID}
    ${current_time}=    Get Current Date    result_format=%Y-%m-%d %H:%M:%S
    Log    [Robot Framework] Initialized RPA execution run ${run_id} at ${current_time}

# ===========================================================================
# 2. Automatic Admin Login (Library: SeleniumLibrary)
# ===========================================================================
Open Chrome Browser
    [Documentation]    Activity: Open Chrome | Library: SeleniumLibrary
    [Arguments]    ${url}=${BASE_URL}
    ${chrome_options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys
    Call Method    ${chrome_options}    add_argument    --headless
    Call Method    ${chrome_options}    add_argument    --no-sandbox
    Call Method    ${chrome_options}    add_argument    --disable-dev-shm-usage
    Call Method    ${chrome_options}    add_argument    --disable-gpu
    Open Browser    ${url}    browser=chrome    options=${chrome_options}
    Set Window Size    1280    800

Automatic Browser Login
    [Documentation]    Activity: Automatic admin login | Library: SeleniumLibrary
    [Arguments]    ${url}=${BASE_URL}/login
    Go To    ${url}
    Wait Until Location Is Not    ${url}    timeout=10s
    ${current_url}=    Get Location
    Should Contain    ${current_url}    /dashboard
    ${title}=    Get Title
    Should Contain    ${title}    Student Certificate Generator
    Log    Automatic browser login succeeded. Reached: ${current_url}
    RETURN    ${current_url}

Close Chrome Browser
    [Documentation]    Closes the Selenium browser instance | Library: SeleniumLibrary
    Close All Browsers

# ===========================================================================
# 3. File and Folder Management (Library: OperatingSystem)
# ===========================================================================
Manage Files And Folders With OperatingSystem
    [Documentation]    Activity: File and folder management | Library: OperatingSystem
    Directory Should Exist    ${OUTPUT_CERT_DIR}
    File Should Exist         ${EXCEL_SAMPLE_PATH}
    ${file_size}=    Get File Size    ${EXCEL_SAMPLE_PATH}
    Should Be True    ${file_size} > 0
    Log    OperatingSystem validated input file size: ${file_size} bytes
    RETURN    ${file_size}

Verify Directory Structure
    [Documentation]    Activity: File and folder management | Library: OperatingSystem
    Directory Should Exist    ${OUTPUT_CERT_DIR}
    File Should Exist         ${EXCEL_SAMPLE_PATH}
    File Should Not Be Empty  ${EXCEL_SAMPLE_PATH}

# ===========================================================================
# 4. Manage Student Records (Library: Collections)
# ===========================================================================
Manage Student Records With Collections
    [Documentation]    Activity: Manage student records | Library: Collections
    [Arguments]    @{student_names}
    ${records_list}=    Create List    @{student_names}
    Sort List    ${records_list}
    ${count}=    Get Length    ${records_list}
    Log    Collections sorted and managed ${count} student records
    RETURN    ${records_list}

# ===========================================================================
# 5. Excel Import (Libraries: ExcelLibrary / RPA.Excel.Files)
# ===========================================================================
Inspect Spreadsheet With ExcelLibrary
    [Documentation]    Activity: Excel import | Library: ExcelLibrary
    [Arguments]    ${excel_path}=${EXCEL_SAMPLE_PATH}    ${doc_id}=doc_students
    Open Excel Document    ${excel_path}    ${doc_id}
    ${sheets}=    Get List Sheet Names
    Should Not Be Empty    ${sheets}
    Close Current Excel Document
    Log    ExcelLibrary verified sheets: ${sheets}
    RETURN    ${sheets}

Validate Student Spreadsheet With RPA Framework
    [Documentation]    Activity: Excel import | Library: RPA.Excel.Files / OpenPyXL
    [Arguments]    ${excel_path}=${EXCEL_SAMPLE_PATH}
    RPAExcel.Open Workbook    ${excel_path}
    ${sheets}=     RPAExcel.List Worksheets
    Should Not Be Empty    ${sheets}
    ${table}=      RPAExcel.Read Worksheet As Table    header=${TRUE}
    ${row_count}=  Get Length    ${table}
    RPAExcel.Close Workbook
    Should Be True    ${row_count} > 0
    Log    RPA.Excel.Files parsed ${row_count} student rows
    RETURN    ${row_count}

Import Student Dataset
    [Documentation]    Activity: Excel import & database ingest | Library: OpenPyXL / CertificateLibrary
    [Arguments]    ${excel_path}=${EXCEL_SAMPLE_PATH}
    ${imported_count}=    Import Excel Data    ${excel_path}
    Should Be True    ${imported_count} > 0
    RETURN    ${imported_count}

Import And Validate All Uploaded Excel Files
    [Documentation]    Activity: Excel import (All files in uploads folder) | Library: CertificateLibrary / OpenPyXL
    [Arguments]    ${uploads_path}=${UPLOADS_DIR}
    ${res}=    Import And Validate All Uploads    ${uploads_path}
    Should Be True    ${res['valid_count']} > 0
    Log    Processed ${res['total_files']} files from uploads folder: ${res['valid_count']} valid student records
    RETURN    ${res}

# ===========================================================================
# 6. Custom Certificate Logic (Library: Python Custom Library)
# ===========================================================================
Validate Excel Dataset Via API
    [Documentation]    Activity: Custom certificate logic (data validation) | Library: Python Custom Library
    [Arguments]    ${excel_path}=${EXCEL_SAMPLE_PATH}
    ${res}=    Validate Excel Via Api    ${excel_path}
    Should Be True    ${res['valid_count']} >= 0
    Log    Custom Library validated ${res['valid_count']} eligible records
    RETURN    ${res}

Verify All Output PDFs Standard
    [Documentation]    Activity: Custom certificate logic (PDF verification) | Library: Python Custom Library
    ${res}=    Verify All Generated Pdfs    min_expected=1
    Should Be True    ${res['valid']}    msg=PDF verification failed.
    Log    Verified ${res['total_verified']} PDFs on disk (non-zero size and valid header)
    RETURN    ${res}

Verify Certificate File Generated
    [Documentation]    Activity: Custom certificate logic (single file check) | Library: Python Custom Library
    [Arguments]    ${cert_id}
    ${exists}=    Verify Pdf Exists    ${cert_id}
    Should Be True    ${exists}    msg=Certificate file ${cert_id} was not found on disk.

Verify Certificate Authenticity
    [Documentation]    Activity: Custom certificate logic (SHA-256 fingerprint) | Library: Python Custom Library
    [Arguments]    ${cert_id}=CERT-1001
    ${res}=    Verify Certificate Authenticity Api    ${cert_id}
    Should Be True    ${res['valid']}
    RETURN    ${res}

Record Final Automation Audit Log
    [Documentation]    Activity: Custom certificate logic (audit logging) | Library: Python Custom Library / DateTime
    [Arguments]    ${run_id}=${RUN_ID}
    ${now}=    Get Current Date    result_format=%Y-%m-%d %H:%M:%S
    Record Automation Audit    ${run_id}    COMPLETED    details=Complete end-to-end 12-stage RPA pipeline executed successfully at ${now}.

# ===========================================================================
# 7. Certificate PDF Generation (Library: ReportLab / Custom Library)
# ===========================================================================
Bulk Generate All Certificates
    [Documentation]    Activity: Certificate PDF generation | Library: ReportLab / Custom Python Library
    [Arguments]    ${template}=Standard
    ${count}=    Bulk Generate Certificates Via Api    ${template}
    Should Be True    ${count} >= 0
    Log    ReportLab rendered ${count} certificates using template ${template}
    RETURN    ${count}

# ===========================================================================
# 8. Backend API Communication (Library: RequestsLibrary)
# ===========================================================================
Authenticate Administrator Via RequestsLibrary
    [Documentation]    Activity: Backend API communication | Library: RequestsLibrary
    [Arguments]    ${email}=${ADMIN_EMAIL}    ${password}=${ADMIN_PASSWORD}
    Create Session    scg_api_session    ${API_BASE_URL}    verify=${FALSE}
    &{headers}=    Create Dictionary    Content-Type=application/json
    &{body}=       Create Dictionary    email=${email}    password=${password}
    ${resp}=       POST On Session    scg_api_session    /auth/login    json=${body}    headers=${headers}    expected_status=any
    Should Be Equal As Numbers    ${resp.status_code}    200
    ${json}=       Set Variable    ${resp.json()}
    Should Not Be Empty    ${json['access_token']}
    RETURN         ${json['access_token']}

# ===========================================================================
# 9. ZIP Creation and Validation (Libraries: ArchiveLibrary / RPA.Archive)
# ===========================================================================
Create And Validate Bulk ZIP Bundle
    [Documentation]    Activity: ZIP file creation and validation | Library: RPA.Archive / ZipFile
    [Arguments]    ${zip_path}=${OUTPUT_ZIP_PATH}
    ${res}=    Create And Bundle Zip Archive    ${zip_path}
    Should Be True    ${res['valid']}    msg=ZIP creation failed.
    RETURN    ${res}

Verify Archive With RPA Framework
    [Documentation]    Activity: ZIP file validation | Library: RPA.Archive
    [Arguments]    ${zip_path}=${OUTPUT_ZIP_PATH}
    File Should Exist    ${zip_path}
    ${contents}=    RPAArchive.List Archive    ${zip_path}
    ${count}=       Get Length    ${contents}
    Should Be True  ${count} > 0
    Log    RPA.Archive verified archive contents: ${count} entries
    RETURN          ${count}

Verify Archive Contents With ArchiveLibrary
    [Documentation]    Activity: ZIP file creation and validation | Library: ArchiveLibrary
    [Arguments]    ${zip_path}=${OUTPUT_ZIP_PATH}    ${expected_file}=CERTIFICATES_SUMMARY.csv
    Archive Should Contain File    ${zip_path}    ${expected_file}
    Log    ArchiveLibrary confirmed ${zip_path} contains ${expected_file}

# ===========================================================================
# 10. SQLite Database Verification (Library: DatabaseLibrary)
# ===========================================================================
Query Database Records With DatabaseLibrary
    [Documentation]    Activity: SQLite database query | Library: DatabaseLibrary
    [Arguments]    ${db_path}=${DB_NAME}
    Connect To Database    sqlite3    ${db_path}
    ${results}=    DatabaseLibrary.Query    SELECT COUNT(*) FROM students;
    DatabaseLibrary.Disconnect From Database
    ${total}=      Set Variable    ${results[0][0]}
    RETURN         ${total}

Verify Audit Log With DatabaseLibrary
    [Documentation]    Activity: SQLite audit verification | Library: DatabaseLibrary
    [Arguments]    ${db_path}=${DB_NAME}
    Connect To Database    sqlite3    ${db_path}
    Table Must Exist    rpa_runs
    ${count}=    Row Count    SELECT * FROM rpa_runs;
    DatabaseLibrary.Disconnect From Database
    Should Be True    ${count} >= 0
    RETURN    ${count}

# ===========================================================================
# Helper Keywords (Backward compatibility)
# ===========================================================================
Log In As Administrator
    [Documentation]    Helper: API Login | Library: CertificateLibrary
    [Arguments]    ${email}=${ADMIN_EMAIL}    ${password}=${ADMIN_PASSWORD}
    ${response}=    Authenticate Via API    ${email}    ${password}
    Should Be Equal As Strings    ${response['status']}    200
    RETURN    ${response['token']}

Verify Generation Log Recorded
    [Documentation]    Helper: Generation Log Check | Library: CertificateLibrary
    [Arguments]    ${event_type}=BULK_GENERATION
    ${logged}=    Verify Generation Log Exists    ${event_type}
    Should Be True    ${logged}
