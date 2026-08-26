@echo off
chcp 65001 >nul
echo ========================================================
echo   移除開機自動背景同步排程
echo ========================================================
echo.

set TASK_NAME=RepairSystemNasSync

schtasks /delete /tn "%TASK_NAME%" /f

echo.
if %errorlevel% equ 0 (
    echo [成功] 已成功移除開機自動同步排程。
) else (
    echo [提示] 尚未建立過排程，或請使用系統管理員身分執行。
)

echo.
pause
