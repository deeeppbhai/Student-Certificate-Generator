*** Settings ***
Documentation    Automated Test Suite for Administrator Login & Authentication
...              Using RequestsLibrary, SeleniumLibrary, and Custom CertificateLibrary
Resource         ../resources/keywords.robot

*** Test Cases ***
Successful Administrator Login
    [Documentation]    Verify admin can log in with default credentials via CertificateLibrary
    ${token}=    Log In As Administrator    ${ADMIN_EMAIL}    ${ADMIN_PASSWORD}
    Should Not Be Empty    ${token}

Verify RequestsLibrary Session Login
    [Documentation]    Verify admin login session using RequestsLibrary
    ${token}=    Authenticate Administrator Via RequestsLibrary    ${ADMIN_EMAIL}    ${ADMIN_PASSWORD}
    Should Not Be Empty    ${token}

Verify UI Portal Title With SeleniumLibrary
    [Documentation]    Verify React Web Portal is rendered and accessible via headless browser
    Open Chrome Browser    ${BASE_URL}
    ${dash_url}=    Automatic Browser Login    ${BASE_URL}/login
    Should Contain    ${dash_url}    /dashboard
    [Teardown]    Close Chrome Browser
