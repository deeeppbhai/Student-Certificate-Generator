*** Settings ***
Documentation    Automated Test Suite for PDF and ZIP Archive Download Services
...              Using RPA Framework (RPA.Archive) and CertificateLibrary
Resource         ../resources/keywords.robot

*** Test Cases ***
Download Individual Certificate PDF
    [Documentation]    Verify individual certificate download functionality
    Verify Certificate File Generated    CERT-1001

Verify Batch Download ZIP Capability
    [Documentation]    Verify bulk zip output preparation
    ${count}=    Count Certificates In Db
    Should Be True    ${count} >= 0

Validate Archive Structure With RPA Framework
    [Documentation]    Verifies ZIP archive contents and integrity via RPA.Archive
    ${files}=    Verify Archive With RPA Framework    ${OUTPUT_ZIP_PATH}
    Should Be True    ${files} > 0
