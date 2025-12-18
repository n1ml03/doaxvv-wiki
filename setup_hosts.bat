@echo off
title Configure Hosts File
net session >nul 2>&1 || powershell -Command "Start-Process '%~f0' -Verb RunAs" && exit /b

set "TARGET_IP="
set "DOMAIN_NAME="
set "HOSTS_FILE=%windir%\System32\drivers\etc\hosts"

findstr /C:"%DOMAIN_NAME%" "%HOSTS_FILE%" >nul && (
    echo [OK] Domain already configured.
) || (
    echo [PROCESSING] Updating hosts file...
    >>"%HOSTS_FILE%" echo %TARGET_IP% %DOMAIN_NAME%
    ipconfig /flushdns >nul
    echo [SUCCESS] Configuration complete!
)

echo.
echo System configuration finished.
pause