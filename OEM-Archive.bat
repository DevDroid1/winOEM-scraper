@echo off
rem ==========================================================================
rem  OEM-Archive.bat  -  starts the right OEM-Archiver edition for this Windows
rem
rem    Windows 95 / 98 / 98 SE / ME   ->  OEM-Archive-9x.bat   (plain batch)
rem    Windows 2000 / XP / 2003       ->  OEM-Archive-NT5.js   (JScript via cscript)
rem    Windows Vista / 7 / 8 / 10 / 11->  OEM-Archive-NT6.js   (JScript via cscript)
rem
rem  Any arguments are passed through (see README.txt for the switches).
rem  Keep all the OEM-Archive files in the same folder.
rem ==========================================================================

if not "%OEM_FAKEVER%"=="" goto fake
if "%OS%"=="Windows_NT" goto nt
goto w9x

:nt
ver | find "Version 4." > nul
if not errorlevel 1 goto nt4
ver | find "Version 5." > nul
if not errorlevel 1 goto nt5
goto nt6

:fake
rem test hook: OEM_FAKEVER = 95 | 98 | me | nt4 | 2k | xp | vista | 7 | 8 | 10 | 11   (with OEM_DRYRUN=1 only prints the choice)
if "%OEM_FAKEVER%"=="95" goto w9x
if "%OEM_FAKEVER%"=="98" goto w9x
if "%OEM_FAKEVER%"=="me" goto w9x
if "%OEM_FAKEVER%"=="nt4" goto nt4
if "%OEM_FAKEVER%"=="2k" goto nt5
if "%OEM_FAKEVER%"=="xp" goto nt5
goto nt6

:w9x
if "%OEM_DRYRUN%"=="1" echo DISPATCH=OEM-Archive-9x.bat
if "%OEM_DRYRUN%"=="1" goto end
if not exist OEM-Archive-9x.bat goto nofile9
call OEM-Archive-9x.bat %1 %2 %3
goto end

:nt5
if "%OEM_DRYRUN%"=="1" echo DISPATCH=OEM-Archive-NT5.js
if "%OEM_DRYRUN%"=="1" goto end
cscript //nologo "%~dp0OEM-Archive-NT5.js" %*
goto end

:nt6
if "%OEM_DRYRUN%"=="1" echo DISPATCH=OEM-Archive-NT6.js
if "%OEM_DRYRUN%"=="1" goto end
cscript //nologo "%~dp0OEM-Archive-NT6.js" %*
goto end

:nt4
if "%OEM_DRYRUN%"=="1" echo DISPATCH=UNSUPPORTED
echo Windows NT 4.0 is not supported by OEM-Archiver (Windows 95/98/ME, 2000, XP and newer are).
goto end

:nofile9
echo Please run this from the folder that contains OEM-Archive-9x.bat.

:end
