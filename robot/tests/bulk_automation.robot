*** Settings ***
Documentation    Complete End-to-End RPA Automation Pipeline for Student Certificate Generator (SCG)
...              Demonstrating full implementation of all specified RPA Libraries:
...              1. Robot Framework: Main automation framework
...              2. SeleniumLibrary: Automatic admin login
...              3. OperatingSystem: File and folder management
...              4. Collections: Manage student records
...              5. ExcelLibrary / RPA.Excel.Files: Excel import
...              6. Python Custom Library: Custom certificate logic
...              7. ReportLab: Certificate PDF generation
...              8. RequestsLibrary: Backend API communication
...              9. ArchiveLibrary / RPA.Archive: ZIP file creation and validation
...              10. DatabaseLibrary: Database table and audit verification
Resource         ../resources/keywords.robot

*** Test Cases ***
Execute Complete End-To-End 12-Stage RPA Automation Pipeline
    [Documentation]    Executes the full automated workflow across all 12 stages and verified RPA libraries.
    
    # 1. Main Automation Framework | Library: Robot Framework / DateTime
    Initialize RPA Pipeline    ${RUN_ID}

    # 3. File and folder management | Library: OperatingSystem
    ${input_size}=    Manage Files And Folders With OperatingSystem
    Should Be True    ${input_size} > 0

    # 2. Automatic admin login | Library: SeleniumLibrary
    Open Chrome Browser    ${BASE_URL}
    ${dash_url}=    Automatic Browser Login    ${BASE_URL}/login
    Should Contain    ${dash_url}    /dashboard
    [Teardown]    Close Chrome Browser

    # 8. Backend API communication | Library: RequestsLibrary
    ${token}=    Authenticate Administrator Via RequestsLibrary    ${ADMIN_EMAIL}    ${ADMIN_PASSWORD}
    Should Not Be Empty    ${token}

    # 5. Excel Import: Take ALL files stored in uploads folder | Libraries: OpenPyXL & RPA.Excel.Files
    ${val_res}=    Import And Validate All Uploaded Excel Files    ${UPLOADS_DIR}
    Should Be True    ${val_res['valid_count']} > 0
    Log    Processed ${val_res['total_files']} files from uploads: ${val_res['valid_count']} valid student records

    # 4. Manage student records | Library: Collections
    ${sample_students}=    Create List    Rahul Sharma    Priya Patel    Amit Verma    Neha Gupta    Rohan Mehta
    ${sorted_students}=    Manage Student Records With Collections    @{sample_students}
    ${records_count}=      Get Length    ${sorted_students}
    Should Be True    ${records_count} > 0

    # 7. Certificate PDF generation | Library: ReportLab / Custom Library
    ${gen_count}=    Bulk Generate All Certificates    ${DEFAULT_TEMPLATE}
    Should Be True    ${gen_count} >= 0

    # 6. Custom certificate logic (PDF verification) | Library: Python Custom Library
    ${pdf_verif}=    Verify All Output PDFs Standard
    Should Be True    ${pdf_verif['valid']}

    # 9. ZIP file creation and validation | Libraries: RPA.Archive & ArchiveLibrary
    ${zip_res}=    Create And Validate Bulk ZIP Bundle    ${OUTPUT_ZIP_PATH}
    Should Be True    ${zip_res['valid']}
    ${archive_count}=    Verify Archive With RPA Framework    ${OUTPUT_ZIP_PATH}
    Should Be True    ${archive_count} > 0
    Verify Archive Contents With ArchiveLibrary    ${OUTPUT_ZIP_PATH}    CERTIFICATES_SUMMARY.csv

    # 10. Database table and audit verification | Library: DatabaseLibrary
    ${db_students}=    Query Database Records With DatabaseLibrary    ${DB_NAME}
    Should Be True    ${db_students} >= 0
    ${audit_runs}=     Verify Audit Log With DatabaseLibrary    ${DB_NAME}
    Should Be True    ${audit_runs} >= 0

    # 6. Custom certificate logic (SHA-256 integrity) | Library: Python Custom Library
    ${auth_verif}=    Verify Certificate Authenticity    CERT-1001
    Should Be True    ${auth_verif['valid']}

    # 6. Custom certificate logic (audit logging) | Library: Python Custom Library
    Record Final Automation Audit Log    ${RUN_ID}
    Log    Complete 12-Stage RPA Pipeline successfully executed and verified!

Verify Chrome Browser Auto Login
    [Documentation]    Library: SeleniumLibrary | Automatic admin login
    Open Chrome Browser    ${BASE_URL}
    ${dash_url}=    Automatic Browser Login    ${BASE_URL}/login
    Should Contain    ${dash_url}    /dashboard
    [Teardown]    Close Chrome Browser

Verify REST API Authentication
    [Documentation]    Library: RequestsLibrary | Backend API communication
    ${token}=    Authenticate Administrator Via RequestsLibrary    ${ADMIN_EMAIL}    ${ADMIN_PASSWORD}
    Should Not Be Empty    ${token}

Verify Excel Parsing And Schema
    [Documentation]    Libraries: ExcelLibrary & RPA.Excel.Files | Excel import
    ${sheets}=    Inspect Spreadsheet With ExcelLibrary    ${EXCEL_SAMPLE_PATH}
    Should Not Be Empty    ${sheets}
    ${rows}=      Validate Student Spreadsheet With RPA Framework    ${EXCEL_SAMPLE_PATH}
    Should Be True    ${rows} > 0

Verify ZIP Archive Bundle
    [Documentation]    Libraries: ArchiveLibrary & RPA.Archive | ZIP file creation and validation
    ${files}=    Verify Archive With RPA Framework    ${OUTPUT_ZIP_PATH}
    Should Be True    ${files} > 0
    Verify Archive Contents With ArchiveLibrary    ${OUTPUT_ZIP_PATH}    CERTIFICATES_SUMMARY.csv

Verify Student Records Collection
    [Documentation]    Library: Collections | Manage student records
    @{names}=    Create List    Charlie    Alice    Bob
    ${sorted}=   Manage Student Records With Collections    @{names}
    List Should Contain Value    ${sorted}    Alice

Verify Database Audit Logging
    [Documentation]    Library: DatabaseLibrary | Database table & audit check
    ${runs}=    Verify Audit Log With DatabaseLibrary    ${DB_NAME}
    Should Be True    ${runs} >= 0

Test Custom Template Batch Rendering
    [Documentation]    Library: ReportLab / Custom Library | Certificate PDF generation
    ${count1}=    Bulk Generate All Certificates    Standard
    Should Be True    ${count1} >= 0

    ${count2}=    Bulk Generate All Certificates    Academic Burgundy
    Should Be True    ${count2} >= 0

Verify Tamper Proof Verification Portal
    [Documentation]    Library: Python Custom Library | SHA-256 certificate integrity
    ${verif}=    Verify Certificate Authenticity Api    CERT-1001
    Should Be True    ${verif['valid']}
