OEM-Archiver 1.0.0
==================
Finds what the PC maker (OEM) added on top of a retail Windows install - branding, wallpapers, sounds,
themes, system-info logo, OOBE pages, Start/taskbar layout, drivers, bundled software, recovery sources -
and copies it into an "OEM Archive" folder with a transcript grouped by category.
It only READS your system; it writes only to the archive folder.

START
  OEM-Archive.bat            picks the right edition for this Windows:
    Windows 95/98/98SE/ME    OEM-Archive-9x.bat  (plain batch)
    Windows 2000/XP/2003     OEM-Archive-NT5.js  (JScript via cscript)
    Windows Vista ... 11     OEM-Archive-NT6.js  (JScript via cscript)
  Keep all the files together. Run as administrator on Vista and newer for complete results
  (the script offers to relaunch itself elevated).

WHAT YOU ARE ASKED (NT5 / NT6 editions)
  1. Folder name:  Maker_Model_WinVer | Maker_Model_Serial | ProductId_OOBEdate | custom
  2. Location:     Same folder as the script | Documents | Downloads | external drive | custom directory
                   Result is <chosen>\OEM Archive\<name>, unless the chosen folder is itself called
                   "Archive" or "OEM Archive" - then it is <chosen>\<name>.
  3. After a read-only scan, what to copy:
        1 Everything   2 Branding + drivers + software manifest   3 Branding only
        4 Drivers only   5 Software only
        6 FAT32-safe: everything, but files of 4 GB or more are skipped and listed (FAT32 sticks
          cannot hold them)   7 Custom (straight to the Adjust pages)
     A preset goes straight to the summary. Choose Adjust there (or preset 7) for the pages:
     Branding (toggle groups), Drivers (full / manifest only / skip), Software (all / manifest only /
     skip) and Limits (per-file and total caps). Presets set no limits except preset 6.
  The scan prints real sizes for each preset so you can compare them.

SWITCHES (NT5/NT6)
  /scan  /list  /name:<text>  /out:<folder>  /preset:1-7  /branding:copy|skip  /drivers:full|manifest|skip
  /software:all|manifest|skip  /cap:<MB>  /totalcap:<GB>  /postdrivers  /postsoftware:off  /hive  /yes  /noelevate  /help
  /yes accepts defaults without asking. Without /yes the script NEVER guesses: if input ends it stops.
9x edition: OEM-Archive-9x.bat [base-folder] [name] [preset 1-5]

OUTPUT
  See STRUCTURE.txt. Open 00_Transcript\transcript.txt (grouped report, evidence and confidence per item)
  and 00_Transcript\file-structure.txt (full tree of the archive).

PRIVACY
  Never archived: oobe\info\userdata.blob, sessionkey.blob, userchoices.xml (customer registration data).
  The product key is never read. Copied answer files that contain keys/passwords are listed in
  system-profile.txt - protect the archive accordingly. The serial number appears in the folder name
  only if you choose the Serial name preset.

LIMITS (please read)
  * Detection is evidence, not proof. HIGH = documented OEM hook; MED/LOW = heuristics (not stock
    Windows, factory-time, vendor name). Compare MED/LOW with a clean install.
  * Tested only on Windows 11 (an HP OEM install), not elevated. The NT5 edition (2000/XP/2003) and the
    9x edition were NOT run on real old Windows; the 9x logic was tested under cmd.exe with a fake tree.
    Windows 2000 needs Windows Script 5.6 or newer.
  * 9x edition cannot compare with stock files, so Media/Wallpaper/Cursors etc. are copied whole and
    marked UNFILTERED; it does not measure sizes or free space. Uses 8.3 short names.
  * Large root recovery/staging folders (system.sav, I386, Options...) follow the Software setting.
  * Copying an installed program folder is not a working backup of that program.

PROGRESS, DRY RUN, RESUME, PACKAGING
  Copy shows a progress bar with percentage, bytes and an estimated time left (estimate from the speed so far).
  /dryrun   walk through the choices and show what WOULD be copied or skipped; nothing is written.
  /resume   (or /resume:<archive folder>) continue into an existing archive; files already present with the
            same size are kept. Without the switch you are asked when the folder already exists.
  At the end you can create index.html (summary + picture previews) and/or a .zip (/html /zip), then open
  the folder in Explorer (/open). The built-in zip is slow and Windows zip cannot hold files over 4 GB.

NOTICE
  For best results run on a fresh or recently installed copy of the OEM image.
  Planned media options (verify against a disc, back up recovery media; see PLAN-next.txt) will show a
  warning when chosen: the media MUST be the same Windows edition AND build; use the disc that came with
  the PC if you have it.

MAIN MENU AND DIALOGS
  Started without switches, the NT editions open a main menu (Name, Location, Scan, Preset, Adjust, Dry
  run, Start copy) showing your current choices. Yes/No questions use real Windows message boxes; /nogui
  keeps them in the console, /classic uses the old step-by-step prompts.
