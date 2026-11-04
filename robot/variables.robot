*** Variables ***
${BASE_URL}             http://localhost:5173
${API_BASE_URL}         http://127.0.0.1:8000/api
${ADMIN_EMAIL}          admin@scg.edu
${ADMIN_PASSWORD}       admin123
${EXCEL_SAMPLE_PATH}    ${CURDIR}/../data/students.xlsx
${UPLOADS_DIR}          ${CURDIR}/../backend/uploads
${OUTPUT_CERT_DIR}      ${CURDIR}/../output/certificates
${OUTPUT_ZIP_PATH}      ${CURDIR}/../output/all_students_certificates.zip
${GENERATED_DIR}        ${CURDIR}/../backend/generated_certificates
${DEFAULT_TEMPLATE}     Standard
${RUN_ID}               RPA-SUITE-RUN
${BROWSER}              chrome
${TIMEOUT}              10s
${DB_MODULE}            sqlite3
${DB_NAME}              ${CURDIR}/../backend/scg_database.db
