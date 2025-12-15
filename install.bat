@echo off
chcp 65001 >nul 2>&1
title Shine Muscat Expert - Install
echo.
echo ========================================
echo   Shine Muscat Expert - Installation
echo ========================================
echo.
echo Creating desktop shortcut...
echo.

:: Run PowerShell script to create shortcut
powershell -ExecutionPolicy Bypass -File "%~dp0create_shortcut.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation completed successfully!
    echo.
    echo Double-click "Shine Muscat Expert" icon on your desktop to run.
    echo.
) else (
    echo.
    echo Installation failed. Please try again.
    echo.
)

pause
