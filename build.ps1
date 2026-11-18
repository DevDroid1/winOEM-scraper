# Dev-time build: assembles the single-file scripts from src\ (vendors.js + common.js + tier file).
# The built files must be single files on purpose: Win11 24H2's JScript engine change (KB5105752) makes
# multi-script includes (.wsf <script src>) unreliable.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root 'src'
function Read-Src([string]$n) { [System.IO.File]::ReadAllText((Join-Path $src $n)) }

$tiers = @(
  @{ File = 'OEM-Archive-NT6.js'; Src = 'nt6.js'; Call = 'OA.main6();' },
  @{ File = 'OEM-Archive-NT5.js'; Src = 'nt5.js'; Call = 'OA.main5();' }
)
foreach ($t in $tiers) {
  $path = Join-Path $src $t.Src
  if (-not (Test-Path $path)) { Write-Host ("skip  {0} (no src\{1})" -f $t.File, $t.Src); continue }
  $head = "// OEM-Archiver - built from src\ by build.ps1 - edit src\, then rebuild. Runs with: cscript //nologo $($t.File)`n"
  $text = $head + (Read-Src 'vendors.js') + "`n" + (Read-Src 'common.js') + "`n" + (Read-Src $t.Src) + "`n" + $t.Call + "`n"
  if ($text -match '[^\x00-\x7F]') { throw "Non-ASCII character found in sources for $($t.File); keep sources ASCII-only." }
  $text = $text -replace "`r?`n", "`r`n"
  [System.IO.File]::WriteAllText((Join-Path $root $t.File), $text, (New-Object System.Text.ASCIIEncoding))
  Write-Host ("built {0}  ({1:N0} bytes)" -f $t.File, $text.Length)
}
# batch files and text files must have CRLF line endings (command.com / old Notepad)
foreach ($n in 'OEM-Archive.bat', 'OEM-Archive-9x.bat', 'README.txt', 'STRUCTURE.txt') {
  $p = Join-Path $root $n
  if (Test-Path $p) {
    $x = [System.IO.File]::ReadAllText($p) -replace "`r?`n", "`r`n"
    [System.IO.File]::WriteAllText($p, $x, (New-Object System.Text.ASCIIEncoding))
  }
}
