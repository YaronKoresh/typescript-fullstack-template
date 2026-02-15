@echo off

cd %~dp0..

call npm run fix-code

pause
exit /B 0