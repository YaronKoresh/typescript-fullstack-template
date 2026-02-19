@echo off
cd /d "%~dp0"

:FindGitRoot
if exist ".git" goto :FoundGitRoot
if "%CD%\"=="%~d0\" (
    echo Error: Could not find a .git folder in this directory tree.
    pause
    exit /b
)

cd ..
goto FindGitRoot

:FoundGitRoot
setlocal EnableDelayedExpansion
title Git Manager
color 0B

:MainMenu
cls
echo.
echo  ===========================================================
echo  ^|                                                         ^|
echo  ^|              G I T   M A N A G E R                      ^|
echo  ^|                                                         ^|
echo  ===========================================================
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
if defined CURRENT_BRANCH (
    echo     Current Branch: !CURRENT_BRANCH!
) else (
    echo     Not inside a Git repository
)
echo.
echo  -----------------------------------------------------------
echo  ^|  WHAT DO YOU WANT TO DO?                                ^|
echo  -----------------------------------------------------------
echo.
echo     [1]  Quick Actions (common tasks, simplified)
echo     [2]  First-Time Setup
echo     [3]  Branches (work on separate copies)
echo     [4]  Saving Changes (snapshots of your work)
echo     [5]  Upload and Download (sync with the cloud)
echo     [6]  View History and Details
echo     [7]  Combine Work from Different Branches
echo     [8]  Undo Mistakes
echo     [9]  Versions and Releases (tags)
echo     [10] Subprojects (submodules)
echo     [11] Power-User Tools
echo.
echo     [0]  Exit
echo.
echo  -----------------------------------------------------------
set /p "CAT=  Select a category [0-11]: "

if "!CAT!"=="1" goto CatQuick
if "!CAT!"=="2" goto CatStart
if "!CAT!"=="3" goto CatBranch
if "!CAT!"=="4" goto CatChanges
if "!CAT!"=="5" goto CatRemote
if "!CAT!"=="6" goto CatHistory
if "!CAT!"=="7" goto CatMerge
if "!CAT!"=="8" goto CatUndo
if "!CAT!"=="9" goto CatTags
if "!CAT!"=="10" goto CatSubmodules
if "!CAT!"=="11" goto CatAdvanced
if "!CAT!"=="0" goto ExitScript
echo.
echo  Invalid choice. Press any key to try again...
pause >nul
goto MainMenu

:CatQuick
cls
echo.
echo  ===========================================================
echo  ^|  QUICK ACTIONS                                          ^|
echo  ===========================================================
echo.
echo  These combine multiple steps into one easy action.
echo.
echo     [1]  Save my work and upload it to the cloud
echo     [2]  Get the latest changes from the team
echo     [3]  Start working on something new (new branch)
echo     [4]  I'm done with this feature (merge and clean up)
echo     [5]  See what I've changed
echo     [6]  Undo everything since my last save
echo     [7]  Set up my identity (name and email)
echo     [8]  Save my work locally (without uploading)
echo     [9]  Create a version/release and upload it
echo     [10] Download a project for the first time
echo     [11] I committed something I shouldn't have
echo     [12] Split my big change into smaller saves
echo     [13] Create a pull request
echo     [14] Download and test a pull request
echo.
echo     [0]  Back to main menu
echo.
set /p "QCH=  Select an option [0-14]: "

if "!QCH!"=="1" goto DoQuickSaveUpload
if "!QCH!"=="2" goto DoQuickGetLatest
if "!QCH!"=="3" goto DoQuickNewFeature
if "!QCH!"=="4" goto DoQuickFinishFeature
if "!QCH!"=="5" goto DoQuickWhatChanged
if "!QCH!"=="6" goto DoQuickUndoAll
if "!QCH!"=="7" goto DoQuickIdentity
if "!QCH!"=="8" goto DoQuickSaveLocal
if "!QCH!"=="9" goto DoQuickRelease
if "!QCH!"=="10" goto DoQuickDownload
if "!QCH!"=="11" goto DoQuickUndoCommit
if "!QCH!"=="12" goto DoQuickSplitCommit
if "!QCH!"=="13" goto DoQuickCreatePR
if "!QCH!"=="14" goto DoQuickTestPR
if "!QCH!"=="0" goto MainMenu
goto CatQuick

:DoQuickSaveUpload
cls
echo.
echo  ===========================================================
echo  ^|  SAVE MY WORK AND UPLOAD IT                             ^|
echo  ===========================================================
echo.
echo  This will: mark all changes, create a save point, get the
echo  latest updates from the cloud, and upload your work.
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  You are on branch: !CURRENT_BRANCH!
echo.
echo  Your current changes:
call git status --short
echo.
set /p "QSAVE_MSG=  Describe what you changed: "
echo.
echo  [Step 1/4] Marking all changes...
call git add -A
echo  [Step 2/4] Creating a save point...
call git commit -m "!QSAVE_MSG!"
echo  [Step 3/4] Getting latest updates from the cloud...
call git pull origin "!CURRENT_BRANCH!" --no-rebase 2>nul
if errorlevel 1 (
    call :ResolveConflicts
)
echo  [Step 4/4] Uploading your work...
call git push origin "!CURRENT_BRANCH!" -u
echo.
echo  Done! Your work is saved and uploaded.
echo.
pause
goto CatQuick

:DoQuickGetLatest
cls
echo.
echo  ===========================================================
echo  ^|  GET THE LATEST CHANGES FROM THE TEAM                   ^|
echo  ===========================================================
echo.
echo  This will check for updates and download them.
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  You are on branch: !CURRENT_BRANCH!
echo.
echo  [Step 1/2] Checking for updates...
call git fetch --all
echo  [Step 2/2] Downloading updates...
call git pull origin "!CURRENT_BRANCH!" --no-rebase
if errorlevel 1 (
    call :ResolveConflicts
)
echo.
echo  Done! You have the latest version.
echo.
pause
goto CatQuick

:DoQuickNewFeature
cls
echo.
echo  ===========================================================
echo  ^|  START WORKING ON SOMETHING NEW                         ^|
echo  ===========================================================
echo.
echo  This will create a separate copy of your project where you
echo  can work on a new feature without affecting the main code.
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  You are currently on: !CURRENT_BRANCH!
echo.
set /p "QFEAT_NAME=  Give your new feature a short name (no spaces): "
echo.
echo  [Step 1/2] Creating new branch '!QFEAT_NAME!'...
call git checkout -b "!QFEAT_NAME!"
echo  [Step 2/2] Publishing the branch to the cloud...
call git push origin "!QFEAT_NAME!" -u
echo.
echo  Done! You are now working on '!QFEAT_NAME!'.
echo  Your main code is untouched. When you're done, use
echo  'I'm done with this feature' from Quick Actions.
echo.
pause
goto CatQuick

:DoQuickFinishFeature
cls
echo.
echo  ===========================================================
echo  ^|  FINISH THIS FEATURE (MERGE AND CLEAN UP)               ^|
echo  ===========================================================
echo.
echo  This will save your work, switch to the main branch, bring
echo  your feature changes in, upload everything, and clean up.
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
set "FEATURE_BRANCH=!CURRENT_BRANCH!"
echo  You are currently on: !FEATURE_BRANCH!
echo.
set "QFIN_TARGET=main"
set /p "QFIN_TARGET=  Which branch should receive your work? (press Enter for 'main'): "
echo.
echo  [Step 1/6] Saving any unsaved changes on '!FEATURE_BRANCH!'...
call git add -A
for /f "delims=" %%S in ('git status --porcelain 2^>nul') do (
    call git commit -m "Final changes on !FEATURE_BRANCH!"
    goto :QFinStep2
)
:QFinStep2
echo  [Step 2/6] Switching to '!QFIN_TARGET!'...
call git checkout "!QFIN_TARGET!"
echo  [Step 3/6] Getting the latest '!QFIN_TARGET!'...
call git pull origin "!QFIN_TARGET!" --no-rebase
echo  [Step 4/6] Bringing in your feature changes...
call git merge --no-ff "!FEATURE_BRANCH!"
if errorlevel 1 (
    call :ResolveConflicts
)
echo  [Step 5/6] Uploading the combined work...
call git push origin "!QFIN_TARGET!"
echo  [Step 6/6] Cleaning up the feature branch...
set /p "QFIN_CLEANUP=  Delete the feature branch '!FEATURE_BRANCH!'? (Y/N): "
if /I "!QFIN_CLEANUP!"=="Y" (
    call git branch -d "!FEATURE_BRANCH!"
    call git push origin --delete "!FEATURE_BRANCH!" 2>nul
    echo  Feature branch deleted.
) else (
    echo  Feature branch kept.
)
echo.
echo  Done! Your feature has been merged into '!QFIN_TARGET!'.
echo.
pause
goto CatQuick

:DoQuickWhatChanged
cls
echo.
echo  ===========================================================
echo  ^|  SEE WHAT I'VE CHANGED                                  ^|
echo  ===========================================================
echo.
echo  Here's a summary of everything you've changed:
echo.
echo  --- FILES WITH CHANGES ---
echo.
call git status --short
echo.
echo  --- DETAILS OF YOUR CHANGES ---
echo.
call git diff --stat
echo.
echo  Tip: Files marked with M are modified, A are new, D are deleted.
echo.
pause
goto CatQuick

:DoQuickUndoAll
cls
echo.
echo  ===========================================================
echo  ^|  UNDO EVERYTHING SINCE MY LAST SAVE                     ^|
echo  ===========================================================
echo.
echo  Current changes that will be erased:
call git status --short
echo.
set /p "QUNDO_CONFIRM=  This CANNOT be undone. Erase all changes? (Y/N): "
if /I "!QUNDO_CONFIRM!"=="Y" (
    call git restore .
    call git clean -fd
    echo.
    echo  Done! Everything is back to how it was at your last save.
) else (
    echo  Cancelled. Nothing was changed.
)
echo.
pause
goto CatQuick

:DoQuickIdentity
cls
echo.
echo  ===========================================================
echo  ^|  SET UP MY IDENTITY                                     ^|
echo  ===========================================================
echo.
echo  Git needs your name and email to label your saves.
echo.
set /p "QID_NAME=  Your name: "
set /p "QID_EMAIL=  Your email: "
echo.
echo  Where should this apply?
echo     [1]  Only this project
echo     [2]  All projects on this computer
echo.
set /p "QID_SCOPE=  Select: "
if "!QID_SCOPE!"=="2" (
    call git config --global user.name "!QID_NAME!"
    call git config --global user.email "!QID_EMAIL!"
    echo  Set globally for all projects.
) else (
    call git config user.name "!QID_NAME!"
    call git config user.email "!QID_EMAIL!"
    echo  Set for this project only.
)
echo.
echo  Done! Your identity is set to: !QID_NAME! ^<!QID_EMAIL!^>
echo.
pause
goto CatQuick

:DoQuickSaveLocal
cls
echo.
echo  ===========================================================
echo  ^|  SAVE MY WORK LOCALLY                                   ^|
echo  ===========================================================
echo.
echo  This will create a save point of your current work on your
echo  computer (without uploading to the cloud).
echo.
echo  Your current changes:
call git status --short
echo.
set /p "QLOCAL_MSG=  Describe what you changed: "
echo.
echo  [Step 1/2] Marking all changes...
call git add -A
echo  [Step 2/2] Creating save point...
call git commit -m "!QLOCAL_MSG!"
echo.
echo  Done! Your work is saved locally. Use 'Save my work and
echo  upload it' when you're ready to upload to the cloud.
echo.
pause
goto CatQuick

:DoQuickRelease
cls
echo.
echo  ===========================================================
echo  ^|  CREATE A VERSION / RELEASE                             ^|
echo  ===========================================================
echo.
echo  This will mark the current state of your project with a
echo  version number and upload it to the cloud.
echo.
set /p "QREL_VER=  Version name (e.g. v1.0.0): "
set /p "QREL_MSG=  Describe this release: "
echo.
echo  [Step 1/2] Creating version tag...
call git tag -a "!QREL_VER!" -m "!QREL_MSG!"
echo  [Step 2/2] Uploading tag to the cloud...
call git push origin "!QREL_VER!"
echo.
echo  Done! Version '!QREL_VER!' is created and uploaded.
echo.
pause
goto CatQuick

:DoQuickDownload
cls
echo.
echo  ===========================================================
echo  ^|  DOWNLOAD A PROJECT FOR THE FIRST TIME                  ^|
echo  ===========================================================
echo.
echo  This will download a complete copy of a project from the cloud.
echo.
set /p "QDLURL=  Paste the project URL: "
set /p "QDLDIR=  Folder name (or press Enter for default): "
if "!QDLDIR!"=="" (
    call git clone "!QDLURL!"
) else (
    call git clone "!QDLURL!" "!QDLDIR!"
)
echo.
echo  Done! The project has been downloaded.
echo.
pause
goto CatQuick

:DoQuickUndoCommit
cls
echo.
echo  ===========================================================
echo  ^|  I COMMITTED SOMETHING I SHOULDN'T HAVE                 ^|
echo  ===========================================================
echo.
echo  This will undo your last save point but keep all your files
echo  as they are, so you can choose what to include next time.
echo.
echo  Your last save point:
call git log -1 --oneline
echo.
echo  What do you want to do?
echo     [1]  Undo the last save (keep my changes, I'll redo it)
echo     [2]  Undo the last save (erase everything from it)
echo     [3]  Remove a specific file from the last save
echo.
set /p "QUC_CH=  Select: "
if "!QUC_CH!"=="1" (
    echo.
    echo  [Step 1/1] Undoing last save point...
    call git reset --soft HEAD~1
    echo.
    echo  Done! Your last save point is undone. Your changes are still
    echo  here and marked for saving. You can now:
    echo  - Remove files you don't want with 'Unmark a file' in
    echo    the Saving Changes menu
    echo  - Create a new save point with a better description
    echo.
    echo  Current marked files:
    call git diff --cached --name-only
)
if "!QUC_CH!"=="2" (
    echo.
    set /p "QUC_CONFIRM=  This will PERMANENTLY erase changes. Continue? (Y/N): "
    if /I "!QUC_CONFIRM!"=="Y" (
        call git reset --hard HEAD~1
        echo.
        echo  Done! The last save point and all its changes are erased.
    ) else (
        echo  Cancelled. Nothing was changed.
    )
)
if "!QUC_CH!"=="3" (
    echo.
    echo  Files in the last save point:
    call git diff --name-only HEAD~1 HEAD
    echo.
    set /p "QUC_FILE=  Enter file path to remove from last save: "
    echo.
    echo  [Step 1/3] Undoing last save point...
    for /f "delims=" %%M in ('git log -1 --format^=%%s') do set "QUC_MSG=%%M"
    call git reset --soft HEAD~1
    echo  [Step 2/3] Unmarking the file...
    call git restore --staged "!QUC_FILE!"
    echo  [Step 3/3] Re-saving without that file...
    call git commit -m "!QUC_MSG!"
    echo.
    echo  Done! '!QUC_FILE!' has been removed from your last save.
    echo  The file is still on your computer, just not in the save point.
)
echo.
pause
goto CatQuick

:DoQuickSplitCommit
cls
echo.
echo  ===========================================================
echo  ^|  SPLIT MY BIG CHANGE INTO SMALLER SAVES                 ^|
echo  ===========================================================
echo.
echo  This will undo your last save point but keep all the changes,
echo  then let you create multiple smaller save points one at a time.
echo.
echo  Your last save point:
call git log -1 --oneline
echo.
echo  Files that were in that save:
call git diff --name-only HEAD~1 HEAD
echo.
set /p "QSPLIT_CONFIRM=  Undo the last save and start splitting? (Y/N): "
if /I not "!QSPLIT_CONFIRM!"=="Y" (
    echo  Cancelled.
    echo.
    pause
    goto CatQuick
)
echo.
echo  [Step 1] Undoing last save point (changes are kept)...
call git reset HEAD~1
echo.
echo  Your files are now all unmarked. You'll create saves one at a time.
echo.
:SplitLoop
echo  ===========================================================
echo  REMAINING UNSAVED FILES:
echo  ===========================================================
call git status --short
echo.
echo  Type a file name to include in the next save, or type one of:
echo    ALL   = include all remaining files in this save
echo    DONE  = finish (leave remaining files unsaved for now)
echo.
:SplitAddFile
set /p "QSPLIT_FILE=  File name (or ALL/DONE): "
if /I "!QSPLIT_FILE!"=="DONE" (
    echo.
    echo  Finished splitting! Some files may still be unsaved.
    echo.
    pause
    goto CatQuick
)
if /I "!QSPLIT_FILE!"=="ALL" (
    call git add -A
) else (
    call git add "!QSPLIT_FILE!"
)
echo.
echo  Currently marked for this save:
call git diff --cached --name-only
echo.
set /p "QSPLIT_MORE=  Add another file to THIS save? (Y/N): "
if /I "!QSPLIT_MORE!"=="Y" goto SplitAddFile
echo.
set /p "QSPLIT_MSG=  Describe this group of changes: "
call git commit -m "!QSPLIT_MSG!"
echo.
echo  Save point created!
echo.
set "HAS_REMAINING=0"
for /f "delims=" %%R in ('git status --porcelain 2^>nul') do (
    set "HAS_REMAINING=1"
    goto SplitCheckDone
)
:SplitCheckDone
if "!HAS_REMAINING!"=="1" (
    echo  There are still unsaved files. Continuing...
    echo.
    goto SplitLoop
)
echo  All files have been saved! You're done.
echo.
pause
goto CatQuick

:DoQuickCreatePR
cls
echo.
echo  ===========================================================
echo  ^|  CREATE A PULL REQUEST                                   ^|
echo  ===========================================================
echo.
echo  A pull request asks the team to review and accept your changes.
echo  This will upload your branch and open the pull request page.
echo  (Works best with GitHub; other platforms may need manual URL.)
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  You are on branch: !CURRENT_BRANCH!
echo.
set /p "QPR_SAVE=  Save and upload your latest changes first? (Y/N): "
if /I "!QPR_SAVE!"=="Y" (
    echo.
    set /p "QPR_MSG=  Describe what you changed: "
    echo.
    echo  [Step 1/3] Marking all changes...
    call git add -A
    echo  [Step 2/3] Creating save point...
    call git commit -m "!QPR_MSG!"
    echo  [Step 3/3] Uploading to the cloud...
    call git push origin "!CURRENT_BRANCH!" -u
) else (
    echo.
    echo  Uploading branch to the cloud...
    call git push origin "!CURRENT_BRANCH!" -u
)
echo.
for /f "delims=" %%U in ('git remote get-url origin 2^>nul') do set "QPR_REMOTE_URL=%%U"
set "QPR_REMOTE_URL=!QPR_REMOTE_URL:.git=!"
set "QPR_REMOTE_URL=!QPR_REMOTE_URL:git@github.com:=https://github.com/!"
set "QPR_REMOTE_URL=!QPR_REMOTE_URL:git@gitlab.com:=https://gitlab.com/!"
set "QPR_REMOTE_URL=!QPR_REMOTE_URL:git@bitbucket.org:=https://bitbucket.org/!"
set "QPR_URL=!QPR_REMOTE_URL!/compare/!CURRENT_BRANCH!?expand=1"
echo  Opening pull request page in your browser...
start "" "!QPR_URL!"
echo.
echo  Done! Your browser should open the pull request page.
echo  If it didn't open, go to:
echo  !QPR_URL!
echo.
pause
goto CatQuick

:DoQuickTestPR
cls
echo.
echo  ===========================================================
echo  ^|  DOWNLOAD AND TEST A PULL REQUEST                        ^|
echo  ===========================================================
echo.
echo  This will download someone's pull request so you can test it.
echo  (Currently works with GitHub repositories.)
echo.
set /p "QTPR_NUM=  Enter the pull request number: "
echo.
echo  [Step 1/3] Downloading the pull request...
call git fetch origin pull/!QTPR_NUM!/head:pr-!QTPR_NUM!
if errorlevel 1 (
    echo.
    echo  Could not download PR #!QTPR_NUM!. Make sure the number is correct
    echo  and your project is hosted on GitHub.
    echo.
    pause
    goto CatQuick
)
echo  [Step 2/3] Switching to the pull request branch...
call git checkout pr-!QTPR_NUM!
echo  [Step 3/3] Done!
echo.
echo  You are now on a local copy of pull request #!QTPR_NUM!.
echo  Test the changes, then when you're done:
echo  - Switch back to your branch using the Branches menu
echo  - The 'pr-!QTPR_NUM!' branch can be deleted when you're done
echo.
pause
goto CatQuick

:CatStart
cls
echo.
echo  ===========================================================
echo  ^|  FIRST-TIME SETUP                                       ^|
echo  ===========================================================
echo.
echo     [1]  Start a new project from scratch
echo     [2]  Download an existing project
echo     [3]  Show what's going on (status)
echo     [4]  Set my name
echo     [5]  Set my email
echo     [6]  Show Git version
echo     [7]  View this project's settings
echo     [8]  View computer-wide settings
echo     [9]  Change a computer-wide setting
echo     [10] Show project overview
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-10]: "

if "!CH!"=="1" goto DoInit
if "!CH!"=="2" goto DoClone
if "!CH!"=="3" goto DoStatus
if "!CH!"=="4" goto DoConfigName
if "!CH!"=="5" goto DoConfigEmail
if "!CH!"=="6" goto DoGitVersion
if "!CH!"=="7" goto DoConfigLocal
if "!CH!"=="8" goto DoConfigGlobal
if "!CH!"=="9" goto DoConfigGlobalSet
if "!CH!"=="10" goto DoRepoInfo
if "!CH!"=="0" goto MainMenu
goto CatStart

:DoInit
cls
echo.
echo  --- Initialize New Repository ---
echo.
call git init
echo.
pause
goto CatStart

:DoClone
cls
echo.
echo  --- Clone a Repository ---
echo.
set /p "CLONE_URL=  Enter the repository URL: "
set /p "CLONE_DIR=  Enter destination folder (or press Enter for default): "
if "!CLONE_DIR!"=="" (
    call git clone "!CLONE_URL!"
) else (
    call git clone "!CLONE_URL!" "!CLONE_DIR!"
)
echo.
pause
goto CatStart

:DoStatus
cls
echo.
echo  --- Repository Status ---
echo.
call git status
echo.
pause
goto CatStart

:DoConfigName
cls
echo.
echo  --- Configure User Name ---
echo.
set /p "UNAME=  Enter your name: "
call git config user.name "!UNAME!"
echo.
echo  Name set to: !UNAME!
echo.
pause
goto CatStart

:DoConfigEmail
cls
echo.
echo  --- Configure User Email ---
echo.
set /p "UEMAIL=  Enter your email: "
call git config user.email "!UEMAIL!"
echo.
echo  Email set to: !UEMAIL!
echo.
pause
goto CatStart

:DoGitVersion
cls
echo.
echo  --- Git Version ---
echo.
call git --version
echo.
pause
goto CatStart

:DoConfigLocal
cls
echo.
echo  --- Local Config ---
echo.
call git config --local --list
echo.
pause
goto CatStart

:DoConfigGlobal
cls
echo.
echo  --- Global Config ---
echo.
call git config --global --list
echo.
pause
goto CatStart

:DoConfigGlobalSet
cls
echo.
echo  --- Set Global Config ---
echo.
set /p "GCFG_KEY=  Enter config key (e.g. user.name): "
set /p "GCFG_VAL=  Enter config value: "
call git config --global "!GCFG_KEY!" "!GCFG_VAL!"
echo.
echo  Global config set: !GCFG_KEY! = !GCFG_VAL!
echo.
pause
goto CatStart

:DoRepoInfo
cls
echo.
echo  --- Repository Info ---
echo.
echo  Top-level directory:
call git rev-parse --show-toplevel
echo.
echo  Current branch:
call git rev-parse --abbrev-ref HEAD
echo.
echo  Latest commit:
call git log -1 --oneline
echo.
echo  Remote URLs:
call git remote -v
echo.
echo  Total commits on this branch:
for /f %%C in ('git rev-list --count HEAD 2^>nul') do echo  %%C
echo.
pause
goto CatStart

:CatBranch
cls
echo.
echo  ===========================================================
echo  ^|  BRANCHES (SEPARATE COPIES OF YOUR PROJECT)             ^|
echo  ===========================================================
echo.
echo  A 'branch' is like a parallel copy of your project where
echo  you can work without affecting the main version.
echo.
echo     [1]  Show all branches
echo     [2]  Create a new branch
echo     [3]  Switch to a different branch
echo     [4]  Rename the current branch
echo     [5]  Delete a branch
echo     [6]  Download a branch from the cloud
echo     [7]  Link current branch to its cloud version
echo     [8]  Show branches already merged into this one
echo     [9]  Show branches not yet merged into this one
echo     [10] Delete a branch from the cloud
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-10]: "

if "!CH!"=="1" goto DoBranchList
if "!CH!"=="2" goto DoBranchCreate
if "!CH!"=="3" goto DoBranchSwitch
if "!CH!"=="4" goto DoBranchRename
if "!CH!"=="5" goto DoBranchDelete
if "!CH!"=="6" goto DoBranchTrack
if "!CH!"=="7" goto DoBranchUpstream
if "!CH!"=="8" goto DoBranchMerged
if "!CH!"=="9" goto DoBranchUnmerged
if "!CH!"=="10" goto DoBranchDeleteRemote
if "!CH!"=="0" goto MainMenu
goto CatBranch

:DoBranchList
cls
echo.
echo  --- All Branches ---
echo.
echo  Local branches:
call git branch
echo.
echo  Remote branches:
call git branch -r
echo.
pause
goto CatBranch

:DoBranchCreate
cls
echo.
echo  --- Create a New Branch ---
echo.
set /p "NEW_BR=  Enter new branch name: "
set /p "SWITCH_BR=  Switch to it now? (Y/N): "
if /I "!SWITCH_BR!"=="Y" (
    call git checkout -b "!NEW_BR!"
) else (
    call git branch "!NEW_BR!"
)
echo.
pause
goto CatBranch

:DoBranchSwitch
cls
echo.
echo  --- Switch Branch ---
echo.
echo  Available branches:
call git branch
echo.
set /p "SW_BR=  Enter branch name to switch to: "
call git checkout "!SW_BR!"
echo.
pause
goto CatBranch

:DoBranchRename
cls
echo.
echo  --- Rename Current Branch ---
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  Current branch: !CURRENT_BRANCH!
set /p "REN_BR=  Enter new name: "
call git branch -m "!REN_BR!"
echo.
pause
goto CatBranch

:DoBranchDelete
cls
echo.
echo  --- Delete a Branch ---
echo.
echo  Available branches:
call git branch
echo.
set /p "DEL_BR=  Enter branch name to delete: "
set /p "FORCE_DEL=  Force delete? (Y/N): "
if /I "!FORCE_DEL!"=="Y" (
    call git branch -D "!DEL_BR!"
) else (
    call git branch -d "!DEL_BR!"
)
echo.
pause
goto CatBranch

:DoBranchTrack
cls
echo.
echo  --- Track a Remote Branch ---
echo.
echo  Remote branches:
call git branch -r
echo.
set /p "TRACK_BR=  Enter remote branch (e.g. origin/feature): "
for /f "tokens=2 delims=/" %%A in ("!TRACK_BR!") do set "LOCAL_TR=%%A"
call git checkout --track "!TRACK_BR!"
echo.
pause
goto CatBranch

:DoBranchUpstream
cls
echo.
echo  --- Set Upstream for Current Branch ---
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
set "UPS_BR=origin/!CURRENT_BRANCH!"
set /p "UPS_BR=  Upstream branch (press Enter for '!UPS_BR!'): "
call git branch --set-upstream-to="!UPS_BR!"
echo.
pause
goto CatBranch

:DoBranchMerged
cls
echo.
echo  --- Branches Merged into Current ---
echo.
call git branch --merged
echo.
pause
goto CatBranch

:DoBranchUnmerged
cls
echo.
echo  --- Branches NOT Merged into Current ---
echo.
call git branch --no-merged
echo.
pause
goto CatBranch

:DoBranchDeleteRemote
cls
echo.
echo  --- Delete a Remote Branch ---
echo.
echo  Remote branches:
call git branch -r
echo.
set /p "RDBR_NAME=  Enter branch name to delete from remote: "
set "RDBR_REMOTE=origin"
set /p "RDBR_REMOTE=  Remote name (press Enter for 'origin'): "
set /p "RDBR_CONFIRM=  Delete '!RDBR_NAME!' from '!RDBR_REMOTE!'? (Y/N): "
if /I "!RDBR_CONFIRM!"=="Y" (
    call git push "!RDBR_REMOTE!" --delete "!RDBR_NAME!"
) else (
    echo  Cancelled.
)
echo.
pause
goto CatBranch

:CatChanges
cls
echo.
echo  ===========================================================
echo  ^|  SAVING CHANGES (SNAPSHOTS OF YOUR WORK)                ^|
echo  ===========================================================
echo.
echo  'Staging' = marking files to include in your next save.
echo  'Committing' = creating a save point of your staged files.
echo  'Stashing' = setting aside changes temporarily.
echo.
echo     [1]  Mark all changed files for saving
echo     [2]  Mark a specific file for saving
echo     [3]  Unmark a file (remove from next save)
echo     [4]  Create a save point from marked files
echo     [5]  Mark everything and save at once (quick save)
echo     [6]  Set aside my changes temporarily
echo     [7]  Bring back set-aside changes
echo     [8]  Show list of set-aside changes
echo     [9]  Throw away changes in a specific file
echo     [10] Mark parts of a file (choose line by line)
echo     [11] Preview set-aside changes
echo     [12] Delete a specific set-aside entry
echo     [13] Delete all set-aside entries
echo     [14] Compare changes in a file
echo     [15] Throw away ALL unsaved changes
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-15]: "

if "!CH!"=="1" goto DoStageAll
if "!CH!"=="2" goto DoStageFile
if "!CH!"=="3" goto DoUnstage
if "!CH!"=="4" goto DoCommit
if "!CH!"=="5" goto DoQuickCommit
if "!CH!"=="6" goto DoStash
if "!CH!"=="7" goto DoStashPop
if "!CH!"=="8" goto DoStashList
if "!CH!"=="9" goto DoDiscardFile
if "!CH!"=="10" goto DoStagePatch
if "!CH!"=="11" goto DoStashShow
if "!CH!"=="12" goto DoStashDrop
if "!CH!"=="13" goto DoStashClear
if "!CH!"=="14" goto DoDiffFile
if "!CH!"=="15" goto DoDiscardAll
if "!CH!"=="0" goto MainMenu
goto CatChanges

:DoStageAll
cls
echo.
echo  --- Stage All Changes ---
echo.
call git add -A
echo  All changes have been staged.
echo.
pause
goto CatChanges

:DoStageFile
cls
echo.
echo  --- Stage a Specific File ---
echo.
echo  Modified files:
call git status --short
echo.
set /p "STAGE_F=  Enter file path to stage: "
call git add "!STAGE_F!"
echo.
pause
goto CatChanges

:DoUnstage
cls
echo.
echo  --- Unstage a File ---
echo.
echo  Staged files:
call git diff --cached --name-only
echo.
set /p "UNSTAGE_F=  Enter file path to unstage: "
call git restore --staged "!UNSTAGE_F!"
echo.
pause
goto CatChanges

:DoCommit
cls
echo.
echo  --- Commit Staged Changes ---
echo.
set /p "COMMIT_MSG=  Enter commit message: "
call git commit -m "!COMMIT_MSG!"
echo.
pause
goto CatChanges

:DoQuickCommit
cls
echo.
echo  --- Quick Commit (Stage All + Commit) ---
echo.
set /p "QC_MSG=  Enter commit message: "
call git add -A
call git commit -m "!QC_MSG!"
echo.
pause
goto CatChanges

:DoStash
cls
echo.
echo  --- Stash Changes ---
echo.
set /p "STASH_MSG=  Enter stash description (or press Enter to skip): "
if "!STASH_MSG!"=="" (
    call git stash
) else (
    call git stash push -m "!STASH_MSG!"
)
echo.
pause
goto CatChanges

:DoStashPop
cls
echo.
echo  --- Apply Stashed Changes ---
echo.
echo  Available stashes:
call git stash list
echo.
set /p "STASH_IDX=  Enter stash number (or press Enter for latest): "
if "!STASH_IDX!"=="" (
    call git stash pop
) else (
    call git stash pop stash@{!STASH_IDX!}
)
echo.
pause
goto CatChanges

:DoStashList
cls
echo.
echo  --- Stash List ---
echo.
call git stash list
echo.
pause
goto CatChanges

:DoDiscardFile
cls
echo.
echo  --- Discard Changes in a File ---
echo.
echo  Modified files:
call git status --short
echo.
set /p "DISCARD_F=  Enter file path to discard changes: "
set /p "CONFIRM_DISCARD=  This cannot be undone. Continue? (Y/N): "
if /I "!CONFIRM_DISCARD!"=="Y" (
    call git restore "!DISCARD_F!"
    echo  Changes discarded.
) else (
    echo  Cancelled.
)
echo.
pause
goto CatChanges

:DoStagePatch
cls
echo.
echo  --- Stage with Patch Mode ---
echo.
echo  This lets you choose which parts of each file to stage.
echo.
call git add -p
echo.
pause
goto CatChanges

:DoStashShow
cls
echo.
echo  --- Show Stash Contents ---
echo.
echo  Available stashes:
call git stash list
echo.
set /p "SSHOW_IDX=  Enter stash number (or press Enter for latest): "
if "!SSHOW_IDX!"=="" (
    call git stash show -p
) else (
    call git stash show -p stash@{!SSHOW_IDX!}
)
echo.
pause
goto CatChanges

:DoStashDrop
cls
echo.
echo  --- Drop a Stash ---
echo.
echo  Available stashes:
call git stash list
echo.
set /p "SDROP_IDX=  Enter stash number to drop: "
set /p "SDROP_CONFIRM=  This cannot be undone. Continue? (Y/N): "
if /I "!SDROP_CONFIRM!"=="Y" (
    call git stash drop stash@{!SDROP_IDX!}
) else (
    echo  Cancelled.
)
echo.
pause
goto CatChanges

:DoStashClear
cls
echo.
echo  --- Clear All Stashes ---
echo.
echo  Current stashes:
call git stash list
echo.
set /p "SCLEAR_CONFIRM=  Delete ALL stashes permanently? (Y/N): "
if /I "!SCLEAR_CONFIRM!"=="Y" (
    call git stash clear
    echo  All stashes cleared.
) else (
    echo  Cancelled.
)
echo.
pause
goto CatChanges

:DoDiffFile
cls
echo.
echo  --- Diff a Specific File ---
echo.
echo  Modified files:
call git status --short
echo.
set /p "DIFF_F=  Enter file path: "
echo.
echo     [1]  Unstaged changes
echo     [2]  Staged changes
echo.
set /p "DIFF_FCH=  Select: "
if "!DIFF_FCH!"=="1" call git diff "!DIFF_F!"
if "!DIFF_FCH!"=="2" call git diff --cached "!DIFF_F!"
echo.
pause
goto CatChanges

:DoDiscardAll
cls
echo.
echo  --- Discard ALL Local Changes ---
echo.
echo  Current status:
call git status --short
echo.
set /p "DALL_CONFIRM=  This will discard ALL uncommitted changes. Continue? (Y/N): "
if /I "!DALL_CONFIRM!"=="Y" (
    call git restore .
    echo  All local changes discarded.
) else (
    echo  Cancelled.
)
echo.
pause
goto CatChanges

:CatRemote
cls
echo.
echo  ===========================================================
echo  ^|  UPLOAD AND DOWNLOAD (SYNC WITH THE CLOUD)              ^|
echo  ===========================================================
echo.
echo  'Push' = upload your saves to the cloud.
echo  'Pull' = download other people's saves from the cloud.
echo  'Remote' = the cloud server your project connects to.
echo.
echo     [1]  Upload my saves to the cloud
echo     [2]  Download updates from the cloud
echo     [3]  Check for updates (without downloading)
echo     [4]  Show cloud server addresses
echo     [5]  Connect to a new cloud server
echo     [6]  Disconnect from a cloud server
echo     [7]  Rename a cloud server connection
echo     [8]  Change a cloud server's address
echo     [9]  Clean up deleted cloud branches
echo     [10] Upload all branches to the cloud
echo     [11] Upload all version tags to the cloud
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-11]: "

if "!CH!"=="1" goto DoPush
if "!CH!"=="2" goto DoPull
if "!CH!"=="3" goto DoFetch
if "!CH!"=="4" goto DoRemoteList
if "!CH!"=="5" goto DoRemoteAdd
if "!CH!"=="6" goto DoRemoteRemove
if "!CH!"=="7" goto DoRemoteRename
if "!CH!"=="8" goto DoRemoteSetUrl
if "!CH!"=="9" goto DoRemotePrune
if "!CH!"=="10" goto DoPushAll
if "!CH!"=="11" goto DoPushTags
if "!CH!"=="0" goto MainMenu
goto CatRemote

:DoPush
cls
echo.
echo  --- Push to Remote ---
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  Current branch: !CURRENT_BRANCH!
set "TARGET_BRANCH=!CURRENT_BRANCH!"
set "PUBLISH_FLAG="
set "FORCE_FLAG="
set /p "TARGET_BRANCH=  Branch to push to (press Enter for '!CURRENT_BRANCH!'): "

call git rev-parse --verify --quiet refs/heads/!TARGET_BRANCH! >nul 2>&1
if errorlevel 1 (
    echo.
    echo  Branch '!TARGET_BRANCH!' does not exist locally.
    set /p "CREATE_BRANCH=  Create and switch to it? (Y/N): "
    if /I "!CREATE_BRANCH!"=="Y" (
        call git checkout -b "!TARGET_BRANCH!"
        set /p "DO_PUBLISH=  Publish to remote (set upstream)? (Y/N): "
        if /I "!DO_PUBLISH!"=="Y" set "PUBLISH_FLAG=-u"
    ) else (
        echo  Cancelled.
        pause
        goto CatRemote
    )
) else (
    if not "!TARGET_BRANCH!"=="!CURRENT_BRANCH!" (
        call git checkout "!TARGET_BRANCH!"
    )
)

echo.
set /p "FORCE_PUSH=  Force push? (Y/N): "
if /I "!FORCE_PUSH!"=="Y" (
    set "FORCE_FLAG=--force"
    echo  Warning: Force push enabled.
)

echo.
set /p "WANT_COMMIT=  Stage and commit before pushing? (Y/N): "
if /I "!WANT_COMMIT!"=="Y" (
    set /p "PUSH_MSG=  Enter commit message: "
    call git add -A
    call git commit -m "!PUSH_MSG!"
)

if not defined FORCE_FLAG (
    if not "!PUBLISH_FLAG!"=="-u" (
        echo.
        echo  Pulling latest changes...
        call git pull origin "!TARGET_BRANCH!" --no-rebase
        if errorlevel 1 (
            call :ResolveConflicts
        )
    )
)

echo.
echo  Pushing to origin/!TARGET_BRANCH!...
call git push origin "!TARGET_BRANCH!" !FORCE_FLAG! !PUBLISH_FLAG!
echo.
pause
goto CatRemote

:DoPull
cls
echo.
echo  --- Pull from Remote ---
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
set "PULL_BR=!CURRENT_BRANCH!"
set /p "PULL_BR=  Branch to pull (press Enter for '!CURRENT_BRANCH!'): "
call git pull origin "!PULL_BR!"
echo.
pause
goto CatRemote

:DoFetch
cls
echo.
echo  --- Fetch from Remote ---
echo.
call git fetch --all
echo  All remotes fetched.
echo.
pause
goto CatRemote

:DoRemoteList
cls
echo.
echo  --- Remote URLs ---
echo.
call git remote -v
echo.
pause
goto CatRemote

:DoRemoteAdd
cls
echo.
echo  --- Add a Remote ---
echo.
set /p "REM_NAME=  Remote name (e.g. origin): "
set /p "REM_URL=  Remote URL: "
call git remote add "!REM_NAME!" "!REM_URL!"
echo.
pause
goto CatRemote

:DoRemoteRemove
cls
echo.
echo  --- Remove a Remote ---
echo.
echo  Current remotes:
call git remote -v
echo.
set /p "REM_DEL=  Remote name to remove: "
call git remote remove "!REM_DEL!"
echo.
pause
goto CatRemote

:DoRemoteRename
cls
echo.
echo  --- Rename a Remote ---
echo.
echo  Current remotes:
call git remote -v
echo.
set /p "REM_OLD=  Current remote name: "
set /p "REM_NEW=  New remote name: "
call git remote rename "!REM_OLD!" "!REM_NEW!"
echo.
pause
goto CatRemote

:DoRemoteSetUrl
cls
echo.
echo  --- Set Remote URL ---
echo.
echo  Current remotes:
call git remote -v
echo.
set /p "RURL_NAME=  Remote name: "
set /p "RURL_URL=  New URL: "
call git remote set-url "!RURL_NAME!" "!RURL_URL!"
echo.
echo  URL updated.
echo.
pause
goto CatRemote

:DoRemotePrune
cls
echo.
echo  --- Prune Stale Remote Branches ---
echo.
set "PRUNE_REM=origin"
set /p "PRUNE_REM=  Remote to prune (press Enter for 'origin'): "
call git remote prune "!PRUNE_REM!"
echo.
echo  Stale branches pruned.
echo.
pause
goto CatRemote

:DoPushAll
cls
echo.
echo  --- Push All Branches ---
echo.
set "PALL_REM=origin"
set /p "PALL_REM=  Remote to push to (press Enter for 'origin'): "
call git push "!PALL_REM!" --all
echo.
pause
goto CatRemote

:DoPushTags
cls
echo.
echo  --- Push Tags to Remote ---
echo.
set "PTAG_REM=origin"
set /p "PTAG_REM=  Remote to push to (press Enter for 'origin'): "
call git push "!PTAG_REM!" --tags
echo.
echo  All tags pushed.
echo.
pause
goto CatRemote

:CatHistory
cls
echo.
echo  ===========================================================
echo  ^|  VIEW HISTORY AND DETAILS                               ^|
echo  ===========================================================
echo.
echo     [1]  Show recent save points (detailed)
echo     [2]  Show recent save points (compact list)
echo     [3]  Compare current changes
echo     [4]  Show details of a specific save point
echo     [5]  Search save points by description
echo     [6]  See who last changed each line of a file
echo     [7]  Show history of a specific file
echo     [8]  Show all recent actions (including undone ones)
echo     [9]  Show who contributed and how much
echo     [10] Show a file as it was at a specific save point
echo     [11] Count total save points
echo     [12] Compare two save points
echo     [13] List all files tracked by the project
echo     [14] Show lines added/removed per save point
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-14]: "

if "!CH!"=="1" goto DoLog
if "!CH!"=="2" goto DoLogOneline
if "!CH!"=="3" goto DoDiff
if "!CH!"=="4" goto DoShowCommit
if "!CH!"=="5" goto DoSearchCommit
if "!CH!"=="6" goto DoBlame
if "!CH!"=="7" goto DoFileHistory
if "!CH!"=="8" goto DoReflog
if "!CH!"=="9" goto DoShortlog
if "!CH!"=="10" goto DoShowFileAtCommit
if "!CH!"=="11" goto DoCountCommits
if "!CH!"=="12" goto DoDiffCommits
if "!CH!"=="13" goto DoLsFiles
if "!CH!"=="14" goto DoCommitStats
if "!CH!"=="0" goto MainMenu
goto CatHistory

:DoLog
cls
echo.
echo  --- Commit Log ---
echo.
set /p "LOG_N=  How many commits to show? (press Enter for 10): "
if "!LOG_N!"=="" set "LOG_N=10"
call git log -!LOG_N! --graph --decorate
echo.
pause
goto CatHistory

:DoLogOneline
cls
echo.
echo  --- Compact Log ---
echo.
set /p "LOG_N2=  How many commits to show? (press Enter for 20): "
if "!LOG_N2!"=="" set "LOG_N2=20"
call git log -!LOG_N2! --oneline --graph --decorate
echo.
pause
goto CatHistory

:DoDiff
cls
echo.
echo  --- View Changes (Diff) ---
echo.
echo     [1]  Unstaged changes
echo     [2]  Staged changes
echo     [3]  Between two branches
echo.
set /p "DIFF_CH=  Select: "
if "!DIFF_CH!"=="1" call git diff
if "!DIFF_CH!"=="2" call git diff --cached
if "!DIFF_CH!"=="3" (
    set /p "DIFF_A=  First branch: "
    set /p "DIFF_B=  Second branch: "
    call git diff "!DIFF_A!".."!DIFF_B!"
)
echo.
pause
goto CatHistory

:DoShowCommit
cls
echo.
echo  --- Show a Commit ---
echo.
set /p "SHOW_SHA=  Enter commit hash: "
call git show "!SHOW_SHA!"
echo.
pause
goto CatHistory

:DoSearchCommit
cls
echo.
echo  --- Search Commits by Message ---
echo.
set /p "SEARCH_Q=  Enter search keyword: "
call git log --oneline --all --grep="!SEARCH_Q!"
echo.
pause
goto CatHistory

:DoBlame
cls
echo.
echo  --- Blame (Who Changed a File) ---
echo.
set /p "BLAME_F=  Enter file path: "
call git blame "!BLAME_F!"
echo.
pause
goto CatHistory

:DoFileHistory
cls
echo.
echo  --- File History ---
echo.
set /p "FHIST_F=  Enter file path: "
set /p "FHIST_N=  How many commits? (press Enter for 10): "
if "!FHIST_N!"=="" set "FHIST_N=10"
call git log -!FHIST_N! --oneline -- "!FHIST_F!"
echo.
pause
goto CatHistory

:DoReflog
cls
echo.
echo  --- Reflog (All Recent HEAD Movements) ---
echo.
set /p "RLOG_N=  How many entries? (press Enter for 20): "
if "!RLOG_N!"=="" set "RLOG_N=20"
call git reflog -!RLOG_N!
echo.
pause
goto CatHistory

:DoShortlog
cls
echo.
echo  --- Contributors (Shortlog) ---
echo.
call git shortlog -sne
echo.
pause
goto CatHistory

:DoShowFileAtCommit
cls
echo.
echo  --- Show File at a Specific Commit ---
echo.
set /p "SFC_SHA=  Enter commit hash: "
set /p "SFC_FILE=  Enter file path: "
call git show "!SFC_SHA!":"!SFC_FILE!"
echo.
pause
goto CatHistory

:DoCountCommits
cls
echo.
echo  --- Count Commits ---
echo.
echo  Commits on current branch:
for /f %%C in ('git rev-list --count HEAD 2^>nul') do echo  %%C
echo.
echo  Commits across all branches:
for /f %%C in ('git rev-list --count --all 2^>nul') do echo  %%C
echo.
pause
goto CatHistory

:DoDiffCommits
cls
echo.
echo  --- Diff Between Two Commits ---
echo.
echo  Recent commits:
call git log -10 --oneline
echo.
set /p "DC_A=  First commit hash: "
set /p "DC_B=  Second commit hash: "
call git diff "!DC_A!" "!DC_B!"
echo.
pause
goto CatHistory

:DoLsFiles
cls
echo.
echo  --- Files Tracked by Git ---
echo.
call git ls-files
echo.
pause
goto CatHistory

:DoCommitStats
cls
echo.
echo  --- Commit Stats ---
echo.
set /p "CSTAT_N=  How many commits? (press Enter for 5): "
if "!CSTAT_N!"=="" set "CSTAT_N=5"
call git log -!CSTAT_N! --stat
echo.
pause
goto CatHistory

:CatMerge
cls
echo.
echo  ===========================================================
echo  ^|  COMBINE WORK FROM DIFFERENT BRANCHES                   ^|
echo  ===========================================================
echo.
echo  'Merge' = bring another branch's work into yours.
echo  'Rebase' = replay your work on top of another branch.
echo  'Cherry-pick' = copy one specific save point to here.
echo.
echo     [1]  Bring another branch into this one (merge)
echo     [2]  Replay my work on top of another branch (rebase)
echo     [3]  Cancel an ongoing merge
echo     [4]  Cancel an ongoing rebase
echo     [5]  Copy a specific save point to here (cherry-pick)
echo     [6]  Continue a paused rebase
echo     [7]  Combine last N save points into one
echo     [8]  Merge (always create a merge save point)
echo     [9]  Continue a merge after fixing conflicts
echo     [10] Copy a range of save points to here
echo     [11] Cancel an ongoing cherry-pick
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-11]: "

if "!CH!"=="1" goto DoMerge
if "!CH!"=="2" goto DoRebase
if "!CH!"=="3" goto DoMergeAbort
if "!CH!"=="4" goto DoRebaseAbort
if "!CH!"=="5" goto DoCherryPick
if "!CH!"=="6" goto DoRebaseContinue
if "!CH!"=="7" goto DoSquash
if "!CH!"=="8" goto DoMergeNoFF
if "!CH!"=="9" goto DoMergeContinue
if "!CH!"=="10" goto DoCherryPickMulti
if "!CH!"=="11" goto DoCherryPickAbort
if "!CH!"=="0" goto MainMenu
goto CatMerge

:DoMerge
cls
echo.
echo  --- Merge a Branch ---
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  You are on: !CURRENT_BRANCH!
echo.
echo  Available branches:
call git branch
echo.
set /p "MERGE_BR=  Branch to merge into current: "
call git merge "!MERGE_BR!"
if errorlevel 1 (
    call :ResolveConflicts
)
echo.
pause
goto CatMerge

:DoRebase
cls
echo.
echo  --- Rebase onto Another Branch ---
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  You are on: !CURRENT_BRANCH!
echo.
set /p "REBASE_BR=  Branch to rebase onto: "
set /p "REBASE_CONFIRM=  This rewrites history. Continue? (Y/N): "
if /I "!REBASE_CONFIRM!"=="Y" (
    call git rebase "!REBASE_BR!"
) else (
    echo  Cancelled.
)
echo.
pause
goto CatMerge

:DoMergeAbort
cls
echo.
echo  --- Abort Merge ---
echo.
call git merge --abort
echo  Merge aborted.
echo.
pause
goto CatMerge

:DoRebaseAbort
cls
echo.
echo  --- Abort Rebase ---
echo.
call git rebase --abort
echo  Rebase aborted.
echo.
pause
goto CatMerge

:DoCherryPick
cls
echo.
echo  --- Cherry-Pick a Commit ---
echo.
echo  Recent commits across all branches:
call git log --all -10 --oneline
echo.
set /p "CP_SHA=  Enter commit hash to cherry-pick: "
call git cherry-pick "!CP_SHA!"
echo.
pause
goto CatMerge

:DoRebaseContinue
cls
echo.
echo  --- Continue Rebase ---
echo.
call git rebase --continue
echo.
pause
goto CatMerge

:DoSquash
cls
echo.
echo  --- Squash Last N Commits ---
echo.
echo  Recent commits:
call git log -10 --oneline
echo.
set /p "SQ_N=  How many commits to squash into one? "
set /p "SQ_CONFIRM=  This rewrites history. Continue? (Y/N): "
if /I "!SQ_CONFIRM!"=="Y" (
    call git reset --soft HEAD~!SQ_N!
    echo.
    set /p "SQ_MSG=  Enter new commit message: "
    call git commit -m "!SQ_MSG!"
) else (
    echo  Cancelled.
)
echo.
pause
goto CatMerge

:DoMergeNoFF
cls
echo.
echo  --- Merge with No Fast-Forward ---
echo.
for /f "delims=" %%I in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%I"
echo  You are on: !CURRENT_BRANCH!
echo.
echo  Available branches:
call git branch
echo.
set /p "MNFF_BR=  Branch to merge into current: "
call git merge --no-ff "!MNFF_BR!"
echo.
pause
goto CatMerge

:DoMergeContinue
cls
echo.
echo  --- Continue Merge (After Resolving Conflicts) ---
echo.
call git add -A
call git commit --no-edit
echo.
pause
goto CatMerge

:DoCherryPickMulti
cls
echo.
echo  --- Cherry-Pick Multiple Commits ---
echo.
echo  Recent commits across all branches:
call git log --all -15 --oneline
echo.
set /p "CPM_FROM=  Enter oldest commit hash (exclusive): "
set /p "CPM_TO=  Enter newest commit hash (inclusive): "
call git cherry-pick "!CPM_FROM!".."!CPM_TO!"
echo.
pause
goto CatMerge

:DoCherryPickAbort
cls
echo.
echo  --- Abort Cherry-Pick ---
echo.
call git cherry-pick --abort
echo  Cherry-pick aborted.
echo.
pause
goto CatMerge

:CatUndo
cls
echo.
echo  ===========================================================
echo  ^|  UNDO MISTAKES                                          ^|
echo  ===========================================================
echo.
echo     [1]  Undo last save point (keep my changes)
echo     [2]  Undo last save point (erase everything)
echo     [3]  Create a new save point that reverses an old one
echo     [4]  Go back to a specific save point
echo     [5]  Remove untracked files (files Git doesn't know about)
echo     [6]  Fix the last save point's description
echo     [7]  Add forgotten files to the last save point
echo     [8]  Bring back a deleted file from history
echo     [9]  Recover a lost save point
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-9]: "

if "!CH!"=="1" goto DoSoftReset
if "!CH!"=="2" goto DoHardResetLast
if "!CH!"=="3" goto DoRevert
if "!CH!"=="4" goto DoResetTo
if "!CH!"=="5" goto DoClean
if "!CH!"=="6" goto DoAmend
if "!CH!"=="7" goto DoAmendFiles
if "!CH!"=="8" goto DoRestoreDeleted
if "!CH!"=="9" goto DoReflogRecover
if "!CH!"=="0" goto MainMenu
goto CatUndo

:DoSoftReset
cls
echo.
echo  --- Undo Last Commit (Keep Changes) ---
echo.
call git reset --soft HEAD~1
echo  Last commit undone. Your changes are still staged.
echo.
pause
goto CatUndo

:DoHardResetLast
cls
echo.
echo  --- Undo Last Commit (Discard Changes) ---
echo.
set /p "HR_CONFIRM=  This will permanently delete changes. Continue? (Y/N): "
if /I "!HR_CONFIRM!"=="Y" (
    call git reset --hard HEAD~1
    echo  Last commit and changes discarded.
) else (
    echo  Cancelled.
)
echo.
pause
goto CatUndo

:DoRevert
cls
echo.
echo  --- Revert a Commit ---
echo.
echo  Recent commits:
call git log -5 --oneline
echo.
set /p "REV_SHA=  Enter commit hash to revert: "
call git revert "!REV_SHA!"
echo.
pause
goto CatUndo

:DoResetTo
cls
echo.
echo  --- Reset to a Specific Commit ---
echo.
echo  Recent commits:
call git log -10 --oneline
echo.
set /p "RESET_SHA=  Enter commit hash: "
echo.
echo     [1]  Soft (keep changes staged)
echo     [2]  Mixed (keep changes unstaged)
echo     [3]  Hard (discard everything)
echo.
set /p "RESET_MODE=  Select mode: "
if "!RESET_MODE!"=="1" call git reset --soft "!RESET_SHA!"
if "!RESET_MODE!"=="2" call git reset --mixed "!RESET_SHA!"
if "!RESET_MODE!"=="3" (
    set /p "RESET_CONFIRM=  Hard reset will discard all changes. Continue? (Y/N): "
    if /I "!RESET_CONFIRM!"=="Y" call git reset --hard "!RESET_SHA!"
)
echo.
pause
goto CatUndo

:DoClean
cls
echo.
echo  --- Clean Untracked Files ---
echo.
echo  Files that would be removed:
call git clean -n -d
echo.
set /p "CLEAN_CONFIRM=  Remove these files? (Y/N): "
if /I "!CLEAN_CONFIRM!"=="Y" (
    call git clean -f -d
    echo  Untracked files removed.
) else (
    echo  Cancelled.
)
echo.
pause
goto CatUndo

:DoAmend
cls
echo.
echo  --- Amend Last Commit Message ---
echo.
echo  Current last commit:
call git log -1 --oneline
echo.
set /p "AMEND_MSG=  Enter new commit message: "
call git commit --amend -m "!AMEND_MSG!"
echo.
pause
goto CatUndo

:DoAmendFiles
cls
echo.
echo  --- Amend Last Commit (Add More Files) ---
echo.
echo  Current last commit:
call git log -1 --oneline
echo.
echo  Modified files:
call git status --short
echo.
set /p "AMF_FILE=  Enter file path to add (or 'all' for everything): "
if /I "!AMF_FILE!"=="all" (
    call git add -A
) else (
    call git add "!AMF_FILE!"
)
call git commit --amend --no-edit
echo.
echo  Files added to the last commit.
echo.
pause
goto CatUndo

:DoRestoreDeleted
cls
echo.
echo  --- Restore a Deleted File ---
echo.
set /p "RDEL_FILE=  Enter the deleted file path: "
echo.
echo  Last commits that touched this file:
call git log --oneline --all -- "!RDEL_FILE!"
echo.
set /p "RDEL_SHA=  Enter commit hash to restore from (or press Enter for latest): "
if "!RDEL_SHA!"=="" (
    call git checkout HEAD -- "!RDEL_FILE!"
) else (
    call git checkout "!RDEL_SHA!" -- "!RDEL_FILE!"
)
echo.
pause
goto CatUndo

:DoReflogRecover
cls
echo.
echo  --- Recover a Commit from Reflog ---
echo.
echo  Reflog entries:
call git reflog -15
echo.
set /p "RREC_SHA=  Enter reflog entry hash to recover: "
echo.
echo     [1]  Create a new branch from it
echo     [2]  Cherry-pick it onto current branch
echo.
set /p "RREC_MODE=  Select: "
if "!RREC_MODE!"=="1" (
    set /p "RREC_BR=  New branch name: "
    call git checkout -b "!RREC_BR!" "!RREC_SHA!"
)
if "!RREC_MODE!"=="2" (
    call git cherry-pick "!RREC_SHA!"
)
echo.
pause
goto CatUndo

:CatTags
cls
echo.
echo  ===========================================================
echo  ^|  VERSIONS AND RELEASES (TAGS)                           ^|
echo  ===========================================================
echo.
echo  A 'tag' marks a specific save point as a named version
echo  (like v1.0, v2.0). Useful for releases.
echo.
echo     [1]  List all version tags
echo     [2]  Create a simple version tag
echo     [3]  Create a version tag with a description
echo     [4]  Delete a local version tag
echo     [5]  Upload a version tag to the cloud
echo     [6]  Upload all version tags to the cloud
echo     [7]  Delete a version tag from the cloud
echo     [8]  Show details of a version tag
echo     [9]  Tag a specific past save point
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-9]: "

if "!CH!"=="1" goto DoTagList
if "!CH!"=="2" goto DoTagLight
if "!CH!"=="3" goto DoTagAnnotated
if "!CH!"=="4" goto DoTagDelete
if "!CH!"=="5" goto DoTagPush
if "!CH!"=="6" goto DoTagPushAll
if "!CH!"=="7" goto DoTagDeleteRemote
if "!CH!"=="8" goto DoTagShow
if "!CH!"=="9" goto DoTagCommit
if "!CH!"=="0" goto MainMenu
goto CatTags

:DoTagList
cls
echo.
echo  --- All Tags ---
echo.
call git tag
echo.
pause
goto CatTags

:DoTagLight
cls
echo.
echo  --- Create Lightweight Tag ---
echo.
set /p "TLIGHT=  Enter tag name (e.g. v1.0.0): "
call git tag "!TLIGHT!"
echo.
echo  Tag '!TLIGHT!' created.
echo.
pause
goto CatTags

:DoTagAnnotated
cls
echo.
echo  --- Create Annotated Tag ---
echo.
set /p "TANN=  Enter tag name (e.g. v1.0.0): "
set /p "TANN_MSG=  Enter tag message: "
call git tag -a "!TANN!" -m "!TANN_MSG!"
echo.
echo  Annotated tag '!TANN!' created.
echo.
pause
goto CatTags

:DoTagDelete
cls
echo.
echo  --- Delete a Local Tag ---
echo.
echo  Existing tags:
call git tag
echo.
set /p "TDEL=  Enter tag name to delete: "
call git tag -d "!TDEL!"
echo.
pause
goto CatTags

:DoTagPush
cls
echo.
echo  --- Push a Tag ---
echo.
echo  Existing tags:
call git tag
echo.
set /p "TPUSH=  Enter tag name to push: "
set "TPUSH_REM=origin"
set /p "TPUSH_REM=  Remote (press Enter for 'origin'): "
call git push "!TPUSH_REM!" "!TPUSH!"
echo.
pause
goto CatTags

:DoTagPushAll
cls
echo.
echo  --- Push All Tags ---
echo.
set "TPALL_REM=origin"
set /p "TPALL_REM=  Remote (press Enter for 'origin'): "
call git push "!TPALL_REM!" --tags
echo.
echo  All tags pushed.
echo.
pause
goto CatTags

:DoTagDeleteRemote
cls
echo.
echo  --- Delete a Remote Tag ---
echo.
set /p "TDELR=  Enter tag name to delete from remote: "
set "TDELR_REM=origin"
set /p "TDELR_REM=  Remote (press Enter for 'origin'): "
set /p "TDELR_CONFIRM=  Delete tag '!TDELR!' from '!TDELR_REM!'? (Y/N): "
if /I "!TDELR_CONFIRM!"=="Y" (
    call git push "!TDELR_REM!" --delete "!TDELR!"
) else (
    echo  Cancelled.
)
echo.
pause
goto CatTags

:DoTagShow
cls
echo.
echo  --- Show Tag Details ---
echo.
echo  Existing tags:
call git tag
echo.
set /p "TSHOW=  Enter tag name: "
call git show "!TSHOW!"
echo.
pause
goto CatTags

:DoTagCommit
cls
echo.
echo  --- Tag a Specific Commit ---
echo.
echo  Recent commits:
call git log -10 --oneline
echo.
set /p "TC_SHA=  Enter commit hash: "
set /p "TC_TAG=  Enter tag name: "
set /p "TC_ANN=  Annotated tag? (Y/N): "
if /I "!TC_ANN!"=="Y" (
    set /p "TC_MSG=  Enter tag message: "
    call git tag -a "!TC_TAG!" "!TC_SHA!" -m "!TC_MSG!"
) else (
    call git tag "!TC_TAG!" "!TC_SHA!"
)
echo.
pause
goto CatTags

:CatSubmodules
cls
echo.
echo  ===========================================================
echo  ^|  SUBPROJECTS (SUBMODULES)                               ^|
echo  ===========================================================
echo.
echo  A 'submodule' is a separate project embedded inside yours.
echo.
echo     [1]  Add a subproject
echo     [2]  Set up existing subprojects
echo     [3]  Update subprojects to latest
echo     [4]  Show subproject status
echo     [5]  Remove a subproject
echo     [6]  Fix subproject URLs
echo     [7]  Download a project including its subprojects
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-7]: "

if "!CH!"=="1" goto DoSubAdd
if "!CH!"=="2" goto DoSubInit
if "!CH!"=="3" goto DoSubUpdate
if "!CH!"=="4" goto DoSubStatus
if "!CH!"=="5" goto DoSubDeinit
if "!CH!"=="6" goto DoSubSync
if "!CH!"=="7" goto DoSubClone
if "!CH!"=="0" goto MainMenu
goto CatSubmodules

:DoSubAdd
cls
echo.
echo  --- Add a Submodule ---
echo.
set /p "SUBA_URL=  Enter submodule repository URL: "
set /p "SUBA_PATH=  Enter local path for the submodule: "
call git submodule add "!SUBA_URL!" "!SUBA_PATH!"
echo.
pause
goto CatSubmodules

:DoSubInit
cls
echo.
echo  --- Initialize Submodules ---
echo.
call git submodule init
echo.
echo  Submodules initialized.
echo.
pause
goto CatSubmodules

:DoSubUpdate
cls
echo.
echo  --- Update Submodules ---
echo.
set /p "SUBU_REC=  Update recursively? (Y/N): "
if /I "!SUBU_REC!"=="Y" (
    call git submodule update --init --recursive
) else (
    call git submodule update --init
)
echo.
pause
goto CatSubmodules

:DoSubStatus
cls
echo.
echo  --- Submodule Status ---
echo.
call git submodule status
echo.
pause
goto CatSubmodules

:DoSubDeinit
cls
echo.
echo  --- Deinitialize a Submodule ---
echo.
echo  Current submodules:
call git submodule status
echo.
set /p "SUBD_PATH=  Enter submodule path to remove: "
set /p "SUBD_CONFIRM=  Remove submodule '!SUBD_PATH!'? (Y/N): "
if /I "!SUBD_CONFIRM!"=="Y" (
    call git submodule deinit -f "!SUBD_PATH!"
    echo  Submodule deinitialized.
) else (
    echo  Cancelled.
)
echo.
pause
goto CatSubmodules

:DoSubSync
cls
echo.
echo  --- Sync Submodule URLs ---
echo.
call git submodule sync --recursive
echo.
echo  Submodule URLs synced.
echo.
pause
goto CatSubmodules

:DoSubClone
cls
echo.
echo  --- Clone with Submodules ---
echo.
set /p "SUBC_URL=  Enter repository URL: "
set /p "SUBC_DIR=  Enter destination folder (or press Enter for default): "
if "!SUBC_DIR!"=="" (
    call git clone --recursive "!SUBC_URL!"
) else (
    call git clone --recursive "!SUBC_URL!" "!SUBC_DIR!"
)
echo.
pause
goto CatSubmodules

:CatAdvanced
cls
echo.
echo  ===========================================================
echo  ^|  POWER-USER TOOLS                                       ^|
echo  ===========================================================
echo.
echo     [1]  Search for text in the code
echo     [2]  Find which save point introduced a bug
echo     [3]  Export project as a zip/tar file
echo     [4]  Create a patch file (portable changes)
echo     [5]  Apply a patch file
echo     [6]  Work on multiple branches at once (add worktree)
echo     [7]  List active worktrees
echo     [8]  Remove a worktree
echo     [9]  Check if a file is being ignored
echo     [10] Optimize the repository (garbage collection)
echo     [11] Check repository for errors
echo     [12] Show repository size info
echo     [13] Run a custom git command
echo     [14] Show the .gitignore file
echo     [15] List all shortcuts (aliases)
echo.
echo     [0]  Back to main menu
echo.
set /p "CH=  Select an option [0-15]: "

if "!CH!"=="1" goto DoGrep
if "!CH!"=="2" goto DoBisect
if "!CH!"=="3" goto DoArchive
if "!CH!"=="4" goto DoPatchCreate
if "!CH!"=="5" goto DoPatchApply
if "!CH!"=="6" goto DoWorktreeAdd
if "!CH!"=="7" goto DoWorktreeList
if "!CH!"=="8" goto DoWorktreeRemove
if "!CH!"=="9" goto DoCheckIgnore
if "!CH!"=="10" goto DoGC
if "!CH!"=="11" goto DoFsck
if "!CH!"=="12" goto DoCountObjects
if "!CH!"=="13" goto DoCustomCmd
if "!CH!"=="14" goto DoIgnoreRules
if "!CH!"=="15" goto DoListAliases
if "!CH!"=="0" goto MainMenu
goto CatAdvanced

:DoGrep
cls
echo.
echo  --- Search Code (Grep) ---
echo.
set /p "GREP_Q=  Enter search pattern: "
call git grep -n "!GREP_Q!"
echo.
pause
goto CatAdvanced

:DoBisect
cls
echo.
echo  --- Bisect (Find a Bug) ---
echo.
echo     [1]  Start bisect
echo     [2]  Mark current as bad
echo     [3]  Mark current as good
echo     [4]  End bisect
echo.
set /p "BIS_CH=  Select: "
if "!BIS_CH!"=="1" (
    call git bisect start
    echo  Bisect started. Mark commits as good or bad.
)
if "!BIS_CH!"=="2" call git bisect bad
if "!BIS_CH!"=="3" (
    set /p "BIS_GOOD=  Enter good commit hash (or press Enter for current): "
    if "!BIS_GOOD!"=="" (
        call git bisect good
    ) else (
        call git bisect good "!BIS_GOOD!"
    )
)
if "!BIS_CH!"=="4" call git bisect reset
echo.
pause
goto CatAdvanced

:DoArchive
cls
echo.
echo  --- Archive Repository ---
echo.
set /p "ARC_NAME=  Output file name (e.g. archive.zip): "
set /p "ARC_FMT=  Format (zip/tar): "
call git archive --format="!ARC_FMT!" --output="!ARC_NAME!" HEAD
echo.
echo  Archive created: !ARC_NAME!
echo.
pause
goto CatAdvanced

:DoPatchCreate
cls
echo.
echo  --- Create a Patch ---
echo.
set /p "PAT_N=  How many commits to include? "
call git format-patch -!PAT_N!
echo.
echo  Patch file(s) created.
echo.
pause
goto CatAdvanced

:DoPatchApply
cls
echo.
echo  --- Apply a Patch ---
echo.
set /p "PAT_FILE=  Enter patch file path: "
call git apply "!PAT_FILE!"
echo.
pause
goto CatAdvanced

:DoWorktreeAdd
cls
echo.
echo  --- Add a Worktree ---
echo.
set /p "WT_PATH=  Enter path for the new worktree: "
set /p "WT_BR=  Enter branch to check out: "
call git worktree add "!WT_PATH!" "!WT_BR!"
echo.
pause
goto CatAdvanced

:DoWorktreeList
cls
echo.
echo  --- Worktree List ---
echo.
call git worktree list
echo.
pause
goto CatAdvanced

:DoWorktreeRemove
cls
echo.
echo  --- Remove a Worktree ---
echo.
echo  Current worktrees:
call git worktree list
echo.
set /p "WT_DEL=  Enter worktree path to remove: "
call git worktree remove "!WT_DEL!"
echo.
pause
goto CatAdvanced

:DoCheckIgnore
cls
echo.
echo  --- Check if a File is Ignored ---
echo.
set /p "CI_FILE=  Enter file path: "
call git check-ignore -v "!CI_FILE!"
if errorlevel 1 echo  File is NOT ignored.
echo.
pause
goto CatAdvanced

:DoGC
cls
echo.
echo  --- Garbage Collection ---
echo.
call git gc
echo.
echo  Garbage collection complete.
echo.
pause
goto CatAdvanced

:DoFsck
cls
echo.
echo  --- Verify Repository Integrity ---
echo.
call git fsck
echo.
pause
goto CatAdvanced

:DoCountObjects
cls
echo.
echo  --- Count Objects ---
echo.
call git count-objects -vH
echo.
pause
goto CatAdvanced

:DoCustomCmd
cls
echo.
echo  --- Run a Custom Git Command ---
echo.
echo  Type any git command (without the 'git' prefix).
echo.
set /p "CUSTOM_CMD=  git "
call git !CUSTOM_CMD!
echo.
pause
goto CatAdvanced

:DoIgnoreRules
cls
echo.
echo  --- Show .gitignore File ---
echo.
if exist ".gitignore" (
    type .gitignore
) else (
    echo  No .gitignore file found in current directory.
)
echo.
pause
goto CatAdvanced

:DoListAliases
cls
echo.
echo  --- Git Aliases ---
echo.
call git config --get-regexp alias
echo.
pause
goto CatAdvanced

:ResolveConflicts
echo.
echo  ===========================================================
echo  ^|  CONFLICT RESOLUTION                                    ^|
echo  ===========================================================
echo.
echo  There are conflicts that need to be resolved. Git found
echo  places where your changes and the other version overlap.
echo.
:ConflictFileLoop
echo  -----------------------------------------------------------
echo  Conflicting files:
echo  -----------------------------------------------------------
set "CONF_COUNT=0"
for /f "tokens=1,*" %%A in ('git status --porcelain 2^>nul') do (
    if "%%A"=="UU" (
        set /a CONF_COUNT+=1
        echo    - %%B
    )
    if "%%A"=="AA" (
        set /a CONF_COUNT+=1
        echo    - %%B [both added]
    )
    if "%%A"=="DU" (
        set /a CONF_COUNT+=1
        echo    - %%B [deleted by you, changed by them]
    )
    if "%%A"=="UD" (
        set /a CONF_COUNT+=1
        echo    - %%B [changed by you, deleted by them]
    )
)
echo.
if "!CONF_COUNT!"=="0" (
    echo  All conflicts are resolved!
    call git add -A
    call git commit --no-edit
    goto :eof
)
echo  For each file, you can:
echo    [1] Keep YOUR version (discard theirs)
echo    [2] Keep THEIR version (discard yours)
echo    [3] View the conflict and edit manually
echo.
set /p "CONF_FILE=  Enter a conflicting file name from the list above: "
echo.
echo     [1]  Keep MY version of '!CONF_FILE!'
echo     [2]  Keep THEIR version of '!CONF_FILE!'
echo     [3]  Show me the conflict so I can decide
echo.
set /p "CONF_ACTION=  Select: "
if "!CONF_ACTION!"=="1" (
    call git checkout --ours "!CONF_FILE!"
    call git add "!CONF_FILE!"
    echo  Kept YOUR version of '!CONF_FILE!'.
)
if "!CONF_ACTION!"=="2" (
    call git checkout --theirs "!CONF_FILE!"
    call git add "!CONF_FILE!"
    echo  Kept THEIR version of '!CONF_FILE!'.
)
if "!CONF_ACTION!"=="3" (
    echo.
    echo  ===========================================================
    echo  CONFLICT IN: !CONF_FILE!
    echo  ===========================================================
    echo  Lines between ^<^<^<^<^<^<^< and ======= are YOUR changes.
    echo  Lines between ======= and ^>^>^>^>^>^>^> are THEIR changes.
    echo  -----------------------------------------------------------
    type "!CONF_FILE!"
    echo.
    echo  -----------------------------------------------------------
    echo.
    echo  What do you want to do?
    echo     [1]  Keep MY version
    echo     [2]  Keep THEIR version
    echo     [3]  I'll edit the file myself, come back when done
    echo.
    set /p "CONF_EDIT=  Select: "
    if "!CONF_EDIT!"=="1" (
        call git checkout --ours "!CONF_FILE!"
        call git add "!CONF_FILE!"
        echo  Kept YOUR version.
    )
    if "!CONF_EDIT!"=="2" (
        call git checkout --theirs "!CONF_FILE!"
        call git add "!CONF_FILE!"
        echo  Kept THEIR version.
    )
    if "!CONF_EDIT!"=="3" (
        echo.
        echo  Edit the file in your editor to combine both versions.
        echo  Remove the ^<^<^<^<^<^<^<, =======, and ^>^>^>^>^>^>^> markers.
        echo  Save the file, then press any key to continue.
        pause >nul
        call git add "!CONF_FILE!"
        echo  File marked as resolved.
    )
)
echo.
goto ConflictFileLoop

:ExitScript
cls
echo.
echo  ===========================================================
echo  ^|                                                         ^|
echo  ^|            Thanks for using Git Manager!                 ^|
echo  ^|                                                         ^|
echo  ===========================================================
echo.
endlocal
exit /B 0