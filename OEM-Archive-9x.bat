@echo off
rem ==========================================================================
rem  OEM-Archive-9x.bat  -  Windows 95 / 98 / 98 SE / ME edition (plain batch)
rem
rem  Copies the places where PC makers (OEMs) put their changes into an
rem  "OEM Archive" folder and writes a grouped transcript.
rem
rem  Written for command.com: no FOR /F, no SET /P, no CALL :label, no
rem  %var:~x,y%.  Menus use CHOICE.COM.  Short (8.3) names are used for
rem  paths so quoting problems are avoided.  Folder CONTENTS on these systems
rem  cannot be compared with a clean install by a batch file, so the stock-
rem  heavy folders (Media, Wallpaper, Cursors, ...) are copied whole and
rem  marked UNFILTERED in the transcript.
rem
rem  Usage:  OEM-Archive-9x.bat [base-folder] [name] [preset 1-5]
rem     base-folder  where to store the archive (must already exist; use .
rem                  for the script's own folder).  The archive goes to <base>\OEM Archive\<name>
rem                  unless <base> itself ends in \Archive or \OEM Archive,
rem                  then it goes to <base>\<name>.
rem     name         archive folder name (default OEM_<Windows version>)
rem     preset       1 Everything   2 Branding + drivers, software list only
rem                  3 Branding only   4 Drivers only   5 Software only
rem  NOT TESTED on a real Windows 9x machine (none was available to the
rem  author); the logic was exercised under cmd.exe with a synthetic tree.
rem ==========================================================================

if "%1"=="--copy" goto copyone

cls
echo ==============================================================
echo  OEM-Archiver 1.0.0  -  Windows 95 / 98 / ME edition
echo  Copies what the PC maker added. Read-only on your system.
echo ==============================================================
echo.
echo NOTICE: for best results, run this on a FRESH or recently installed copy of the
echo OEM image (before the PC is used heavily or has other software installed).
echo.
if "%3"=="" pause

rem --- wrong Windows?  (NT family has its own, smarter scripts)
if "%OS%"=="Windows_NT" if not "%OA_TEST%"=="1" goto wrongos

rem --- locations (OA_ROOT / OA_WIN can be overridden for testing)
if "%OA_ROOT%"=="" set OA_ROOT=C:
if "%OA_WIN%"=="" set OA_WIN=%windir%
set R=%OA_ROOT%
set W=%OA_WIN%
rem (in test mode on a modern Windows, regedit would raise a UAC prompt, so its calls become comments)
set RGE=regedit /e
if "%OA_TEST%"=="1" set RGE=rem
if "%TMP%"=="" set TMP=%W%\TEMP
set DOK=0
if exist %TMP%\nul set DOK=1
if exist %TMP%\ set DOK=1
if %DOK%==0 md %TMP%

rem --- Windows version from VER
set WV=Win9x
ver | find "4.00" > nul
if not errorlevel 1 set WV=Win95
ver | find "4.10" > nul
if not errorlevel 1 set WV=Win98
ver | find "4.10.2222" > nul
if not errorlevel 1 set WV=Win98SE
ver | find "4.90" > nul
if not errorlevel 1 set WV=WinME
echo Windows version detected: %WV%

rem --- archive folder name
set ANAME=%2
if "%ANAME%"=="" set ANAME=OEM_%WV%

rem --- where to store it
set BASE=%1
if not "%BASE%"=="" goto havebase
echo.
echo Where should the OEM Archive be stored?
echo    1) Same folder as this script   (becomes .\OEM Archive\%ANAME%)
echo    2) C:\My Documents
echo    3) Another drive   (you will pick a drive letter)
echo    4) Cancel
echo  (For any other folder, start this script as:  OEM-Archive-9x.bat D:\Folder MyName)
choice /c:1234 /n Choose 1-4:
if errorlevel 4 goto cancel
if errorlevel 3 goto pickdrv
if errorlevel 2 goto mydocs
set BASE=.
goto havebase

:mydocs
set BASE=%R%\MYDOCU~1
set DOK=0
if exist %BASE%\nul set DOK=1
if exist %BASE%\ set DOK=1
if %DOK%==0 set BASE=.
goto havebase

:pickdrv
echo.
echo Which drive? (D E F G H)
choice /c:DEFGH /n Drive letter:
if errorlevel 5 set BASE=H:\
if errorlevel 5 goto havebase
if errorlevel 4 set BASE=G:\
if errorlevel 4 goto havebase
if errorlevel 3 set BASE=F:\
if errorlevel 3 goto havebase
if errorlevel 2 set BASE=E:\
if errorlevel 2 goto havebase
set BASE=D:\

:havebase
rem --- nesting rule: <base>\OEM Archive\<name>, unless base ends in \Archive or \OEM Archive
set J=\
echo %BASE%#| find "\#" > nul
if not errorlevel 1 set J=
set FLAT=0
echo %BASE%#| find /i "\ARCHIVE#" > nul
if not errorlevel 1 set FLAT=1
echo %BASE%#| find /i "\ARCHIVE\#" > nul
if not errorlevel 1 set FLAT=1
echo %BASE%#| find /i "\OEM ARCHIVE#" > nul
if not errorlevel 1 set FLAT=1
echo %BASE%#| find /i "\OEM ARCHIVE\#" > nul
if not errorlevel 1 set FLAT=1
if "%FLAT%"=="1" set ROOT=%BASE%%J%%ANAME%
if "%FLAT%"=="0" set ROOT=%BASE%%J%OEM Archive\%ANAME%

rem --- what to copy
set PRESET=%3
if not "%PRESET%"=="" goto setpre
echo.
echo What do you want to copy?
echo    1) Everything
echo    2) Branding + drivers, software LIST only
echo    3) Branding only
echo    4) Drivers only
echo    5) Software only
choice /c:12345 /n Choose 1-5:
if errorlevel 5 set PRESET=5
if errorlevel 5 goto setpre
if errorlevel 4 set PRESET=4
if errorlevel 4 goto setpre
if errorlevel 3 set PRESET=3
if errorlevel 3 goto setpre
if errorlevel 2 set PRESET=2
if errorlevel 2 goto setpre
set PRESET=1

:setpre
rem BR = branding (1 copy / 0 skip)   DR = drivers (F full / L list / 0 skip)   SW = software (A all / L list / 0 skip)
set BR=1
set DR=F
set SW=A
if "%PRESET%"=="2" set SW=L
if "%PRESET%"=="3" set DR=0
if "%PRESET%"=="3" set SW=0
if "%PRESET%"=="4" set BR=0
if "%PRESET%"=="4" set SW=0
if "%PRESET%"=="5" set BR=0
if "%PRESET%"=="5" set DR=0
if not "%3"=="" goto summary
echo.
choice /c:YN /n Adjust branding / drivers / software separately (Y/N)?
if errorlevel 2 goto summary
echo.
echo Branding (wallpapers, sounds, themes, logos, OOBE, start menu ...):
choice /c:CS /n (C)opy or (S)kip?
if errorlevel 2 set BR=0
if errorlevel 1 if not errorlevel 2 set BR=1
echo.
echo Drivers:
choice /c:FLS /n (F)ull copy, (L)ist only, or (S)kip?
if errorlevel 3 set DR=0
if errorlevel 3 goto pgsw
if errorlevel 2 set DR=L
if errorlevel 2 goto pgsw
set DR=F
:pgsw
echo.
echo Software (OEM program folders, installers, recovery sources):
choice /c:ALS /n (A)ll files, (L)ist only, or (S)kip?
if errorlevel 3 set SW=0
if errorlevel 3 goto summary
if errorlevel 2 set SW=L
if errorlevel 2 goto summary
set SW=A

:summary
echo.
echo ----- Summary -----
echo Archive folder : %ROOT%
echo Branding=%BR%  Drivers=%DR%  Software=%SW%     (1/F/A = copy, L = list only, 0 = skip)
echo NOTE: this edition cannot measure sizes. Free space on the target is NOT checked.
if "%3"=="" choice /c:YN /n Start copying (Y/N)?
if "%3"=="" if errorlevel 2 goto cancel

rem --- create the folders (one level at a time: command.com cannot be trusted with deep paths)
rem (directory test = "dir\nul" for command.com, "dir\" for cmd.exe; either one proves it exists)
set DOK=0
if exist "%BASE%\nul" set DOK=1
if exist "%BASE%\" set DOK=1
if %DOK%==0 md "%BASE%"
if "%FLAT%"=="1" goto mkroot
set DOK=0
if exist "%BASE%%J%OEM Archive\nul" set DOK=1
if exist "%BASE%%J%OEM Archive\" set DOK=1
if %DOK%==0 md "%BASE%%J%OEM Archive"
:mkroot
set DOK=0
if exist "%ROOT%\nul" set DOK=1
if exist "%ROOT%\" set DOK=1
if %DOK%==1 set ROOT=%ROOT%_2
md "%ROOT%"
set DOK=0
if exist "%ROOT%\nul" set DOK=1
if exist "%ROOT%\" set DOK=1
if %DOK%==0 goto nomake
md "%ROOT%\00_Transcript"
md "%ROOT%\00_Transcript\registry"
set LOGF=%ROOT%\00_Transcript\transcript.txt
set DEST=%ROOT%

echo OEM ARCHIVE TRANSCRIPT (Windows 9x edition)> "%LOGF%"
echo ================================================>> "%LOGF%"
echo Windows version: %WV%>> "%LOGF%"
echo Archive folder : %ROOT%>> "%LOGF%"
echo Selection      : Branding=%BR% Drivers=%DR% Software=%SW%>> "%LOGF%"
echo.>> "%LOGF%"
echo This edition lists every source path it looked at. [not present] = nothing there.>> "%LOGF%"
echo UNFILTERED = the folder also contains stock Windows files; compare with a clean install.>> "%LOGF%"
echo.>> "%LOGF%"

rem --- system profile (VER, date, registry values) ---
echo SYSTEM PROFILE> "%ROOT%\00_Transcript\system-profile.txt"
ver >> "%ROOT%\00_Transcript\system-profile.txt"
echo.|date|find /i "current" >> "%ROOT%\00_Transcript\system-profile.txt"
echo.|time|find /i "current" >> "%ROOT%\00_Transcript\system-profile.txt"
%RGE% "%TMP%\OAPROF.REG" "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion"
if exist %TMP%\OAPROF.REG find "ProductId" %TMP%\OAPROF.REG >> "%ROOT%\00_Transcript\system-profile.txt"
if exist %TMP%\OAPROF.REG find "RegisteredOwner" %TMP%\OAPROF.REG >> "%ROOT%\00_Transcript\system-profile.txt"
if exist %TMP%\OAPROF.REG find "FirstInstallDateTime" %TMP%\OAPROF.REG >> "%ROOT%\00_Transcript\system-profile.txt"
if exist %TMP%\OAPROF.REG find "Version" %TMP%\OAPROF.REG >> "%ROOT%\00_Transcript\system-profile.txt"
if exist %TMP%\OAPROF.REG del %TMP%\OAPROF.REG

echo.
echo Copying ... (this can take a while; nothing is changed on your system)

rem ======================  GROUP CALLS  ======================
rem call %0 --copy <group folder> <source> <leaf name> <flag> <B|D|S>
echo [01] BRANDING / SYSTEM INFO>> "%LOGF%"
call %0 --copy 01_Branding_SystemInfo %W%\SYSTEM\OEMINFO.INI OEMINFO.INI - B
call %0 --copy 01_Branding_SystemInfo %W%\SYSTEM\OEMLOGO.BMP OEMLOGO.BMP - B
call %0 --copy 01_Branding_SystemInfo %W%\OEMINFO.INI OEMINFO.INI.windir - B
echo [02] BOOT / LOGON SCREENS>> "%LOGF%"
call %0 --copy 02_Boot_Logon_Lock %R%\LOGO.SYS LOGO.SYS - B
call %0 --copy 02_Boot_Logon_Lock %W%\LOGOW.SYS LOGOW.SYS - B
call %0 --copy 02_Boot_Logon_Lock %W%\LOGOS.SYS LOGOS.SYS - B
call %0 --copy 02_Boot_Logon_Lock %R%\MSDOS.SYS MSDOS.SYS - B
echo [03] WALLPAPERS>> "%LOGF%"
call %0 --copy 03_Wallpapers %W%\WEB\WALLPAPER Web_Wallpaper UNFILTERED B
call %0 --copy 03_Wallpapers %W%\*.BMP windir_bmp UNFILTERED B
call %0 --copy 03_Wallpapers %W%\*.JPG windir_jpg UNFILTERED B
echo [04] THEMES>> "%LOGF%"
call %0 --copy 04_Themes_VisualStyles %W%\DESKTO~1 Desktop_Themes UNFILTERED B
call %0 --copy 04_Themes_VisualStyles %R%\PROGRA~1\PLUS!\THEMES Plus_Themes UNFILTERED B
echo [05] SOUNDS>> "%LOGF%"
call %0 --copy 05_Sounds %W%\MEDIA Media UNFILTERED B
echo [06] CURSORS / SCREEN SAVERS>> "%LOGF%"
call %0 --copy 06_Cursors_Icons_Screensavers %W%\CURSORS Cursors UNFILTERED B
call %0 --copy 06_Cursors_Icons_Screensavers %W%\SYSTEM\*.SCR Screensavers UNFILTERED B
echo [08] OOBE / SETUP>> "%LOGF%"
call %0 --copy 08_OOBE_Setup_Unattend %W%\SYSTEM\OOBE OOBE_system - B
call %0 --copy 08_OOBE_Setup_Unattend %W%\OOBE OOBE_windir - B
echo [09] START MENU / DESKTOP>> "%LOGF%"
call %0 --copy 09_StartMenu_Taskbar_Desktop %W%\STARTM~1 Start_Menu UNFILTERED B
call %0 --copy 09_StartMenu_Taskbar_Desktop %W%\DESKTOP Desktop UNFILTERED B
call %0 --copy 09_StartMenu_Taskbar_Desktop %W%\ALLUSE~1 All_Users UNFILTERED B
echo [10] BROWSER / SUPPORT>> "%LOGF%"
call %0 --copy 10_Browser_Help_Support %W%\FAVORI~1 Favorites UNFILTERED B
call %0 --copy 10_Browser_Help_Support %R%\PROGRA~1\INTERN~1\CUSTOM IE_Custom - B
echo [14] OTHER (startup / configuration files that show OEM hooks)>> "%LOGF%"
call %0 --copy 14_Other %W%\WIN.INI WIN.INI - B
call %0 --copy 14_Other %W%\SYSTEM.INI SYSTEM.INI - B
call %0 --copy 14_Other %R%\CONFIG.SYS CONFIG.SYS - B
call %0 --copy 14_Other %R%\AUTOEXEC.BAT AUTOEXEC.BAT - B
echo [11] DRIVERS>> "%LOGF%"
call %0 --copy 11_Drivers %W%\INF\OTHER INF_OTHER - D
call %0 --copy 11_Drivers %W%\INF\OEM*.INF INF_oem - D
call %0 --copy 11_Drivers %R%\DRIVERS C_DRIVERS - D
call %0 --copy 11_Drivers %R%\DRIVER C_DRIVER - D
echo [12] SOFTWARE (OEM staging folders at the drive root)>> "%LOGF%"
call %0 --copy 12_Software %R%\SWSETUP SWSETUP - S
call %0 --copy 12_Software %R%\SWTOOLS SWTOOLS - S
call %0 --copy 12_Software %R%\HP HP - S
call %0 --copy 12_Software %R%\COMPAQ COMPAQ - S
call %0 --copy 12_Software %R%\DELL DELL - S
call %0 --copy 12_Software %R%\GATEWAY GATEWAY - S
call %0 --copy 12_Software %R%\ACER ACER - S
call %0 --copy 12_Software %R%\SONY SONY - S
call %0 --copy 12_Software %R%\TOSHIBA TOSHIBA - S
call %0 --copy 12_Software %R%\IBMTOOLS IBMTOOLS - S
call %0 --copy 12_Software %R%\EMACHINE EMACHINE - S
call %0 --copy 12_Software %R%\PACKARD PACKARD - S
call %0 --copy 12_Software %R%\FUJITSU FUJITSU - S
call %0 --copy 12_Software %R%\NEC NEC - S
call %0 --copy 12_Software %R%\MEDION MEDION - S
call %0 --copy 12_Software %R%\SAMSUNG SAMSUNG - S
call %0 --copy 12_Software %R%\MSI MSI - S
echo [13] RECOVERY / SETUP SOURCES (follow the software setting - they can be large)>> "%LOGF%"
call %0 --copy 13_Recovery_Setup_Sources %W%\OPTIONS Windows_Options - S
call %0 --copy 13_Recovery_Setup_Sources %R%\RECOVERY RECOVERY - S
call %0 --copy 13_Recovery_Setup_Sources %R%\SYSTEM.SAV SYSTEM.SAV - S
call %0 --copy 13_Recovery_Setup_Sources %R%\WIN95 WIN95 - S
call %0 --copy 13_Recovery_Setup_Sources %R%\WIN98 WIN98 - S
call %0 --copy 13_Recovery_Setup_Sources %R%\WINME WINME - S

rem --- registry exports and the software / driver lists ---
if "%BR%"=="0" goto noreg
%RGE% "%ROOT%\00_Transcript\registry\Setup.reg" "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Setup"
%RGE% "%ROOT%\00_Transcript\registry\Run.reg" "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Run"
%RGE% "%ROOT%\00_Transcript\registry\RunOnce.reg" "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\RunOnce"
:noreg
if "%SW%"=="0" goto nosw
set DOK=0
if exist "%ROOT%\12_Software\nul" set DOK=1
if exist "%ROOT%\12_Software\" set DOK=1
if %DOK%==0 md "%ROOT%\12_Software"
%RGE% "%TMP%\OAUNINST.REG" "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Uninstall"
if exist %TMP%\OAUNINST.REG find "DisplayName" %TMP%\OAUNINST.REG > "%ROOT%\12_Software\software-manifest.txt"
if exist %TMP%\OAUNINST.REG del %TMP%\OAUNINST.REG
dir /b %R%\PROGRA~1 > "%ROOT%\12_Software\program-files-list.txt"
:nosw
if "%DR%"=="0" goto nodr
set DOK=0
if exist "%ROOT%\11_Drivers\nul" set DOK=1
if exist "%ROOT%\11_Drivers\" set DOK=1
if %DOK%==0 md "%ROOT%\11_Drivers"
dir /b %W%\INF\OTHER > "%ROOT%\11_Drivers\driver-manifest.txt"
:nodr

echo.>> "%LOGF%"
echo Done.>> "%LOGF%"
dir /s "%ROOT%" > "%ROOT%\00_Transcript\file-structure.txt"
echo.
echo Done.  Archive: %ROOT%
echo Open 00_Transcript\transcript.txt for the grouped report and
echo file-structure.txt for the full file tree.
goto end

rem ======================  subroutine: copy one source  ======================
:copyone
rem %2 group folder   %3 source   %4 leaf name   %5 flag (UNFILTERED or -)   %6 category B / D / S
if "%6"=="B" if "%BR%"=="0" goto cskip
if "%6"=="D" if "%DR%"=="0" goto cskip
if "%6"=="S" if "%SW%"=="0" goto cskip
if exist %3\nul goto cdir
if exist %3\ goto cdir
if exist %3 goto cfile
echo   [not present] %3>> "%LOGF%"
goto cdone
:cskip
rem category switched off: record that the source exists but was not copied
if exist %3 echo   [not copied by choice] %3>> "%LOGF%"
goto cdone
:cdir
if "%6"=="D" if "%DR%"=="L" goto clist
if "%6"=="S" if "%SW%"=="L" goto clist
echo   [folder] %3  copied to  %2\%4  %5>> "%LOGF%"
xcopy %3\*.* "%DEST%\%2\%4\" /s /e /i /h /k /y > nul
if errorlevel 1 echo     xcopy reported a problem or the folder was empty>> "%LOGF%"
dir /s /b %3 >> "%LOGF%"
goto cdone
:clist
echo   [listed only - list mode] %3>> "%LOGF%"
dir /s /b %3 >> "%LOGF%"
goto cdone
:cfile
if "%6"=="D" if "%DR%"=="L" goto clist2
if "%6"=="S" if "%SW%"=="L" goto clist2
echo   [file] %3  copied to  %2  %5>> "%LOGF%"
xcopy %3 "%DEST%\%2\" /h /y > nul
if errorlevel 1 echo     xcopy reported a problem>> "%LOGF%"
dir /b %3 >> "%LOGF%"
goto cdone
:clist2
echo   [listed only - list mode] %3>> "%LOGF%"
dir /b %3 >> "%LOGF%"
:cdone
goto end

:wrongos
echo This is the Windows 95/98/ME edition. This PC runs a newer Windows:
echo run OEM-Archive.bat (it starts OEM-Archive-NT5.js or OEM-Archive-NT6.js).
goto end

:nomake
echo Could not create the archive folder: %ROOT%
echo Create the base folder first, then run this script again.
goto end

:cancel
echo.
echo Cancelled. Nothing was copied.

:end
