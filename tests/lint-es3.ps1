# ES3 lint for the JScript sources. Old WSH engines (JScript 5.6 on XP, 5.7 on Vista/7) only know ES3,
# so anything newer must not appear in src\*.js. Comments and string literals are stripped before checking.
param([string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)))
$ErrorActionPreference = 'Stop'
$rules = @(
  @{ Name = 'arrow function';        Rx = '=>' },
  @{ Name = 'let / const';           Rx = '(^|[^\w$.])(let|const)\s+[\w$\[{]' },
  @{ Name = 'template literal';      Rx = '`' },
  @{ Name = 'class keyword';         Rx = '(^|[^\w$.])class\s+\w' },
  @{ Name = 'Array.forEach/map/filter/reduce/some/every'; Rx = '\.(forEach|map|filter|reduce|reduceRight|some|every)\s*\(' },
  @{ Name = 'Array.indexOf/lastIndexOf on arrays (use OA.inArray)'; Rx = '\b(arr|list|names|keys|parts|ks|lines|files|subs|out|kept|items)\.(indexOf|lastIndexOf)\s*\(' },
  @{ Name = 'JSON object';           Rx = '\bJSON\.' },
  @{ Name = 'Object.keys/create/defineProperty'; Rx = '\bObject\.(keys|create|defineProperty|freeze|getPrototypeOf)\b' },
  @{ Name = 'Array.isArray';         Rx = '\bArray\.isArray\b' },
  @{ Name = 'String.trim / startsWith / endsWith / includes / repeat / pad'; Rx = '(?<!\bOA)\.(trim|trimLeft|trimRight|startsWith|endsWith|includes|repeat|padStart|padEnd)\s*\(' },
  @{ Name = 'Date.now / toISOString'; Rx = '\bDate\.now\b|\.toISOString\s*\(' },
  @{ Name = 'Function.bind';         Rx = '\.bind\s*\(' },
  @{ Name = 'strict mode / getters'; Rx = '''use strict''|"use strict"|\bget\s+\w+\s*\(\)\s*\{' },
  @{ Name = 'trailing comma';        Rx = ',\s*[\}\]]' },
  @{ Name = 'reserved word as property'; Rx = '\.(default|class|delete|new|in|is|catch|finally|enum|export|import|super|typeof|void|with)\b(?!\s*\()' },
  @{ Name = 'string indexing s[0]';  Rx = '\b(txt|text|str|ln|name|path|src|s)\[\s*\d+\s*\]' },
  @{ Name = 'non-ASCII character';   Rx = '[^\x00-\x7F]' }
)
function Strip-Code([string]$text) {
  # remove /* */ and // comments, and the contents of '...' and "..." literals (keeping the quotes)
  $sb = New-Object System.Text.StringBuilder
  $i = 0; $n = $text.Length
  while ($i -lt $n) {
    $c = $text[$i]
    if ($c -eq '/' -and $i + 1 -lt $n -and $text[$i + 1] -eq '/') { while ($i -lt $n -and $text[$i] -ne "`n") { $i++ }; continue }
    if ($c -eq '/' -and $i + 1 -lt $n -and $text[$i + 1] -eq '*') { $i += 2; while ($i + 1 -lt $n -and -not ($text[$i] -eq '*' -and $text[$i + 1] -eq '/')) { $i++ }; $i += 2; continue }
    if ($c -eq "'" -or $c -eq '"') {
      $q = $c; [void]$sb.Append($q); $i++
      while ($i -lt $n -and $text[$i] -ne $q -and $text[$i] -ne "`n") { if ($text[$i] -eq '\') { $i++ }; $i++ }
      [void]$sb.Append($q); $i++; continue
    }
    if ($c -eq '/' -and $i -gt 0) {
      # regex literal heuristic: previous non-space char is one of ( , = : [ ! & | ? { } ; or start
      $j = $i - 1; while ($j -ge 0 -and ($text[$j] -eq ' ' -or $text[$j] -eq "`t")) { $j-- }
      if ($j -lt 0 -or '(,=:[!&|?{};'.Contains([string]$text[$j]) -or ($j -ge 5 -and $text.Substring($j - 5, 6) -eq 'return')) {
        [void]$sb.Append('/'); $i++
        $inClass = $false
        while ($i -lt $n -and ($text[$i] -ne '/' -or $inClass) -and $text[$i] -ne "`n") {
          if ($text[$i] -eq '\') { $i++ } elseif ($text[$i] -eq '[') { $inClass = $true } elseif ($text[$i] -eq ']') { $inClass = $false }
          $i++
        }
        [void]$sb.Append('/'); $i++
        while ($i -lt $n -and $text[$i] -match '[gimsuy]') { $i++ }
        continue
      }
    }
    [void]$sb.Append($c); $i++
  }
  return $sb.ToString()
}
$bad = 0
$files = Get-ChildItem (Join-Path $Root 'src') -Filter *.js | Sort-Object Name
foreach ($f in $files) {
  $raw = [System.IO.File]::ReadAllText($f.FullName)
  if ($raw -match '[^\x00-\x7F]') { Write-Host ("{0}: non-ASCII character present" -f $f.Name); $bad++ }
  $code = Strip-Code $raw
  $lines = $code -split "`n"
  for ($k = 0; $k -lt $lines.Length; $k++) {
    foreach ($r in $rules) {
      if ($r.Name -eq 'non-ASCII character') { continue }
      if ($lines[$k] -match $r.Rx) { Write-Host ("{0}:{1}: {2}: {3}" -f $f.Name, ($k + 1), $r.Name, $lines[$k].Trim()); $bad++ }
    }
  }
}
if ($bad -eq 0) { Write-Host ("ES3 lint OK ({0} files)" -f $files.Count); exit 0 } else { Write-Host ("ES3 lint: {0} problem(s)" -f $bad); exit 1 }
