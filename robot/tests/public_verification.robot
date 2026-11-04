*** Settings ***
Documentation    Automated Test Suite for Public QR Code & Online Certificate Verification
Resource         ../resources/keywords.robot
Library          ../libraries/certificate_library.py

*** Test Cases ***
Verify Authentic Certificate Via Public API
    [Documentation]    Verify valid certificate CERT-1001 returns valid status and SHA-256 fingerprint
    ${res}=    Verify Certificate Authenticity Api    CERT-1001
    Should Be True    ${res['valid']}
    Should Not Be Empty    ${res['student_name']}
    Should Not Be Empty    ${res['fingerprint']}

Verify Invalid Certificate Rejection
    [Documentation]    Verify non-existent certificate returns invalid status
    ${res}=    Verify Certificate Authenticity Api    CERT-FAKE-99999
    Should Be Equal As Strings    ${res['valid']}    False
