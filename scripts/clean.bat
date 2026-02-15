@echo off

cd %~dp0..

rem Admin Check
fsutil dirty query %systemdrive% >nul 2>&1
if %errorlevel% neq 0 powershell -Command "Start-Process -Verb RunAs -FilePath '%~f0'" & exit /b

rem Forcefully kills stuck node or esbuild processes to release file locks.
echo Killing stuck processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM esbuild.exe /T 2>nul

rem Wait 2 seconds to ensure file handles are released
timeout /t 2 /nobreak >nul

rem Clean Global/Cache
rmdir /S /Q C:\Users\%USERNAME%\AppData\Roaming\npm 2> nul
mkdir C:\Users\%USERNAME%\AppData\Roaming\npm  2> nul
call npm cache clean --force

rem Delete Folders

rem Create a temporary empty folder
if not exist "%TEMP%\empty_dir_xyz" mkdir "%TEMP%\empty_dir_xyz"

echo Scanning for folders to delete...
for /d /r %%F IN (bin dist node_modules) do (
    if exist "%%F" (
        echo Force cleaning: %%F
        
        rem Use PowerShell to find and delete only the symlinks first.
        rem This ensures they are gone before Robocopy starts its aggressive mirror.
        powershell -NoProfile -Command "Get-ChildItem -LiteralPath '%%F' -Recurse -Attributes ReparsePoint -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force"

        rem Run Robocopy to wipe the deep files
        robocopy "%TEMP%\empty_dir_xyz" "%%F" /MIR /NFL /NDL /NJH /NJS /SL /XJ >nul 2>&1
        
        rem Remove the empty directory
        rmdir /S /Q "%%F" >nul 2>&1
    )
)

rem Remove the temp empty folder
rmdir /S /Q "%TEMP%\empty_dir_xyz" >nul 2>&1

rem Delete Files
for /r %%F IN (package-lock.json) do (
    if exist "%%F" (
        echo Deleting file: %%F
        del /F /Q "%%F"
    )
)

call npm uninstall .

pause
exit /B 0