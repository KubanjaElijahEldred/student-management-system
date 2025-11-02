@echo off
echo ========================================
echo    RESTARTING STUDENT MANAGEMENT SERVER
echo ========================================
echo.
cd backend
echo Starting server...
echo.
echo Server will run on: http://localhost:8080
echo.
echo Press Ctrl+C to stop server
echo ========================================
echo.
node server.js
