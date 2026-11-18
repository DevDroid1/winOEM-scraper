# Changelog

## 1.0.0 - 2026-11-18

First version.

### Editions
- Launcher `OEM-Archive.bat`; plain-batch edition for Windows 95/98/98 SE/ME; JScript editions for
  Windows 2000/XP/2003 and Vista-11.

### Detection and archive
- Collectors for branding, boot/logon/lock, wallpapers, themes, sounds, cursors/screen savers, account pictures,
  OOBE/setup, Start/taskbar/desktop, browser/help, drivers, software, recovery/setup sources.
- Evidence ladder with confidence levels (documented hooks, vendor fingerprints, "not stock" tests, factory vs
  post-delivery time window). Privacy exclusions for customer registration data.
- Transcript grouped by category, `manifest.csv`, driver and software manifests, `system-profile.txt`,
  registry exports, `file-structure.txt`.

### Using it
- Main menu with live summary; classic step-by-step mode.
- Name presets; location menu including "same folder as the script"; nesting rule for `Archive` / `OEM Archive`.
- Presets: Everything, Branding + drivers + software manifest, Branding only, Drivers only, Software only,
  FAT32-safe, Custom. Adjust pages with per-file and total limits (presets set none, except FAT32-safe).
- Progress bar with percentage and time estimate, `/dryrun`, `/resume`, `index.html`, `.zip`, open in Explorer.
- Native Windows Yes/No message boxes (`/nogui` to disable).

### Baseline
- Verify against install media (`install.wim`, ISO, drive, XP `i386`) with build verification before anything is
  mounted and consequences explained. Windows' own ISO mount and Daemon Tools detection.
- Portable reference sheets (`.oemref`) created with `/makeref` and imported with `/baseline:<sheet>`.
- Microsoft/Surface: publisher-based detection disabled with a note (dedicated handling planned).

### Diagnostics
- `/debug`: engine and WSH version, environment, full trace, saved as `debug.log`.

### Known gaps
- Not run on real Windows 2000/XP/9x; image and ISO mounts, zip and message boxes not run live.
- Recovery-media backup / disc to ISO not built.
