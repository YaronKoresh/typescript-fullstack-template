@echo off

cd %~dp0..

call npm run fix-deps

pause
exit /B 0