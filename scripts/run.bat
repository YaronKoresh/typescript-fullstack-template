@echo off

cd %~dp0..

call npm run local

pause
exit /B 0