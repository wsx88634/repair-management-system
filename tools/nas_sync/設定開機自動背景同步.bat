@echo off
chcp 65001 >nul
echo ========================================================
echo   設定 Windows 開機自動背景同步至 NAS
echo ========================================================
echo.

set TASK_NAME=RepairSystemNasSync
set SCRIPT_PATH=%~dp0sync_to_nas.ps1

schtasks /create /tn "%TASK_NAME%" /tr "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%SCRIPT_PATH%\"" /sc onlogon /f

echo.
if %errorlevel% equ 0 (
    echo [成功] 已成功註冊開機自動同步排程！
    echo 電腦每次開機登入後，將自動在背景靜默同步，不佔用視窗。
    echo.
    echo 正在立即啟動背景同步...
    schtasks /run /tn "%TASK_NAME%"
) else (
    echo [失敗] 請按滑鼠右鍵選擇「以系統管理員身分執行」此批次檔！
)

echo.
pause
