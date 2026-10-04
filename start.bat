@echo off
chcp 65001 > nul
title LinkShield Pro - Facebook Anti-Ban URL Shortener
echo ========================================================
echo   🛡️  LinkShield Pro - Facebook Anti-Ban URL Shortener
echo ========================================================
echo.
echo [1/2] সার্ভার চালু হচ্ছে...
cd /d "%~dp0"

echo [2/2] ব্রাউজারে ওয়েবসাইট ওপেন হচ্ছে: http://localhost:4000
timeout /t 2 /nobreak > nul
start "" http://localhost:4000

echo.
echo ড্যাশবোর্ড বন্ধ করতে এই কালো উইন্ডোটি ক্লোজ (X) করুন।
echo.
node server.js
pause
