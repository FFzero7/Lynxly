@echo off
cd /d "%~dp0"
start "Lynxly Server" /min node server.js
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173/?v=193#dashboard"
