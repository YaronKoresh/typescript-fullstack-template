@echo off
cd %~dp0..
setlocal EnableDelayedExpansion

for /f "delims=" %%I in ('call git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"

echo Current branch is: !CURRENT_BRANCH!
set "TARGET_BRANCH=!CURRENT_BRANCH!"
set /p "TARGET_BRANCH=Which branch do you want to push to? [Press Enter for '!CURRENT_BRANCH!']: "

call git rev-parse --verify --quiet refs/heads/!TARGET_BRANCH! >nul 2>&1
if errorlevel 1 (
    echo.
    echo The branch '!TARGET_BRANCH!' does not exist locally.
    set /p "CREATE_BRANCH=Would you like me to create and switch to it now? (Y/N): "
    if /I "!CREATE_BRANCH!"=="Y" (
        call git checkout -b "!TARGET_BRANCH!"
    ) else (
        echo Branch creation cancelled. Exiting...
        pause
        exit /B 1
    )
) else (
    if not "!TARGET_BRANCH!"=="!CURRENT_BRANCH!" (
        call git checkout "!TARGET_BRANCH!"
    )
)

echo.
set "FORCE_FLAG="
set /p "FORCE_PUSH=Do you want to FORCE push? (Y/N): "
if /I "!FORCE_PUSH!"=="Y" (
    set "FORCE_FLAG=--force"
    echo Warning: Force push enabled.
)

echo.
set "MSG_FILE=%TEMP%\git_msg_%RANDOM%.txt"
echo Enter message (Type EOF on a new line to finish):

:InputLoop
set "Line="
set /p "Line="
if "!Line!"=="EOF" goto DoCommit
if not defined Line (
    echo. >> "%MSG_FILE%"
) else (
    echo !Line! >> "%MSG_FILE%"
)
goto InputLoop

:DoCommit
echo.
call git add -A
call git commit -F "%MSG_FILE%" --no-verify

if not defined FORCE_FLAG (
    echo.
    echo Pulling latest changes from origin...
    call git pull origin "!TARGET_BRANCH!" --no-rebase
    if errorlevel 1 (
        :ConflictLoop
        echo.
        echo CONFLICTS DETECTED. Please resolve conflicts manually.
        echo Check the files, fix the conflicts, and save them.
        echo.
        pause
        set "RESOLVED="
        set /p "RESOLVED=Have you resolved all conflicts? (Y/N): "
        if /I not "!RESOLVED!"=="Y" goto ConflictLoop
        call git add -A
        call git commit --no-edit
    )
)

echo.
echo Pushing to origin !TARGET_BRANCH!...
call git push origin "!TARGET_BRANCH!" !FORCE_FLAG! --no-verify

if exist "%MSG_FILE%" del "%MSG_FILE%"

echo.
pause
exit /B 0