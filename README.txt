OEM-Archiver 1.0.0
==================
Finds what the PC maker (OEM) added on top of plain Windows - branding, wallpapers, sounds, themes, logos,
OOBE pages, layouts, drivers, bundled software, recovery sources - and copies it into an "OEM Archive" folder
with a transcript grouped by category. It only READS your system.

NOTICE: for best results run this on a fresh or recently installed copy of Windows.

WHAT IT IS NOT: a backup or restore tool. Nothing is ever restored or changed on the PC, and copying an
installed program folder is not a working backup of that program.

QUICK START
  1. Keep all the files together and run  OEM-Archive.bat
  2. On Vista and newer allow the administrator relaunch when asked.
  3. In the main menu: Location -> Scan -> Preset -> Start copy.
  4. Open 00_Transcript\transcript.txt in the finished archive.
  Unattended:  OEM-Archive.bat /yes /out:D:\ /name:MyPC /preset:2 /noelevate

EDITIONS (OEM-Archive.bat picks the right one)
  Windows 95/98/98SE/ME    OEM-Archive-9x.bat   (batch;  OEM-Archive-9x.bat [base-folder] [name] [preset 1-5])
  Windows 2000/XP/2003     OEM-Archive-NT5.js   (JScript via cscript)
  Windows Vista ... 11     OEM-Archive-NT6.js   (JScript via cscript)

PRESETS  1 Everything | 2 Branding + drivers + software list | 3 Branding only | 4 Drivers only |
         5 Software only | 6 FAT32-safe (skips files of 4 GB or more) | 7 Custom

FLAGS  (write /flag or /flag:value; full list with examples: docs\SWITCHES.md)
  Run:      /yes accept defaults, no questions   /classic prompts instead of the menu   /nogui no message boxes
            /noelevate no administrator relaunch /help
  Look:     /scan detect only   /list print every item   /dryrun show what would be copied
  Target:   /out:<folder>  /name:<text>  /resume  /resume:<archive folder>
  Choose:   /preset:1-7  /branding:copy|skip  /drivers:full|manifest|skip  /software:all|manifest|skip
            /cap:<MB> per-file limit  /totalcap:<GB> total limit  /postdrivers  /postsoftware:off  /hive
  Finish:   /html  /zip  /open
  Media:    /baseline:<iso|install.wim|drive:|sheet.oemref>  /makeref  (docs\BASELINE.md)
  Diagnose: /debug (engine version + full trace, saved as debug.log)

THE MEDIA MUST BE THE SAME WINDOWS EDITION AND BUILD as the PC for the baseline check; use the disc that came
with the system if you have it. The build is checked first and the consequences are explained.

PRIVACY: customer registration data is never archived; the product key is never read; serial number and paths
appear in system-profile.txt and debug.log - review before sharing.

STATUS: tested on Windows 11 only (not elevated). Not run on real Windows 2000/XP/9x; the image/ISO mounts, the
zip step and the message boxes have not been run live. Detection is evidence, not proof: compare MED/LOW items
with a clean install.

MORE: README.md (GitHub version with tables), docs\SWITCHES.md, docs\BASELINE.md, docs\DEVELOPMENT.md,
STRUCTURE.txt, CHANGELOG.md, PLAN-next.txt
