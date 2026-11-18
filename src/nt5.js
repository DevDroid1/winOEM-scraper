
// ===== nt5.js : Windows 2000 / XP / Server 2003 collectors + main =====
// Written to the Windows OPK / Winbom / OOBE documentation for this era. NOT run on a real XP machine by the
// author: every stock-vs-OEM decision here is MED/LOW evidence - compare against a clean install.
OA.tier = 'NT5';

OA.nt5Dirs = function () {
  var P = OA.profile;
  P.allUsers = OA.expand('%ALLUSERSPROFILE%');
  P.allUsersApp = P.allUsers + '\\Application Data';
  P.defUser = OA.defaultProfile();
  P.oobeDir = P.sys32 + '\\oobe';
};
// Names of files a driver INF installs ([SourceDisksFiles] entries)
OA.infFileNames = function (path) {
  var lines = OA.readText(path).split('\n'), i, ln, m, inSec = false, out = [];
  for (i = 0; i < lines.length; i++) {
    ln = OA.trim(lines[i].replace(/;.*$/, ''));
    if (ln === '') { continue; }
    if (ln.charAt(0) === '[') { inSec = /^\[sourcedisksfiles/i.test(ln); continue; }
    if (!inSec) { continue; }
    m = /^"?([^"=]+?)"?\s*=/.exec(ln);
    if (m) { out.push(OA.trim(m[1])); }
  }
  return out;
};

OA.col01n = function () {   // Branding / system info
  var P = OA.profile, ini, names, i, t, ow;
  OA.checkFile('01', P.sys32 + '\\OEMINFO.INI', 'OEM support information (System Properties > General, Support Information button)', 'HIGH');
  OA.checkFile('01', P.sys32 + '\\OEMLOGO.BMP', 'OEM logo shown in System Properties', 'HIGH');
  if (OA.fileExists(P.sys32 + '\\OEMINFO.INI')) {
    ini = OA.readIni(P.sys32 + '\\OEMINFO.INI');
    if (ini.general && ini.general.logo) { OA.checkFile('01', OA.expand(ini.general.logo), 'logo file named in OEMINFO.INI', 'HIGH'); }
    if (ini.general && ini.general.localfile) { OA.checkFile('01', OA.expand(ini.general.localfile), 'support page named by OEMINFO.INI LocalFile', 'HIGH'); }
  }
  names = ['OEMBIOS.BIN', 'OEMBIOS.DAT', 'OEMBIOS.SIG'];
  for (i = 0; i < names.length; i++) { OA.checkFile('01', P.sys32 + '\\' + names[i], 'OEM pre-activation (SLP) file: identifies the OEM licence', 'HIGH'); }
  OA.checkFile('01', P.sys32 + '\\CatRoot\\{F750E6C3-38EE-11D1-85E5-00C04FC295EE}\\OEMBIOS.CAT', 'OEM pre-activation catalog', 'HIGH');
  ow = 'RegisteredOwner = ' + OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\RegisteredOwner') + '\r\nRegisteredOrganization = ' + OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\RegisteredOrganization');
  OA.addNote('01', 'RegisteredOwner-Organization', ow, 'values OEMs often pre-fill (may be the end user\'s own name on a used machine)', 'LOW');
};

OA.col02n = function () {   // Boot / logon
  OA.addReg('02', 'HKU\\.DEFAULT\\Control Panel\\Desktop', 'DefaultUser-Desktop', 'logon-screen desktop settings (.DEFAULT profile)');
  OA.addReg('02', 'HKU\\.DEFAULT\\Software\\Microsoft\\Windows\\CurrentVersion\\ThemeManager', 'DefaultUser-ThemeManager', 'visual style used by the logon screen');
  OA.nothing('02', 'XP/2000 have no documented OEM boot-screen file; the boot bitmap is inside ntoskrnl.exe (compare its hash with a clean install)');
};

OA.col03n = function () {   // Wallpapers
  var P = OA.profile, dp = P.defUser, r, txt;
  OA.scanStockDir('03', P.windir + '\\Web\\Wallpaper', { why: 'wallpaper' });
  OA.scanStockDir('03', P.windir, { flat: true, rx: /\.(bmp|jpe?g|gif|png)$/i, why: 'picture in the Windows folder', conf: 'LOW' });
  OA.checkFile('03', dp + '\\NTUSER.DAT', 'Default User registry hive: holds the default wallpaper/theme settings new users inherit', 'MED');
  OA.addReg('03', 'HKU\\.DEFAULT\\Control Panel\\Desktop', 'DefaultUser-Desktop-wallpaper', 'default wallpaper values (Wallpaper / OriginalWallpaper)');
  if (OA.args.hive && OA.fileExists(dp + '\\NTUSER.DAT')) {
    if (OA.run('reg load HKU\\OEMARCH_DEF "' + dp + '\\NTUSER.DAT"') === 0) {
      try { r = OA.exec('reg query "HKU\\OEMARCH_DEF\\Control Panel\\Desktop" /v Wallpaper'); txt = r.out; OA.addNote('03', 'DefaultUser-hive-values', txt, 'wallpaper read from the Default User hive', 'HIGH'); }
      finally { OA.run('reg unload HKU\\OEMARCH_DEF'); }
    } else { OA.err('hive', 'could not load the Default User hive'); }
  }
};

OA.col04n = function () {   // Themes
  var P = OA.profile;
  OA.scanStockDir('04', P.windir + '\\Resources\\Themes', { why: 'theme / visual style' });
  OA.scanStockDir('04', P.windir + '\\Resources', { flat: true, why: 'loose theme file' });
  OA.addReg('04', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes', 'Themes', 'theme defaults (InstallTheme)');
  OA.addReg('04', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\ThemeManager', 'ThemeManager-HKLM', 'theme manager defaults');
};

OA.col05n = function () { OA.scanStockDir('05', OA.profile.windir + '\\Media', { why: 'sound file' }); };

OA.col06n = function () {
  var P = OA.profile;
  OA.scanStockDir('06', P.windir + '\\Cursors', { why: 'cursor' });
  OA.scanStockDir('06', P.sys32, { flat: true, rx: /\.scr$/i, why: 'screen saver' });
};

OA.col07n = function () {
  var d = OA.profile.allUsersApp + '\\Microsoft\\User Account Pictures', n;
  n = OA.scanStockDir('07', d + '\\Default Pictures', { why: 'account picture', conf: 'LOW', rx: /\.(bmp|jpe?g|png|gif)$/i });
  if (n) { OA.addNote('07', 'account-pictures-caution', 'Windows also ships its own default account pictures. These are LOW confidence; compare with a clean install.', 'caution', 'LOW'); }
};

OA.col08n = function () {   // OOBE / setup / unattend
  var P = OA.profile, ini, sec, k, v, cands, i, secs, txt, lines, ln, keep = '', inKeep = false, files = ['winbom.ini', 'sysprep.inf'], j;
  if (OA.fileExists(P.oobeDir + '\\oobeinfo.ini')) {
    OA.addFile('08', P.oobeDir + '\\oobeinfo.ini', 'OEM OOBE (Windows Welcome) customization file', 'HIGH');
    ini = OA.readIni(P.oobeDir + '\\oobeinfo.ini');
    secs = ['branding', 'oemhardwaretutorial', 'oemregistrationpage', 'options', 'startupoptions', 'signups', 'desktopreminders'];
    for (i = 0; i < secs.length; i++) {
      sec = ini[secs[i]];
      if (!sec) { continue; }
      for (k in sec) {
        v = sec[k];
        if (!/\.[A-Za-z0-9]{2,4}$/.test(v) || /^https?:/i.test(v)) { continue; }
        cands = [v, P.oobeDir + '\\' + v, P.oobeDir + '\\html\\oem\\' + v, P.oobeDir + '\\images\\' + v, P.sys32 + '\\' + v];
        for (j = 0; j < cands.length; j++) { if (/^[A-Za-z]:\\/.test(cands[j]) && OA.fileExists(cands[j])) { OA.addFile('08', cands[j], 'file referenced by oobeinfo.ini [' + secs[i] + '] ' + k, 'HIGH'); break; } }
      }
    }
  } else { OA.nothing('08', 'file not present: ' + P.oobeDir + '\\oobeinfo.ini'); }
  OA.checkTree('08', P.oobeDir + '\\html\\oem', 'OEM pages shown by Windows Welcome (location is from secondary sources: unconfirmed)', 'MED');
  // answer file Windows keeps after setup: copy it and show the OEM-relevant sections with secrets masked
  if (OA.fileExists(P.sys32 + '\\$winnt$.inf')) {
    OA.addFile('08', P.sys32 + '\\$winnt$.inf', 'final answer file kept by Windows setup (may contain a product key: see system-profile.txt)', 'HIGH');
    lines = OA.readText(P.sys32 + '\\$winnt$.inf').split('\n');
    for (i = 0; i < lines.length; i++) {
      ln = OA.trim(lines[i]);
      if (ln.charAt(0) === '[') { inKeep = /^\[(oem_ads|branding|url|shell|unattended|oembranding|oemdata)\]/i.test(ln); }
      if (inKeep) { keep += ln + '\r\n'; }
    }
    OA.addNote('08', 'winnt-inf-oem-sections', OA.maskSecrets(keep), 'OEM-related sections of $winnt$.inf (secrets masked)', 'HIGH');
  } else { OA.nothing('08', 'file not present: ' + P.sys32 + '\\$winnt$.inf'); }
  for (i = 0; i < files.length; i++) {
    OA.checkFile('08', P.sysdrive + '\\Sysprep\\' + files[i], 'Sysprep / factory-mode answer file', 'HIGH');
    OA.checkFile('08', P.sys32 + '\\sysprep\\' + files[i], 'Sysprep / factory-mode answer file', 'HIGH');
    OA.checkFile('08', P.sys32 + '\\' + files[i], 'Sysprep / factory-mode answer file', 'HIGH');
  }
  OA.checkTree('08', P.windir + '\\Setup\\Scripts', 'setup scripts', 'MED');
};

OA.col09n = function () {   // Start / desktop
  var P = OA.profile, subs, i, f, spDir, t;
  OA.addDesktopItems(P.allUsers + '\\Desktop', 'All Users desktop');
  OA.addDesktopItems(P.defUser + '\\Desktop', 'Default User desktop');
  spDir = P.allUsers + '\\Start Menu\\Programs';
  subs = OA.subDirs(spDir);
  for (i = 0; i < subs.length; i++) { f = subs[i]; if (OA.vendorFolder(f.Name)) { OA.addTree('09', f.Path, 'Start menu folder named for the OEM', 'MED'); } }
  OA.addReg('09', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\SMDEn', 'SMDEn-StartMenu-OEM', 'Start-menu OEM slots (OEM0-OEM3)');
  t = OA.regStr('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\Start_ShowOEMLink');
  if (t !== '') { OA.addNote('09', 'Start_ShowOEMLink', 'Start_ShowOEMLink = ' + t + '  (current user; XP "OEM link" in the Start menu)', 'OEM link switch', 'LOW'); }
};

OA.col10n = function () {   // Browser / help
  var P = OA.profile, t, subs, i, f;
  t = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Internet Explorer\\Main\\Window Title');
  if (t) { OA.addNote('10', 'IE-Window-Title', 'Window Title = ' + t, 'Internet Explorer title-bar branding (HKLM)', 'HIGH'); }
  t = OA.regStr('HKU\\.DEFAULT\\Software\\Microsoft\\Internet Explorer\\Main\\Window Title');
  if (t) { OA.addNote('10', 'IE-Window-Title-default-user', 'Window Title = ' + t, 'Internet Explorer title-bar branding (.DEFAULT)', 'HIGH'); }
  OA.checkTree('10', P.progFiles + '\\Internet Explorer\\Custom', 'IEAK / OEM Internet Explorer customization (install.ins, brndlog.txt)', 'HIGH');
  subs = OA.subDirs(P.windir + '\\PCHealth\\HelpCtr\\Vendors');
  for (i = 0; i < subs.length; i++) {
    f = subs[i];
    if (/microsoft/i.test(f.Name)) { continue; }
    OA.addTree('10', f.Path, 'Help and Support Center content from a non-Microsoft vendor (inference: unconfirmed)', 'MED');
  }
  if (!subs.length) { OA.nothing('10', 'no vendor folders under ' + P.windir + '\\PCHealth\\HelpCtr\\Vendors'); }
  OA.addReg('10', 'HKLM\\SOFTWARE\\Microsoft\\PCHealth\\HelpSvc', 'PCHealth-HelpSvc', 'Help and Support Center service settings');
};

OA.col11n = function () {   // Drivers
  var P = OA.profile, infDir = P.windir + '\\inf', e, f, pub, info, created, era, sub, conf, names, k, base, folder, dirs, d, found, n, dpath, parts, i, v, nm, drec, itemCount;
  if (!OA._layout) { OA._layout = OA.loadLayout(); }
  if (OA.dirExists(infDir)) {
    for (e = new Enumerator(OA.fso.GetFolder(infDir).Files); !e.atEnd(); e.moveNext()) {
      f = e.item(); pub = f.Name;
      if (!/^oem\d+\.inf$/i.test(pub)) { continue; }
      info = OA.parseInf(f.Path);
      created = OA.toDate(f.DateCreated);
      era = OA.eraOf(created);
      sub = '';
      if (era !== 'Post') { sub = 'Factory'; conf = era ? 'MED' : 'LOW'; }
      else if (OA.matchVendor(info.provider)) { sub = 'PostDelivery-OEMVendor'; conf = 'MED'; }
      drec = { pub: pub, orig: '', provider: info.provider, cls: info.cls, ver: info.ver, created: created, era: era, vendor: OA.matchVendor(info.provider), folder: '', size: f.Size, item: null };
      if (sub) {
        base = '11_Drivers\\' + sub + '\\' + pub.replace(/\.inf$/i, '');
        OA.addFile('11', f.Path, 'third-party driver INF (provider: ' + info.provider + ') published ' + OA.fmtDate(created), conf, { sub: sub, destRel: base + '\\inf\\' + pub, era: era });
        OA.checkFileQuiet(f.Path.replace(/\.inf$/i, '.PNF'), '11', 'precompiled INF', conf, { sub: sub, destRel: base + '\\inf\\' + pub.replace(/\.inf$/i, '.PNF'), era: era });
        names = OA.infFileNames(f.Path);
        dirs = [P.sys32 + '\\drivers', P.sys32, P.windir + '\\inf', P.windir];
        for (k = 0; k < names.length; k++) {
          nm = names[k];
          if (OA._layout[OA.lc(nm)]) { continue; }   // same name as a stock Windows file: do not claim it
          for (i = 0; i < dirs.length; i++) {
            d = dirs[i] + '\\' + nm;
            if (OA.fileExists(d) && !/\.inf$/i.test(nm)) {
              OA.addFile('11', d, 'file installed by ' + pub, conf, { sub: sub, destRel: base + '\\' + (dirs[i].substr(P.windir.length + 1) || 'windir').replace(/[\\:]+/g, '_') + '\\' + nm, era: era });
              break;
            }
          }
        }
      }
      OA.drivers.push(drec);
    }
  } else { OA.nothing('11', 'folder not present: ' + infDir); }
  if (!OA.drivers.length) { OA.nothing('11', 'no oem*.inf files found in ' + infDir); }
  dpath = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DevicePath');
  if (dpath) {
    parts = dpath.split(';');
    for (i = 0; i < parts.length; i++) {
      v = OA.expand(OA.trim(parts[i])).replace(/[\\\/]+$/, '');
      if (v && /^[A-Za-z]:\\/.test(v) && OA.lc(v.substr(0, P.windir.length)) !== OA.lc(P.windir) && OA.dirExists(v)) {
        OA.addTree('11', v, 'extra driver search folder listed in DevicePath (set by the OEM via OemPnPDriversPath)', 'HIGH', { sub: 'Staged', destRel: '11_Drivers\\Staged\\' + OA.safeName(OA.leaf(v), 60) });
      }
    }
  }
};
OA.checkFileQuiet = function (path, gid, why, conf, ex) { if (OA.fileExists(path)) { return OA.addFile(gid, path, why, conf, ex); } return null; };

OA.col12n = function () {   // Software
  var P = OA.profile, ks, i, v;
  OA.softwareFromUninstall();
  OA.vendorFoldersIn(P.progFiles, 'folder in Program Files named for the OEM');
  OA.vendorFoldersIn(P.allUsersApp, 'folder in All Users\\Application Data named for the OEM');
  OA.stagingFolders();
  ks = OA.regEnumValues(OA.HKLM, 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run');
  for (i = 0; i < ks.length; i++) {
    v = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\' + ks[i]);
    if (OA.matchVendor(v + ' ' + ks[i])) { OA.software.push({ kind: 'Startup entry (Run)', name: ks[i], publisher: OA.matchVendor(v + ' ' + ks[i]), version: '', date: '', loc: v, uninst: '', kb: '', why: 'Run entry points at OEM software', conf: 'MED', era: '', vendor: OA.matchVendor(v), item: null }); }
  }
  ks = OA.regEnumValues(OA.HKLM, 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce');
  for (i = 0; i < ks.length; i++) { OA.software.push({ kind: 'RunOnce entry', name: ks[i], publisher: '', version: '', date: '', loc: OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce\\' + ks[i]), uninst: '', kb: '', why: 'pending first-run command', conf: 'LOW', era: '', vendor: '', item: null }); }
};

OA.col13n = function () {   // Recovery / setup sources
  var P = OA.profile, ini, pid;
  OA.addReg('13', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Setup', 'Setup', 'setup source paths (SourcePath, ServicePackSourcePath)');
  if (OA.fileExists(P.sysdrive + '\\I386\\SETUPP.INI')) {
    ini = OA.readIni(P.sysdrive + '\\I386\\SETUPP.INI');
    pid = ini.pid ? ini.pid.pid : '';
    OA.addNote('13', 'SETUPP-INI', 'Pid = ' + pid + '\r\n' + (/OEM/i.test(pid) ? 'The Pid contains "OEM": this is OEM setup media.' : 'No "OEM" marker in Pid.'), 'channel marker of the on-disk setup source', 'MED');
  }
  OA.checkTree('14', P.windir + '\\OEM', 'OEM asset folder', 'MED');
  OA.checkTree('14', P.sysdrive + '\\OEM', 'OEM folder at the drive root', 'LOW');
};

OA.collectors5 = [
  ['01 Branding / system info', OA.col01n], ['02 Boot / logon', OA.col02n], ['03 Wallpapers', OA.col03n], ['04 Themes', OA.col04n],
  ['05 Sounds', OA.col05n], ['06 Cursors / icons / savers', OA.col06n], ['07 Account pictures', OA.col07n], ['08 OOBE / setup', OA.col08n],
  ['09 Start menu / desktop', OA.col09n], ['10 Browser / help', OA.col10n], ['11 Drivers', OA.col11n], ['12 Software', OA.col12n],
  ['13/14 Recovery and other', OA.col13n]
];

// ---------- main ----------
OA.main5 = function () {
  var P, name, base, root, free = -1, sel, req, tui, tr;
  OA.ensureCscript(); OA.ensureNative(); OA.parseArgs();
  if (OA.args.help || OA.args['?']) { OA.usage(); WScript.Quit(0); }
  OA.say('OEM-Archiver ' + OA.version + '  (Windows 2000 / XP / 2003 edition, JScript)');
  OA.say('Archives everything the PC maker added on top of a retail Windows install. Read-only on the system.');
  OA.debugInfo();
  OA.recommendations();
  OA.probeSystem(); P = OA.profile;
  if (P.family !== 'NT5' && !OA.args.ignoreos) {
    OA.say(''); OA.say('This is the Windows 2000/XP/2003 edition, but this PC runs Windows ' + P.major + '.' + P.minor + '. Use OEM-Archive-NT6.js (or OEM-Archive.bat, which picks the right one).');
    OA.finish(1);
  }
  OA.nt5Dirs();
  P.admin = OA.isAdmin();
  OA.say('');
  OA.say('This PC : ' + (P.makerRaw || '?') + ' / ' + (P.modelRaw || '?'));
  OA.say('Windows : ' + P.osCaption + ' ' + P.major + '.' + P.minor + '.' + P.build + (P.csd ? ' ' + P.csd : '') + '   ProductId channel: ' + P.channel);
  OA.say('Setup ref: ' + (P.oobeEnd ? OA.fmtDate(P.oobeEnd) + ' (' + P.oobeSrc + ')' : 'unknown') + '   Administrator: ' + (P.admin ? 'yes' : 'NO - log in as an administrator for complete results'));
  if (P.microsoftOem) { OA.say(''); OA.say('NOTE: this is a Microsoft device (e.g. Surface). Microsoft is both the OS vendor and the OEM, so publisher-based detection is switched off and results lean on the other signals (and the baseline check). Dedicated handling is planned.'); }
  if (OA.args.baseline && OA.args.baseline !== true) { OA.setupBaseline(String(OA.args.baseline)); if (OA.args.makeref) { OA.finish((OA.base && OA.base.active) ? 0 : 1); } }
  tui = OA.useTui();  if (tui) { tr = OA.runTui(OA.collectors5); root = tr.root; base = tr.base; }
  if (!OA.args.scan && !tui) {
    if (typeof OA.args.resume === 'string') { root = OA.args.resume.replace(/[\\\/]+$/, ''); base = root; OA.resuming = true; }
    else {
      name = OA.chooseName();
      base = OA.chooseLocation();
      root = OA.resolveArchiveRoot(base, name);
      if (OA.dirExists(root)) {
        if (OA.args.resume || (!OA.args.yes && OA.yesno('That archive folder already exists. Resume into it (files already copied are skipped)?', false))) { OA.resuming = true; }
        else { root = OA.uniqueDir(root); }
      }
    }
    OA.excludeRoot = OA.lc(root);
    OA.say(''); OA.say((OA.resuming ? 'Resuming into: ' : 'Archive will be written to: ') + root);
  }
  if (!tui) {
    OA.say(''); OA.say('Scanning (read-only)...');
    OA.runCollectors(OA.collectors5);
    OA.printScanSummary();
    if (OA.args.list) { OA.printScanList(); }
  }
  if (OA.args.scan) { OA.say(''); OA.say('Scan only: nothing was copied.'); OA.finish(0); }
  free = OA.freeSpace(base);
  if (OA.args.fakefree) { free = parseInt(OA.args.fakefree, 10) * 1048576; }   // test hook only
  if (!tui) { OA.selectionPages(free); }
  if (OA.args.dryrun) { OA.dryRunReport(); OA.say(''); OA.say('Dry run: nothing was copied.'); OA.finish(0); }
  sel = OA.sum(function (it) { return OA.itemSelected(it); });
  req = OA.effectiveSize(sel.size);
  if (free >= 0 && req > free) {
    OA.say(''); OA.say('WARNING: the selection (' + OA.fmtSize(req) + ') is larger than the free space on the target (' + OA.fmtSize(free) + ').');
    if (OA.args.yes || !OA.yesno('Continue anyway?', false)) { OA.say('Stopped. Nothing was copied.'); OA.finish(1); }
  }
  OA.mkdirp(root);
  OA.copyAll(root);
  OA.writeOutputs(root);
  OA.say('Done. Archive: ' + root);
  OA.say('Open 00_Transcript\\transcript.txt for the grouped report and file-structure.txt for the full tree.');
  OA.finishOptions(root);
  OA.finish(0);
};
