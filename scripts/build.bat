@echo off

cd %~dp0..

call npm run build

pause
exit /B 0