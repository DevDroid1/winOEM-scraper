# Development

## Layout

```
OEM-Archive.bat        launcher (detects the Windows version)
OEM-Archive-9x.bat     Windows 95/98/98SE/ME edition (plain batch)
OEM-Archive-NT5.js     built file: Windows 2000/XP/2003
OEM-Archive-NT6.js     built file: Windows Vista-11
build.ps1              builds the two .js files from src\ and fixes line endings
src\vendors.js         OEM vendor list, junk SMBIOS strings, staging folder names
src\common.js          shared engine (console, menus, registry/WMI, naming, scanning, baseline, copy, reports)
src\nt5.js, nt6.js     collectors and main for each edition
tests\                 run-tests.ps1, lint-es3.ps1, selftest.js, launcher-dispatch.bat
docs\                  SWITCHES.md, BASELINE.md, DEVELOPMENT.md
```

Edit `src\`, then run `powershell -ExecutionPolicy Bypass -File build.ps1`. The built `.js` files are committed
because they are the deliverables.

## Tests

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests\run-tests.ps1
```

Runs the build, the ES3 lint (including a negative test that must reject modern syntax), the selftests and the
launcher dispatch test (every Windows version -> right script). Set `OEM_NOPAUSE=1` for non-interactive runs.

## Code rules

- **ES3-only JScript.** Old engines (JScript 5.6 on XP) cannot parse arrow functions, `let`/`const`, template
  literals, `Array.forEach/map/indexOf`, `String.trim`, `JSON`, trailing commas, or reserved words as property
  names. `tests\lint-es3.ps1` enforces this. Use the `OA.` helpers (`OA.trim`, `OA.inArray`, ...).
- **ASCII only** in sources.
- **Single-file builds.** Win11 24H2 changed the JScript engine (KB5105752); global state may not carry over
  between scripts, so `.wsf` includes are avoided.
- **No VBScript, no `wmic.exe`.** VBScript is being phased out; WMI is used in-process.
- **FSO dates are opaque `VarDate` on newer engines.** Always convert with `OA.toDate()`.
- **Never guess.** Defaults are only taken silently with `/yes`; if input ends, stop and copy nothing.
- **Read-only on the system.** Anything else (temporary hive load, image mount) must be undone in `finally`.

## Debugging

Run with `/debug`. It prints the engine/WSH versions and traces every command, decision, copy and error, and saves
`00_Transcript\debug.log`.

## Testing hints

- Piped stdin from PowerShell garbles the first line; redirect from an ASCII file via `cmd /c "... < answers.txt"`.
- `/fakefree:<MB>` makes the free-space check think the target is small - a safety net for experiments.
- Never run tests against your real Documents folder: use `/out:<temp folder>`.

## Not yet verified

NT5 edition on real 2000/XP, the 9x edition on real Windows 9x, the `install.wim`/ISO mounts, zip and message
boxes. See the status section in the README.
