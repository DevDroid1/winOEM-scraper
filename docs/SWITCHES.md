# Command-line flags

Flags work on the NT editions (`OEM-Archive-NT5.js`, `OEM-Archive-NT6.js`, or through `OEM-Archive.bat`).
Write them as `/flag` or `/flag:value`. Values with spaces need quotes: `/out:"D:\My Archives"`.

## Choosing how it runs

| Flag | Meaning | Example |
|---|---|---|
| (none) | Open the main menu | `OEM-Archive.bat` |
| `/classic` | Ask the same questions one after another instead of the menu | `OEM-Archive.bat /classic` |
| `/yes` | Take every default without asking. **Only with `/yes` are defaults used silently**; without it, if input ends the script stops | `OEM-Archive.bat /yes /out:D:\ /preset:1` |
| `/nogui` | Use console questions instead of Windows message boxes | `/nogui` |
| `/noelevate` | Do not offer the administrator relaunch (useful in scripts) | `/noelevate` |

Any of `/yes`, `/scan`, `/dryrun`, `/classic`, `/preset`, `/branding`, `/drivers`, `/software` skips the main menu.

## Looking without copying

| Flag | Meaning |
|---|---|
| `/scan` | Detect only and print totals per group. Nothing is copied and no folder is created |
| `/list` | Print every detected item (path, size, confidence reason) |
| `/dryrun` | After you choose what to copy, show exactly what would be copied, skipped by a cap, or not selected. Nothing is written |

```bat
OEM-Archive.bat /scan /list > scan.txt
OEM-Archive.bat /dryrun /preset:6 /out:E:\
```

## Where it goes and what it is called

| Flag | Meaning |
|---|---|
| `/out:<folder>` | Base folder. The archive is `<folder>\OEM Archive\<name>`, or `<folder>\<name>` if the folder is itself called `Archive` or `OEM Archive` |
| `/name:<text>` | Archive folder name (illegal characters are removed). Default: `Maker_Model_WinVer` |
| `/resume` | If the target archive folder already exists, continue into it |
| `/resume:<folder>` | Continue into that exact archive folder. Files already present with the same size are kept |

## What to copy

| Flag | Values | Meaning |
|---|---|---|
| `/preset:` | `1`-`7` | 1 Everything, 2 Branding + drivers + software manifest, 3 Branding only, 4 Drivers only, 5 Software only, 6 FAT32-safe, 7 Custom |
| `/branding:` | `copy` `skip` | Wallpapers, sounds, themes, logos, OOBE, layouts, browser/help, recovery notes |
| `/drivers:` | `full` `manifest` `skip` | `manifest` writes `driver-manifest.csv` only, no package files |
| `/software:` | `all` `manifest` `skip` | `manifest` writes `software-manifest.csv` only, no program files |
| `/postdrivers` | | Also copy OEM-vendor drivers installed **after** setup (off by default) |
| `/postsoftware:off` | | Leave out software installed after setup (on by default because OEM tools keep updating themselves) |
| `/hive` | | Also read wallpaper/theme values from the Default-user registry hive. It is loaded under a temporary key and unloaded again |

## Limits

| Flag | Meaning |
|---|---|
| `/cap:<MB>` | Skip any single file larger than this and list it. `0` = none. Preset 6 uses `4095` (the FAT32 limit) |
| `/totalcap:<GB>` | Stop adding items once the archive would pass this total. `0` = none |

Presets set no limits (except 6). Set them here or on the **Adjust** pages.

## Finishing

| Flag | Meaning |
|---|---|
| `/html` | Write `index.html`: machine summary, per-group counts, links to the reports, picture previews |
| `/zip` | Write `<archive>.zip` next to the archive folder (slow; Windows zip cannot hold files over 4 GB) |
| `/open` | Open the archive folder in Explorer when done |

## Install media

| Flag | Meaning |
|---|---|
| `/baseline:<media>` | `<media>` is an `.iso`, an `install.wim`, a drive letter such as `D:`, a folder, or a `.oemref` sheet. The build is checked first; see [BASELINE.md](BASELINE.md) |
| `/makeref` | With `/baseline:`, write a reference sheet next to the script and stop |
| `/makeref:<folder\|file>` | Same, choosing where the sheet is written |

```bat
OEM-Archive.bat /baseline:D: /makeref
OEM-Archive.bat /baseline:OEM-Reference_Windows-11-Home_10.0.26100.1_x64_Core.oemref
```

## Diagnostics

| Flag | Meaning |
|---|---|
| `/debug` | Print the script engine (JScript/WSH version), host, bitness, arguments, parsed switches, system profile and tools, then trace every command, item, decision, copy, write and error. Saved as `00_Transcript\debug.log`. Contains paths and the serial number |
| `/help` | Print the flag list |

## 9x edition

No flags. Positional arguments: `OEM-Archive-9x.bat [base-folder] [name] [preset]` where preset is `1` Everything,
`2` Branding + drivers + software list, `3` Branding only, `4` Drivers only, `5` Software only. Use `.` as the
base folder for the script's own folder.

## Test-only switches

`/fakefree:<MB>` (pretend the target has this much free space) and `/ignoreos` (run an edition on the wrong
Windows) exist for the test suite. Do not use them for real runs.
