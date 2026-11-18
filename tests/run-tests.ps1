# Runs every automated check: build, ES3 lint (+ a negative lint test), selftest, launcher dispatch.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$fail = 0
function Step($name, [scriptblock]$b) { Write-Host "== $name"; & $b; if ($LASTEXITCODE -ne 0) { Write-Host "   FAILED ($LASTEXITCODE)"; $script:fail++ } }

Step 'build' { & powershell -NoProfile -ExecutionPolicy Bypass -File "$root\build.ps1" }
Step 'ES3 lint of src' { & powershell -NoProfile -ExecutionPolicy Bypass -File "$root\tests\lint-es3.ps1" -Root $root }

Write-Host '== ES3 lint must reject modern syntax (negative test)'
$neg = Join-Path ([IO.Path]::GetTempPath()) ('oa-lint-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path "$neg\src" -Force | Out-Null
Set-Content "$neg\src\bad.js" 'var f = (x) => x; let y = 1; [1].forEach(function () {}); var o = { a: 1, };' -Encoding ascii
& powershell -NoProfile -ExecutionPolicy Bypass -File "$root\tests\lint-es3.ps1" -Root $neg | Out-Null
if ($LASTEXITCODE -eq 1) { Write-Host '   ok: lint rejected the bad file' } else { Write-Host '   FAILED: lint accepted bad syntax'; $fail++ }
Remove-Item $neg -Recurse -Force

Step 'selftest' {
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ('oa-selftest-' + [guid]::NewGuid().ToString('N') + '.js')
  $txt = (Get-Content "$root\src\vendors.js" -Raw) + "`n" + (Get-Content "$root\src\common.js" -Raw) + "`n" + (Get-Content "$root\tests\selftest.js" -Raw)
  [IO.File]::WriteAllText($tmp, $txt, (New-Object Text.ASCIIEncoding))
  & cscript //nologo $tmp
  $rc = $LASTEXITCODE
  Remove-Item $tmp -Force
  $global:LASTEXITCODE = $rc
}
Step 'launcher dispatch' { & cmd /c "`"$root\tests\launcher-dispatch.bat`"" }
if ($fail -eq 0) { Write-Host 'ALL CHECKS PASSED'; exit 0 } else { Write-Host "$fail CHECK(S) FAILED"; exit 1 }
