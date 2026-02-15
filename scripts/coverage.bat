@echo off

cd %~dp0..

call npm run coverage

pause
exit /B 0