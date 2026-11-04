*** Settings ***
Documentation    Automated Test Suite for Excel Data Parsing and Import
...              Using RPA Framework (RPA.Excel.Files) and CertificateLibrary
Resource         ../resources/keywords.robot

*** Test Cases ***
Parse And Import Student Excel Dataset
    [Documentation]    Verify system reads students.xlsx and populates database
    ${imported}=    Import Student Dataset    ${EXCEL_SAMPLE_PATH}
    Should Be True    ${imported} > 0

Inspect Excel Worksheets With RPA Framework
    [Documentation]    Uses RPA.Excel.Files to inspect worksheets and row structure
    ${rows}=    Validate Student Spreadsheet With RPA Framework    ${EXCEL_SAMPLE_PATH}
    Should Be True    ${rows} > 0
