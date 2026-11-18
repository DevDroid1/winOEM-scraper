OEM-Archiver 1.0.0
==================
Finds what the PC maker (OEM) added on top of a plain Windows install - branding, wallpapers, sounds, themes,
system-info logo, OOBE pages, Start/taskbar layout, drivers, bundled software, recovery sources - and copies
it into an "OEM Archive" folder with a transcript grouped by category.
It only READS your system; it writes only to the archive folder (and, for the optional baseline check, a
temporary read-only image mount that is removed again).

NOTICE
  For best results run this on a fresh or recently installed copy of Windows.

QUICK START
  1. Keep all the files together and run  OEM-Archive.bat  (double-click or from a command prompt).
  2. On Windows Vista and newer, allow the administrator relaunch when asked (more folders become readable).
  3. Use the main menu: Location -> Scan -> Preset -> Start copy. Open the finished archive's
     00_Transcript\transcript.txt to see what was found and why.

EDITIONS (OEM-Archive.bat picks the right one)
  Windows 95/98/98SE/ME    OEM-Archive-9x.bat   plain batch, short list of known OEM places
  Windows 2000/XP/2003     OEM-Archive-NT5.js   JScript via cscript (needs Windows Script 5.6+ on 2000)
  Windows Vista ... 11     OEM-Archive-NT6.js   JScript via cscript
  Windows NT 4.0 is not supported.

MAIN MENU (NT editions, when started without selection switches)
  Name | Location | Scan | Preset | Adjust | Baseline | Dry run | Start copy | Quit
  A summary of your current choices is shown above every menu. Type the number and press Enter.
  Yes/No questions use real Windows message boxes (/nogui keeps them in the console). /classic uses the older
  step-by-step prompts instead of the menu.

CHOICES
  Folder name:  Maker_Model_WinVer | Maker_Model_Serial | ProductId_OOBEdate | custom
  Location:     Same folder as the script | Documents | Downloads | external drive | custom directory
                Result is <chosen>\OEM Archive\<name>, unless the chosen folder is itself called "Archive" or
                "OEM Archive" - then it is <chosen>\<name>.
  Preset (the scan shows real sizes for each):
        1 Everything                       2 Branding + drivers + software manifest only
        3 Branding only                    4 Drivers only                5 Software only
        6 FAT32-safe: everything, but files of 4 GB or more are skipped and listed
        7 Custom (goes straight to the Adjust pages)
  Adjust pages: Branding (toggle groups), Drivers (full / manifest only / skip), Software (all / manifest only /
        skip), Limits (per-file cap, total cap). Presets set no limits except preset 6.

SWITCHES (NT editions)
  Run and choose
    /scan                scan only, copy nothing            /list        also print every detected item
    /dryrun              show what WOULD be copied/skipped  /resume[:<archive folder>]  continue an archive
    /yes                 accept defaults, no questions      /classic     step-by-step prompts, no menu
    /nogui               no Windows message boxes           /noelevate   do not offer the administrator relaunch
    /name:<text>         archive folder name                /out:<folder>  base folder (nesting rule applies)
    /preset:1-7          choose a preset                    /cap:<MB>    per-file cap     /totalcap:<GB>  total cap
    /branding:copy|skip  /drivers:full|manifest|skip  /software:all|manifest|skip
    /postdrivers         include post-delivery OEM drivers  /postsoftware:off  leave out software installed after OOBE
    /hive                also read the Default-user hive (loaded and unloaded again)
  Finishing:  /html (index.html summary)   /zip (zip file)   /open (open the folder in Explorer)
  Media:      /baseline:<iso | install.wim | drive: | sheet.oemref>     /makeref[:<folder|file>]
  Diagnostics:/debug   /help
  Without /yes the script NEVER guesses: if input ends it stops and copies nothing.
  9x edition: OEM-Archive-9x.bat [base-folder] [name] [preset 1-5]   (use . for the script's own folder)

BASELINE CHECK (verify against Windows install media)
  Compares what is installed with the media, by path and size (no hashes), so stock Windows files and inbox
  drivers are told apart from OEM additions with higher confidence. Choose "Baseline" in the menu or use
  /baseline:<media>.  IMPORTANT: the media MUST be the same Windows edition AND build as this PC; use the disc
  that came with the system if you have it. The script checks this BEFORE doing anything:
     exact match          proceeds
     same build, other update revision or edition   explains the small effect, default answer Yes
     different build      explains that stock files will look like OEM replacements and drivers will look
                          "not on media"; every result is marked one confidence level lower; default answer No
     wrong architecture   refused
  Vista and newer media (install.wim): needs administrator rights and DISM; the image is mounted read-only into
  a temporary folder and unmounted again. install.esd cannot be used (use media with install.wim).
  ISO files are mounted with Windows' own mount (Windows 8+) or Daemon Tools if it is installed (found
  automatically; its command line differs between versions - if no drive appears, mount the ISO yourself and
  give the drive letter). ImgBurn is detected but only matters for the planned recovery-media backup.
  Windows 2000/XP/2003 setup media (the i386 folder) is readable on ANY Windows without DISM or admin; it
  gives file NAMES only (no sizes).
  Microsoft devices (e.g. Surface): Microsoft is both OS vendor and OEM, so publisher-based detection is
  switched off and a note is shown. Dedicated handling is planned.

REFERENCE SHEETS (.oemref)
  A portable text export of a baseline. Create on a Vista-or-newer PC:
      OEM-Archive.bat /baseline:<ISO | install.wim | drive:> /makeref
  It writes OEM-Reference_<name>_<version>_<arch>.oemref next to the script and stops. Copy the sheet to any
  other PC (XP included) and use it there:
      OEM-Archive.bat /baseline:<sheet.oemref>
  The build/edition/architecture check runs again on the importing PC. Sheets hold only path, size and name
  lists - no hashes, no file contents. The same /makeref works on XP setup media.

PROGRESS, DRY RUN, RESUME, PACKAGING
  Copying shows a progress bar with percentage, bytes and an estimated time left (a rough estimate from the
  speed so far). /dryrun shows the plan without writing. /resume keeps files already present with the same
  size. At the end you can create index.html (summary with picture previews) and/or a .zip, then open the
  folder in Explorer. The built-in zip is slow and Windows zip cannot hold files over 4 GB.

OUTPUT
  See STRUCTURE.txt. The important files:
    00_Transcript\transcript.txt       grouped report, evidence and confidence for every item
    00_Transcript\file-structure.txt   full tree of the archive
    00_Transcript\manifest.csv         every item with source, destination, size, dates, status
    00_Transcript\system-profile.txt   PC, Windows, baseline and options used
    00_Transcript\debug.log            only with /debug

PRIVACY
  Never archived: oobe\info\userdata.blob, sessionkey.blob, userchoices.xml (customer registration data).
  The product key is never read. Copied answer files that contain keys or passwords are listed in
  system-profile.txt - protect the archive accordingly. The serial number appears in the folder name only if
  you choose the Serial name preset, and in system-profile.txt and debug.log.

TROUBLESHOOTING
  - "Not running as administrator": allow the relaunch, or some OEM folders (C:\Recovery, driver store) are
    unreadable. The baseline check on install.wim requires it.
  - A message box does not appear / the script seems stuck on a question: run with /nogui.
  - Nothing is copied and it just stops: input ended (redirected or closed). Use /yes with /out: /name: /preset:.
  - Baseline mount left behind after a crash: run  dism /Cleanup-Wim  and delete %TEMP%\oa-baseline-*.
  - Something looks wrong: run again with /debug and read 00_Transcript\debug.log (it shows the script engine
    version, every command and every decision).

STATUS AND LIMITS (please read)
  * Detection is evidence, not proof. HIGH = documented OEM hook or confirmed against media; MED/LOW =
    heuristics (not stock Windows, factory-time, vendor name). Compare MED/LOW with a clean install.
  * Tested on Windows 11 only (an HP OEM install), not elevated. NOT run on real old Windows: the NT5 edition
    (2000/XP/2003) and the 9x edition (the 9x logic was only tested under cmd.exe with a fake tree).
    NOT run live: the install.wim mount, the ISO mount (native and Daemon Tools), the zip step, the message boxes.
  * 9x edition cannot compare with stock files, so Media/Wallpaper/Cursors etc. are copied whole and marked
    UNFILTERED; it does not measure sizes or free space and uses 8.3 short names.
  * Large root recovery/staging folders (system.sav, I386, Options...) follow the Software setting.
  * Copying an installed program folder is not a working backup of that program.
  * Planned, not built: backup of recovery media / disc to ISO (ImgBurn), Microsoft/Surface handling.

DEVELOPMENT
  src\  vendors.js, common.js, nt5.js, nt6.js  ->  build.ps1 builds the two .js editions (single files on
  purpose: Win11's JScript engine change makes multi-file includes unreliable). Code must stay ES3-only.
  tests\run-tests.ps1 runs build, the ES3 lint (with a negative test), the selftests and the launcher
  dispatch test. PLAN-next.txt holds the outline of the remaining features. The project is a git repository.
