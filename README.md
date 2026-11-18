# OEM-Archiver

Find everything a PC maker (OEM) added on top of plain Windows - branding, wallpapers, sounds, themes, the
system-info logo, OOBE pages, Start/taskbar layout, drivers, bundled software, recovery sources - and copy it
into an **OEM Archive** folder together with a transcript grouped by category.

It **only reads** your system and writes only to the archive folder. Works from Windows 95 to Windows 11 using
three editions of the same tool.

> **Notice:** for best results run this on a fresh or recently installed copy of Windows.

| | |
|---|---|
| **What it is** | An inspection and archiving tool for OEM customisations |
| **What it is not** | A backup or restore tool. Copying an installed program folder is not a working backup of that program, and nothing is ever restored or changed on the PC |
| **Dependencies** | None to install. Windows Script Host (built into Windows 98 and later) and cmd. Optional: DISM (Vista+) for the baseline check |

---

## Quick start

```bat
OEM-Archive.bat
```

1. Keep all files together and run `OEM-Archive.bat` (double-click or from a prompt). It starts the right edition.
2. On Vista and newer, allow the administrator relaunch when asked.
3. In the main menu choose **Location**, then **Scan**, then **Preset**, then **Start copy**.
4. Open `00_Transcript\transcript.txt` in the finished archive to see what was found and why.

Unattended example (no questions):

```bat
OEM-Archive.bat /yes /out:D:\ /name:MyPC /preset:2 /noelevate
```

## Editions

| Windows version | Script | Engine |
|---|---|---|
| 95 / 98 / 98 SE / ME | `OEM-Archive-9x.bat` | plain batch (`command.com`) |
| 2000 / XP / Server 2003 | `OEM-Archive-NT5.js` | JScript via `cscript` (Windows 2000 needs Windows Script 5.6+) |
| Vista / 7 / 8 / 8.1 / 10 / 11 | `OEM-Archive-NT6.js` | JScript via `cscript` |
| NT 4.0 | not supported | |

## Feature support by Windows version*

| Feature | 95/98/ME | 2000 | XP/2003 | Vista/7 | 8/8.1 | 10/11 |
|---|---|---|---|---|---|---|
| Edition used | 9x batch | NT5 | NT5 | NT6 | NT6 | NT6 |
| Main menu (TUI) | no (numbered `choice` menus) | yes | yes | yes | yes | yes |
| Stock-vs-OEM detection | folder copy, marked UNFILTERED | layout.inf | layout.inf + dllcache | owner + WinSxS link | owner + WinSxS link | owner + WinSxS link |
| Baseline from `install.wim` (DISM, admin) | no | no | no | yes | yes | yes |
| Baseline from XP setup media (names only) | no | yes | yes | yes | yes | yes |
| Import a `.oemref` reference sheet | no | yes | yes | yes | yes | yes |
| Mount an ISO (native) | no | no | no | no | yes | yes |
| Mount an ISO (Daemon Tools, if installed) | no | version dependent | version dependent | version dependent | version dependent | version dependent |
| Windows message boxes for Yes/No | no | yes | yes | yes | yes | yes |
| Administrator relaunch (UAC) | no | no | no | yes | yes | yes |
| Fast copy tool | xcopy | xcopy | xcopy | robocopy | robocopy | robocopy |
| Progress bar and time estimate | no | yes | yes | yes | yes | yes |
| Zip / `index.html` at the end | no | no | zip yes | yes | yes | yes |
| `/debug` trace | no | yes | yes | yes | yes | yes |

<sub>\* **Status:** tested only on Windows 11 (an HP OEM install), not elevated. The 2000/XP and 9x editions have never been run on real old Windows, and the image mount, ISO mount, zip and message-box steps have not been run live. See [Status and limits](#status-and-limits).</sub>

## Main menu

```
======================================================================
 OEM-Archiver 1.0.0   HP / HP OmniBook 5 Laptop   Win11 26H2
----------------------------------------------------------------------
 Name     : HP_OmniBook-5-Laptop_Win11-26H2
 Baseline : none (heuristics only)
 Location : D:\
 Scan     : done, 186 items detected
 Choices  : Branding: copy | Drivers: full | Software: all | Per-file cap: none
======================================================================
Main menu
  1) Name   2) Location   3) Scan this PC   4) Preset   5) Adjust
  6) Baseline   7) Dry run   8) Start copy   9) Quit
```

### Presets

| # | Preset | Copies |
|---|---|---|
| 1 | Everything | branding, drivers, software |
| 2 | Branding + drivers, software manifest | like 1 but software is only listed in a CSV |
| 3 | Branding only | wallpapers, sounds, themes, logos, OOBE, layouts, ... |
| 4 | Drivers only | driver packages and a driver manifest |
| 5 | Software only | program folders, staged installers, software manifest |
| 6 | FAT32-safe | everything, but any file of 4 GB or more is skipped and listed (FAT32 cannot store it) |
| 7 | Custom | straight to the Adjust pages |

The scan prints real sizes for each preset. **Adjust** has pages for branding groups, drivers (full / manifest only /
skip), software (all / manifest only / skip) and limits (per-file and total caps). Presets set no limits except 6.

### Where the archive goes

`<chosen folder>\OEM Archive\<name>` - unless the chosen folder is itself named `Archive` or `OEM Archive`, in
which case it is `<chosen folder>\<name>`. Location options: same folder as the script, Documents, Downloads,
an external drive, or a custom directory.

## Command-line flags explained

Every flag is optional. Write them as `/flag` or `/flag:value` (quote values with spaces). Any of `/yes`, `/scan`, `/dryrun`, `/classic`, `/preset`, `/branding`, `/drivers`, `/software` skips the main menu. More detail and examples: [docs/SWITCHES.md](docs/SWITCHES.md).

| Flag | What it does |
|---|---|
| `/scan` | Look only. Detect and report, copy nothing |
| `/list` | With `/scan` (or always): print every detected item |
| `/dryrun` | Walk through your choices and show what **would** be copied or skipped. Writes nothing |
| `/resume` `/resume:<folder>` | Continue into an existing archive; files already there with the same size are kept |
| `/yes` | Accept every default without asking. Without it, if input ends the script stops and copies nothing |
| `/classic` | Old step-by-step prompts instead of the main menu |
| `/nogui` | Keep Yes/No questions in the console (no Windows message boxes) |
| `/noelevate` | Do not offer the administrator relaunch |
| `/name:<text>` | Archive folder name |
| `/out:<folder>` | Base folder for the archive (nesting rule above) |
| `/preset:1-7` | Choose a preset without the menu |
| `/branding:copy\|skip` `/drivers:full\|manifest\|skip` `/software:all\|manifest\|skip` | Per-category choice |
| `/cap:<MB>` `/totalcap:<GB>` | Skip files over a size / stop adding items past a total. `0` = no limit |
| `/postdrivers` `/postsoftware:off` | Include drivers installed after setup / leave out software installed after setup |
| `/hive` | Also read the Default-user hive (it is loaded and unloaded again) |
| `/html` `/zip` `/open` | At the end: write `index.html`, write a `.zip`, open the folder in Explorer |
| `/baseline:<media>` | Verify against install media: an ISO, `install.wim`, a drive letter, or a `.oemref` sheet |
| `/makeref[:<folder\|file>]` | With `/baseline:` write a portable reference sheet and stop |
| `/debug` | Print the script engine version and trace everything; saved as `debug.log` |
| `/help` | Show the flag list |

### Examples

```bat
:: look only, save the list of everything found
OEM-Archive.bat /scan /list > scan.txt

:: see what preset 6 would do on a FAT32 stick, without writing anything
OEM-Archive.bat /dryrun /preset:6 /out:E:\

:: branding only, no questions, then open the result
OEM-Archive.bat /yes /preset:3 /out:D:\ /name:MyPC /noelevate /open

:: drivers as a list only, software skipped, files over 500 MB left out
OEM-Archive.bat /yes /branding:copy /drivers:manifest /software:skip /cap:500 /out:D:\

:: continue an interrupted run
OEM-Archive.bat /resume:"D:\OEM Archive\MyPC" /preset:1

:: verify against the Windows disc, then reuse the sheet on another PC
OEM-Archive.bat /baseline:D: /makeref
OEM-Archive.bat /baseline:OEM-Reference_Windows-11-Home_10.0.26100.1_x64_Core.oemref

:: something odd? trace everything
OEM-Archive.bat /debug
```

The 9x edition takes positional arguments instead: `OEM-Archive-9x.bat [base-folder] [name] [preset 1-5]`
(use `.` for the script's own folder).

## Baseline check

Compares what is installed with Windows install media, **by path and size (no hashes)**, so stock files and inbox
drivers are told apart from OEM additions with higher confidence.

> **The media must be the same Windows edition AND the same build as this PC.** Use the disc that came with the
> system if you have it.

The build is verified **before anything is mounted**:

| Result | What happens |
|---|---|
| Exact match | proceeds |
| Same build, other update revision or edition | explains the small effect; default answer **Yes** |
| Different build | explains that stock files will look like OEM replacements and drivers will look "not on media"; every result is marked one confidence level lower; default answer **No** |
| Wrong architecture | refused |

Details, ISO tools (native, Daemon Tools, ImgBurn), and **reference sheets** (`.oemref`, made on one PC and used
on another, XP included) are in [docs/BASELINE.md](docs/BASELINE.md).

## Output

```
<archive>\
  00_Transcript\   transcript.txt  file-structure.txt  manifest.csv  system-profile.txt  skipped-and-errors.txt
                   registry\*.reg   (debug.log with /debug)
  01_Branding_SystemInfo ... 10_Browser_Help_Support
  11_Drivers\      driver-manifest.csv  Factory\  PostDelivery-OEMVendor\  Staged\
  12_Software\     software-manifest.csv  ProgramFolders\  StagedInstallers\
  13_Recovery_Setup_Sources   14_Other
```

See [STRUCTURE.txt](STRUCTURE.txt) for the full tree. Every item in the transcript carries a confidence level:
**HIGH** documented OEM hook or confirmed against media, **MED/LOW** heuristics.

## Privacy

- Never archived: `oobe\info\userdata.blob`, `sessionkey.blob`, `userchoices.xml` (customer registration data).
- The product key is never read. Copied answer files that contain keys or passwords are listed in
  `system-profile.txt` - protect the archive accordingly.
- The serial number appears in the folder name only if you choose that preset, and in `system-profile.txt` and
  `debug.log`. Review those before sharing.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Not running as administrator" | Allow the relaunch. Some folders (`C:\Recovery`, driver store) and the `install.wim` check need it |
| A message box does not show / seems stuck on a question | Run with `/nogui` |
| It stops and says nothing was copied | Input ended. Use `/yes` with `/out:` `/name:` `/preset:` |
| Image mount left over after a crash | `dism /Cleanup-Wim`, delete `%TEMP%\oa-baseline-*` |
| Anything odd | Run again with `/debug` and read `00_Transcript\debug.log` |

## Status and limits

- Detection is **evidence, not proof**. Compare MED and LOW items with a clean install.
- Tested on Windows 11 only, not elevated. Not run on real old Windows (2000/XP/9x). Not run live: the
  `install.wim` mount, ISO mounts, the zip step and message boxes.
- The 9x edition cannot compare with stock files, so folders like Media and Wallpaper are copied whole and marked
  UNFILTERED; it does not measure sizes or free space.
- Large root recovery/staging folders (`system.sav`, `I386`, `Options`) follow the Software setting.
- Planned, not built: recovery-media backup / disc to ISO, dedicated Microsoft (Surface) handling.

## More

- [docs/SWITCHES.md](docs/SWITCHES.md) - every flag with examples
- [docs/BASELINE.md](docs/BASELINE.md) - install-media check and reference sheets
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - building, tests, code rules
- [CHANGELOG.md](CHANGELOG.md) - what changed
- [PLAN-next.txt](PLAN-next.txt) - outline of the remaining features
