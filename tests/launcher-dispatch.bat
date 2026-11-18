@echo off
rem Dispatch test for OEM-Archive.bat: every fake Windows version must pick the right script. Run on any modern Windows.
rem Usage: tests\launcher-dispatch.bat      (exit code 0 = all correct)
setlocal
set FAIL=0
set OEM_DRYRUN=1
pushd "%~dp0.."
call :check 95    OEM-Archive-9x.bat
call :check 98    OEM-Archive-9x.bat
call :check me    OEM-Archive-9x.bat
call :check nt4   UNSUPPORTED
call :check 2k    OEM-Archive-NT5.js
call :check xp    OEM-Archive-NT5.js
call :check vista OEM-Archive-NT6.js
call :check 7     OEM-Archive-NT6.js
call :check 8     OEM-Archive-NT6.js
call :check 10    OEM-Archive-NT6.js
call :check 11    OEM-Archive-NT6.js
set OEM_FAKEVER=
echo --- real version on this PC:
call .\OEM-Archive.bat
popd
if "%FAIL%"=="0" echo launcher dispatch: all correct
if not "%FAIL%"=="0" echo launcher dispatch: %FAIL% WRONG
exit /b %FAIL%

:check
set OEM_FAKEVER=%1
set GOT=
for /f "tokens=2 delims==" %%a in ('call .\OEM-Archive.bat') do set GOT=%%a
if "%GOT%"=="%2" (echo ok    %1 -^> %GOT%) else (echo WRONG %1 -^> "%GOT%"  expected %2 & set FAIL=1)
goto :eof
