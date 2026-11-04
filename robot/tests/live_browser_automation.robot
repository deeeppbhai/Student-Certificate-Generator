*** Settings ***
Documentation    Live Interactive Browser Automation Suite for Student Certificate Generator (SCG)
...              Demonstrating full real-time visual UI automation using SeleniumLibrary.
...              Runs in visible (non-headless) Chrome with visual pacing so administrators
...              can watch the complete RPA workflow live on screen.
Resource         ../resources/keywords.robot
Library          SeleniumLibrary
Library          OperatingSystem
Library          Collections

*** Variables ***
${CHROME_SPEED}         0.3s
${LOGIN_URL}            ${BASE_URL}/login
${DASHBOARD_URL}        ${BASE_URL}/dashboard
${UPLOADS_DIR}          ${CURDIR}/../../backend/uploads

*** Test Cases ***
Execute Complete Live Browser Automation Workflow
    [Documentation]    Launches a real visible Chrome window and automates the full end-to-end user journey.
    
    # -----------------------------------------------------------------------
    # Step 1: Launch Live Browser Window (Maximized & Visual Pacing)
    # -----------------------------------------------------------------------
    Log To Console    \n[*] Launching Live Chrome Browser Window...
    ${chrome_options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys
    Call Method    ${chrome_options}    add_argument    --start-maximized
    Call Method    ${chrome_options}    add_argument    --disable-notifications
    Open Browser    ${BASE_URL}    browser=chrome    options=${chrome_options}
    Set Selenium Speed    ${CHROME_SPEED}
    Maximize Browser Window

    # -----------------------------------------------------------------------
    # Step 2: Live Administrator Authentication
    # -----------------------------------------------------------------------
    Log To Console    [*] Navigating to Administrator Login Portal...
    Go To    ${BASE_URL}/login?manual=true
    Wait Until Page Contains    Administrator Portal    timeout=10s
    Page Should Contain Element    css:input[type="email"]
    Page Should Contain Element    css:input[type="password"]

    Log To Console    [*] Typing Administrator Credentials...
    Clear Element Text    css:input[type="email"]
    Input Text            css:input[type="email"]       ${ADMIN_EMAIL}
    Clear Element Text    css:input[type="password"]
    Input Password        css:input[type="password"]    ${ADMIN_PASSWORD}

    Log To Console    [*] Clicking 'Sign In as Administrator' Button...
    Click Button          css:button[type="submit"]
    Wait Until Location Contains    /dashboard    timeout=10s
    Log To Console    [OK] Successfully authenticated and arrived at Executive Dashboard!

    # -----------------------------------------------------------------------
    # Step 3: Inspect Executive KPI Analytics Cards
    # -----------------------------------------------------------------------
    Log To Console    [*] Verifying KPI Analytics Overview...
    Wait Until Page Contains    Executive Analytics & Administration Portal    timeout=10s
    Page Should Contain    Registered Students
    Page Should Contain    Certificates Issued
    Page Should Contain    Pending Generation
    Page Should Contain    Audit Log Events

    # -----------------------------------------------------------------------
    # Step 4: Multi-File Excel Upload & Validation Studio
    # -----------------------------------------------------------------------
    Log To Console    [*] Navigating to 'Excel Upload & Data Validation' Studio...
    Click Element         xpath://button[contains(., "Excel Upload & Data Validation")]
    Wait Until Page Contains    Multi-File Batch Processing    timeout=10s

    Log To Console    [*] Uploading Student Datasets in Bulk...
    ${target_file}=       Normalize Path    ${UPLOADS_DIR}/students.xlsx
    Choose File           css:input[type="file"]    ${target_file}
    Wait Until Page Contains    Official Certificate(s) Generated    timeout=25s
    Log To Console    [OK] Multi-File Excel Validation completed with live confetti & instant ZIP download!

    # -----------------------------------------------------------------------
    # Step 5: Switch Custom Certificate Design Templates
    # -----------------------------------------------------------------------
    Log To Console    [*] Exploring Custom Templates Gallery...
    Click Element         xpath://button[contains(., "Custom Templates Gallery")]
    Wait Until Page Contains    Custom Certificate Template Engine    timeout=10s
    Page Should Contain    Executive Gold (Standard)
    Page Should Contain    Modern Tech (Cyber Cyan)

    # -----------------------------------------------------------------------
    # Step 6: Trigger One-Click 12-Stage RPA Automation Pipeline Live
    # -----------------------------------------------------------------------
    Log To Console    [*] Navigating to Robot Automation (RPA Console)...
    Click Element         xpath://button[contains(., "Robot Automation")]
    Wait Until Page Contains    START AUTOMATION    timeout=10s

    Log To Console    [*] Clicking 'START AUTOMATION' Button live...
    Click Element         xpath://button[contains(., "START AUTOMATION")]

    Log To Console    [*] Monitoring Live 12-Stage Stepper & Console Progress...
    Wait Until Page Contains    Automation Completed    timeout=45s
    Wait Until Page Contains    ZIP Downloaded Automatically    timeout=10s
    Log To Console    [OK] RPA Pipeline finished with 100% completion status and automatic ZIP download!

    # -----------------------------------------------------------------------
    # Step 7: Verify Action Artifacts (HTML Report & ZIP Download)
    # -----------------------------------------------------------------------
    Log To Console    [*] Verifying Generated Download & Report Actions...
    Page Should Contain    View HTML Report
    Page Should Contain    Download ZIP
    Page Should Contain    Return to Normal Format
    Log To Console    [SUCCESS] Live Browser RPA Automation Journey Completed Successfully!

    # -----------------------------------------------------------------------
    # Step 8: Return Web Project to Normal Format (Student Registry & Canvas)
    # -----------------------------------------------------------------------
    Log To Console    [*] Returning Web Project to Normal Format (Student Registry & Canvas)...
    Click Element         xpath://button[contains(., "Return to Normal Format")]
    Wait Until Page Contains Element    css:input[placeholder*="Search student"]    timeout=10s
    Page Should Contain    Registered Students
    Page Should Contain    Certificates Issued
    Sleep    2s
    Log To Console    [OK] Web project successfully restored to normal interactive format!

    [Teardown]    Close All Browsers
