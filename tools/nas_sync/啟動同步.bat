@echo off
chcp 65001 >nul
title 叫修系統 - NAS 自動同步工具
echo ========================================================
echo   叫修系統照片與報價單 NAS 自動同步小工具 (運行中)
echo ========================================================
echo.
echo 目標位置: \\192.168.1.210\engineer\工單照片報價單
echo 檢查頻率: 每 3 分鐘自動檢查一次
echo.
echo 提示: 請保持此視窗開啟，或最小化至工作列即可持續自動同步。
echo (關閉此視窗將停止同步)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync_to_nas.ps1"
pause
