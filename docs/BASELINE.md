# Baseline check and reference sheets

The baseline check compares what is installed with Windows **install media**, by **path and size** (no hashes), so
stock files and inbox drivers can be told apart from OEM additions with higher confidence. Without it the tool
relies on heuristics (file owner, WinSxS hard links, `layout.inf`, creation time, vendor names).

> **The media must be the same Windows edition AND the same build as the PC.** Use the disc that came with the
> system if you have it. A warning with this text is shown whenever you choose a media option.

## Build verification (before anything happens)

DISM reads the image list (no mount yet) and the tool compares architecture, version/build, update revision and
edition with this PC, then tells you the result and what would happen if you continued:

| Result | Consequence shown | Default answer |
|---|---|---|
| Exact match | none | continue |
| Same build, different **update revision** | files serviced by cumulative updates differ in size; treated as "updated stock" when Windows owns them, so the effect is small | Yes |
| Same build, different **edition** | editions share most files; a few edition-specific items may show as "not on media" | Yes |
| Different **build** | Windows changes many files and drivers between builds: changed stock files look like OEM replacements, newer inbox drivers look "not on media", real OEM changes can be hidden. Every result is marked one confidence level lower | **No** |
| Wrong **architecture** | nothing would match | refused |

With `/yes` a non-exact match is only accepted where the default is Yes.

## What changes with a baseline

- **Files** (wallpapers, media, cursors, themes, screen savers, lock screen images):
  - same path and size on the media -> stock
  - path on the media but size differs, Windows owns it -> stock, updated
  - path on the media but size differs, Windows does not own it -> **replaced by the OEM** (HIGH)
  - path not on the media, Windows does not own it -> **OEM** (HIGH)
- **Drivers:** every installed third-party driver is tagged in `driver-manifest.csv`: *INF name also on media*
  (an OEM-supplied or newer version of a Windows driver; MED) or *not on media* (HIGH).
- **Reports:** the baseline source and verdict are written into the transcript and `system-profile.txt`.

## Media types

| Media | Needs | Detail |
|---|---|---|
| `install.wim` (Vista and newer) | Vista+ PC, administrator, DISM | Mounted **read-only** into `%TEMP%\oa-baseline-*` and unmounted with discard. Only the relevant folders are read |
| ISO file | as above, plus a way to mount | Windows' own mount (Windows 8+ via PowerShell), or **Daemon Tools** if found. It is dismounted when the check ends. ImgBurn is detected but cannot mount |
| Drive letter / folder | | Point at the mounted media, e.g. `D:` |
| `install.esd` | | Not supported (DISM cannot mount ESD read-only). Use media with `install.wim` |
| XP-era setup media (`i386`) | nothing | Readable on **any** Windows without DISM or admin. File **names only** (no sizes) from `layout.inf` and the `.cab` lists |
| `.oemref` reference sheet | nothing | See below |

Daemon Tools' command line changed between versions. The tool tries `DTAgent.exe -mount ide, 0, "<iso>"` and waits
for a new drive; if none appears it asks you to mount the ISO yourself and give the drive letter.

## Reference sheets (`.oemref`)

A reference sheet is a portable text export of a baseline. Make it once on a Vista-or-newer PC and use it on any
other PC - including Windows XP, which has no DISM.

```bat
:: on a Vista+ PC, as administrator
OEM-Archive.bat /baseline:D: /makeref
:: copy OEM-Reference_*.oemref to the other PC, then
OEM-Archive.bat /baseline:OEM-Reference_Windows-11-Home_10.0.26100.1_x64_Core.oemref
```

- The sheet records the media's version, update revision, edition and architecture, plus path+size lists and
  inbox INF names. No hashes, no file contents.
- The importing PC runs the **same build verification** against the recorded build before using it.
- Sheets from XP setup media hold names only.
- Tab-separated lines: `meta<TAB>key<TAB>value`, `F<TAB>path<TAB>size`, `I<TAB>inf name`, `N<TAB>file name`.

## Microsoft devices (Surface)

Microsoft is both the OS vendor and the OEM, so publisher-based detection is switched off for these PCs and a
note is shown and recorded. The baseline check becomes the main signal. Dedicated handling is planned.

## Limits

- Needs matching media; a different build gives lower-confidence results (and says so).
- The `install.wim` mount, ISO mounts and Daemon Tools step have not been run live yet (tested logic only:
  build comparison, confidence lowering, path/size decisions, sheet round trip).
- Windows XP and older only get name-based comparison.
