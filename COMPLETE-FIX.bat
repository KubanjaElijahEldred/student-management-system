@echo off
echo ╔════════════════════════════════════════════════════════╗
echo ║     COMPLETE FIX - Database Cleanup and Restore        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

cd backend

echo [1/3] Cleaning orphaned data...
echo.
node clean-database.js
echo.

echo [2/3] Adding sample students back...
echo.
node seed-sample-data.js
echo.

echo [3/3] Done!
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                   NEXT STEPS                           ║
echo ╠════════════════════════════════════════════════════════╣
echo ║  1. Go to browser                                      ║
echo ║  2. Press Ctrl + Shift + R (hard refresh)              ║
echo ║  3. Go to Students page                                ║
echo ║  4. You should see 5 students with registration numbers║
echo ║  5. Try payments with "Exam Fee" type                  ║
echo ╚════════════════════════════════════════════════════════╝
echo.

pause
