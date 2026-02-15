@echo off

cd %~dp0..

call npm uninstall .

pause
exit /B 0