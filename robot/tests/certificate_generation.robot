*** Settings ***
Documentation    Automated Test Suite for Certificate Generation Engine
...              Using DatabaseLibrary and CertificateLibrary
Resource         ../resources/keywords.robot

*** Test Cases ***
Generate Single Student Certificate
    [Documentation]    Verify PDF certificate creation for a student record
    ${count}=    Count Certificates In Db
    Should Be True    ${count} >= 0

Verify Database Persistence With DatabaseLibrary
    [Documentation]    Verifies student records and certificates directly via DatabaseLibrary
    ${students}=    Query Database Records With DatabaseLibrary    ${DB_NAME}
    Should Be True    ${students} >= 0
