
// ===== nt6.js : Vista / 7 / 8 / 8.1 / 10 / 11 collectors + main =====
OA.tier = 'NT6';

OA.col01 = function () {   // Branding / system info
  var P = OA.profile, oi = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation', names, i, lines = [], v, logo, extra;
  if (OA.regKeyExists(OA.HKLM, 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation')) {
    OA.addReg('01', oi, 'OEMInformation', 'documented OEM support-information key (System / Settings > About)');
    names = OA.regEnumValues(OA.HKLM, 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation');
    for (i = 0; i < names.length; i++) {
      v = OA.regRead(oi + '\\' + names[i]);
      lines.push(names[i] + ' = ' + v);
      if (/^(logo|supportappurl)$/i.test(names[i]) && /^[A-Za-z]:\\|^%/.test(String(v))) {
        logo = OA.expand(String(v));
        OA.checkFile('01', logo, 'file named by OEMInformation\\' + names[i], 'HIGH');
      }
    }
    OA.addNote('01', 'OEMInformation-values', lines.join('\r\n'), 'readable copy of the OEMInformation values', 'HIGH');
  } else { OA.nothing('01', 'registry key not present: ' + oi); }
  OA.addReg('01', 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\OEMInformation', 'OEMInformation-WOW6432', 'OEMInformation (32-bit view)');
  OA.checkFile('01', P.sys32 + '\\oemlogo.bmp', 'classic OEM logo file', 'HIGH');
  OA.checkFile('01', P.sys32 + '\\OEMINFO.INI', 'classic OEM support information file', 'HIGH');
  OA.checkTree('01', P.windir + '\\Help\\OEM', 'Help and Support OEM content (Windows 8/8.1)', 'HIGH');
  OA.addReg('01', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Media Center\\OEM', 'MediaCenter-OEM', 'Media Center OEM branding values');
  extra = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Store\\OEMID');
  if (extra) { OA.addNote('01', 'Store-OEMID', 'OEMID = ' + extra, 'Microsoft Store OEM identity value', 'MED'); }
};

OA.col02 = function () {   // Boot / logon / lock
  var P = OA.profile;
  OA.addFilesUnder('02', P.sys32 + '\\oobe\\info\\backgrounds', 'Windows 7 OEM logon background images', 'HIGH');
  OA.addReg('02', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Authentication\\LogonUI\\Background', 'LogonUI-Background', 'OEMBackground switch for the logon screen');
  OA.addReg('02', 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization', 'Policy-Personalization', 'lock-screen / logon image policy values');
  OA.addReg('02', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PersonalizationCSP', 'PersonalizationCSP', 'lock-screen personalization CSP values');
  OA.scanStockDir('02', P.windir + '\\Web\\Screen', { why: 'lock/logon screen image' });
};

OA.col03 = function () {   // Wallpapers
  var P = OA.profile, dp = OA.defaultProfile(), r, txt, lines;
  OA.scanStockDir('03', P.windir + '\\Web\\Wallpaper', { why: 'wallpaper' });
  OA.scanStockDir('03', P.windir + '\\Web\\4K', { why: '4K wallpaper' });
  OA.checkFile('03', dp + '\\NTUSER.DAT', 'Default-user registry hive: holds the default wallpaper/theme/Start settings every new user inherits (open it offline in regedit)', 'MED');
  if (OA.args.hive && OA.fileExists(dp + '\\NTUSER.DAT')) {
    if (OA.run('reg load HKU\\OEMARCH_DEF "' + dp + '\\NTUSER.DAT"') === 0) {
      try {
        r = OA.exec('reg query "HKU\\OEMARCH_DEF\\Control Panel\\Desktop" /v Wallpaper');
        txt = r.out;
        r = OA.exec('reg query "HKU\\OEMARCH_DEF\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes" /s');
        txt += '\r\n' + r.out;
        OA.addNote('03', 'DefaultUser-hive-values', txt, 'wallpaper/theme values read from the Default-user hive', 'HIGH');
      } finally { OA.run('reg unload HKU\\OEMARCH_DEF'); }
    } else { OA.err('hive', 'could not load the Default-user hive (needs administrator)'); }
  }
};

OA.col04 = function () {   // Themes / visual styles
  var P = OA.profile, subs, i, nm;
  OA.scanStockDir('04', P.windir + '\\Resources\\Themes', { why: 'theme/visual style' });
  subs = OA.subDirs(P.windir + '\\Resources');
  for (i = 0; i < subs.length; i++) {
    nm = subs[i].Name;
    if (OA.lc(nm) === 'themes') { continue; }
    OA.scanStockDir('04', subs[i].Path, { why: 'theme resources' });
  }
  OA.scanStockDir('04', P.windir + '\\Resources', { flat: true, why: 'loose theme file' });
  OA.addReg('04', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes', 'Themes', 'theme defaults (InstallTheme, BrandIcon and related values)');
};

OA.col05 = function () {   // Sounds
  OA.scanStockDir('05', OA.profile.windir + '\\Media', { why: 'sound file' });
};

OA.col06 = function () {   // Cursors / icons / screensavers
  var P = OA.profile;
  OA.scanStockDir('06', P.windir + '\\Cursors', { why: 'cursor' });
  OA.scanStockDir('06', P.sys32, { flat: true, rx: /\.scr$/i, why: 'screen saver' });
  OA.scanStockDir('06', P.windir + '\\Resources\\Icons', { why: 'icon' });
};

OA.col07 = function () {   // Account pictures
  var d = OA.profile.progData + '\\Microsoft\\User Account Pictures', n;
  n = OA.scanStockDir('07', d, { why: 'account picture', conf: 'LOW', rx: /\.(png|jpe?g|bmp|gif)$/i });
  if (n) { OA.addNote('07', 'account-pictures-caution', 'Windows also ships its own default account pictures here. These are listed with LOW confidence because the script cannot tell them from OEM pictures; compare with a clean install.', 'caution', 'LOW'); }
};

OA.col08 = function () {   // OOBE / setup / unattend
  var P = OA.profile, i, f, e;
  OA.addFilesUnder('08', P.sys32 + '\\oobe\\info', 'OEM OOBE customization (oobe.xml, EULA, registration pages, images)', 'HIGH');
  if (OA.dirExists(P.windir + '\\Panther')) {
    try {
      for (e = new Enumerator(OA.fso.GetFolder(P.windir + '\\Panther').Files); !e.atEnd(); e.moveNext()) {
        f = e.item();
        if (/^unattend.*\.xml$/i.test(f.Name)) { OA.addFile('08', f.Path, 'answer file kept from Windows setup (shows the OEM\'s settings)', 'HIGH'); }
      }
    } catch (x) { OA.err('Panther', x); }
    OA.checkFile('08', P.windir + '\\Panther\\Unattend\\Unattend.xml', 'answer file kept from Windows setup', 'HIGH');
  } else { OA.nothing('08', 'folder not present: ' + P.windir + '\\Panther'); }
  OA.checkFile('08', P.sys32 + '\\Sysprep\\Unattend.xml', 'Sysprep answer file', 'HIGH');
  OA.checkTree('08', P.windir + '\\Setup\\Scripts', 'setup scripts run at the end of Windows setup (SetupComplete.cmd)', 'HIGH');
  OA.addReg('08', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OOBE', 'OOBE', 'OOBE state values (Stats, completion markers)');
};

OA.col09 = function () {   // Start menu / taskbar / desktop
  var P = OA.profile, dp = OA.defaultProfile(), shell = dp + '\\AppData\\Local\\Microsoft\\Windows\\Shell', names, i, lay, pubDesk, spDir, subs, f;
  names = ['LayoutModification.json', 'LayoutModification.xml', 'TaskbarLayoutModification.xml', 'AppsFolderLayout.bin'];
  for (i = 0; i < names.length; i++) { OA.checkFile('09', shell + '\\' + names[i], 'OEM Start/taskbar layout file in the Default user profile', 'HIGH'); }
  lay = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\LayoutXMLPath');
  if (lay) { lay = OA.expand(lay); OA.checkFile('09', lay, 'taskbar layout file named by Explorer\\LayoutXMLPath', 'HIGH'); }
  pubDesk = OA.expand('%PUBLIC%') + '\\Desktop';
  OA.addDesktopItems(pubDesk, 'Public Desktop (shown to every user)');
  OA.addDesktopItems(dp + '\\Desktop', 'Default-user desktop');
  spDir = P.progData + '\\Microsoft\\Windows\\Start Menu\\Programs';
  subs = OA.subDirs(spDir);
  for (i = 0; i < subs.length; i++) { f = subs[i]; if (OA.vendorFolder(f.Name)) { OA.addTree('09', f.Path, 'Start menu folder named for the OEM', 'MED'); } }
  OA.addReg('09', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartPanelLinks', 'StartPanelLinks', 'OEM Start-panel links (Vista/7)');
};

OA.col10 = function () {   // Browser / help / support
  var P = OA.profile, pf, i, t, bases = [];
  bases.push(P.progFiles + '\\Microsoft\\Edge\\Application'); if (P.progFiles86) { bases.push(P.progFiles86 + '\\Microsoft\\Edge\\Application'); bases.push(P.progFiles86 + '\\Google\\Chrome\\Application'); }
  bases.push(P.progFiles + '\\Google\\Chrome\\Application');
  for (i = 0; i < bases.length; i++) {
    OA.checkFile('10', bases[i] + '\\initial_preferences', 'browser first-run customization (bookmarks, search, home page)', 'HIGH');
    OA.checkFile('10', bases[i] + '\\master_preferences', 'browser first-run customization (legacy name)', 'HIGH');
  }
  OA.checkFile('10', P.sys32 + '\\OEMDefaultAssociations.xml', 'OEM default app associations', 'HIGH');
  t = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Internet Explorer\\Main\\Window Title');
  if (t) { OA.addNote('10', 'IE-Window-Title', 'Window Title = ' + t, 'Internet Explorer title-bar branding', 'HIGH'); } else { OA.nothing('10', 'IE Main\\Window Title not set'); }
  OA.addReg('10', 'HKLM\\SOFTWARE\\Microsoft\\Internet Explorer\\SearchScopes', 'IE-SearchScopes', 'Internet Explorer search providers added by the OEM');
  OA.scanStockDir('10', P.progFiles + '\\Windows Sidebar\\Shared Gadgets', { why: 'Sidebar gadget' });
};

OA.col11 = function () {   // Drivers
  var P = OA.profile, repo = P.sys32 + '\\DriverStore\\FileRepository', infDir = P.windir + '\\INF', e, f, pub, v, pkg, info, folder, rec, sub, conf, why, sz, dpath, parts, i;
  if (!OA.dirExists(infDir)) { OA.nothing('11', 'folder not present: ' + infDir); return; }
  for (e = new Enumerator(OA.fso.GetFolder(infDir).Files); !e.atEnd(); e.moveNext()) {
    f = e.item(); pub = f.Name;
    if (!/^oem\d+\.inf$/i.test(pub)) { continue; }
    v = OA.regRead('HKLM\\SYSTEM\\DriverDatabase\\DriverInfFiles\\' + pub + '\\');
    pkg = (v === null || v === undefined) ? '' : ((typeof v === 'string') ? v : (v.length ? String(v[0]) : ''));
    info = OA.parseInf(f.Path);
    folder = pkg ? repo + '\\' + pkg : '';
    rec = { pub: pub, orig: pkg.replace(/_[^_]*_[0-9a-f]{16}$/i, ''), provider: info.provider, cls: info.cls, ver: info.ver, created: OA.toDate(f.DateCreated),
            era: OA.eraOf(OA.toDate(f.DateCreated)), vendor: OA.matchVendor(info.provider), folder: folder, size: -1, item: null };
    if (folder && OA.dirExists(folder)) {
      sub = '';
      if (rec.era !== 'Post') {
        sub = 'Factory'; conf = rec.era ? 'HIGH' : 'LOW';
        why = 'third-party driver package ' + pub + ' (provider: ' + info.provider + '), published ' + OA.fmtDate(rec.created) + (rec.era ? ', before OOBE finished' : ', OOBE time unknown');
      } else if (rec.vendor) {
        sub = 'PostDelivery-OEMVendor'; conf = 'MED';
        why = 'driver package ' + pub + ' published after OOBE; provider matches ' + rec.vendor;
      }
      if (sub) { rec.item = OA.addTree('11', folder, why, conf, { sub: sub, destRel: '11_Drivers\\' + sub + '\\' + pkg, era: rec.era }); }
      try { rec.size = rec.item ? rec.item.size : OA.fso.GetFolder(folder).Size; } catch (x) { }
    }
    OA.drivers.push(rec);
  }
  if (!OA.drivers.length) { OA.nothing('11', 'no oem*.inf driver packages found in ' + infDir); }
  // extra driver search folders (OEMs append these to DevicePath)
  dpath = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DevicePath');
  if (dpath) {
    parts = dpath.split(';');
    for (i = 0; i < parts.length; i++) {
      v = OA.expand(OA.trim(parts[i])).replace(/[\\\/]+$/, '');
      if (v && OA.lc(v) !== OA.lc(P.windir + '\\inf') && /^[A-Za-z]:\\/.test(v) && OA.dirExists(v) && OA.lc(v.substr(0, P.windir.length)) !== OA.lc(P.windir)) {
        OA.addTree('11', v, 'extra driver search folder listed in DevicePath', 'HIGH', { sub: 'Staged', destRel: '11_Drivers\\Staged\\' + OA.safeName(OA.leaf(v), 60) });
      }
    }
  }
};

OA.col12 = function () {   // Software
  var P = OA.profile, i, ks, k, rec, v, base;
  OA.softwareFromUninstall();
  OA.vendorFoldersIn(P.progFiles, 'folder in Program Files named for the OEM');
  if (P.progFiles86) { OA.vendorFoldersIn(P.progFiles86, 'folder in Program Files (x86) named for the OEM'); }
  OA.vendorFoldersIn(P.progData, 'folder in ProgramData named for the OEM');
  OA.stagingFolders();
  // provisioned Store apps (Windows 8 and later)
  if (P.build >= 9200) {
    ks = OA.regEnumKeys(OA.HKLM, 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Appx\\AppxAllUserStore\\InboxApplications');
    for (i = 0; i < ks.length; i++) {
      k = ks[i];
      if (OAV.inboxAppx.test(k)) { continue; }
      v = ''; base = k.split('_')[0];
      for (var j = 0; j < OAV.appxOem.length; j++) { if (OA.startsWith(base, OAV.appxOem[j].p)) { v = OAV.appxOem[j].s; break; } }
      OA.software.push({ kind: 'Appx (provisioned)', name: k, publisher: v, version: '', date: '', loc: '', uninst: '', kb: '', why: v ? 'package family prefix belongs to ' + v : 'provisioned for all users and not a Microsoft inbox app', conf: v ? 'HIGH' : 'LOW', era: '', vendor: v, item: null });
    }
  }
  // startup entries that point into OEM folders
  ks = OA.regEnumValues(OA.HKLM, 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run');
  for (i = 0; i < ks.length; i++) {
    v = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\' + ks[i]);
    if (OA.matchVendor(v + ' ' + ks[i])) { OA.software.push({ kind: 'Startup entry (Run)', name: ks[i], publisher: OA.matchVendor(v + ' ' + ks[i]), version: '', date: '', loc: v, uninst: '', kb: '', why: 'Run entry points at OEM software', conf: 'MED', era: '', vendor: OA.matchVendor(v), item: null }); }
  }
};

OA.col13 = function () {   // Recovery / setup sources
  var P = OA.profile, rec = P.sysdrive + '\\Recovery', r, ppk;
  OA.checkTree('13', rec + '\\OEM', 'OEM push-button-reset scripts and ResetConfig.xml', 'HIGH');
  OA.checkTree('13', rec + '\\AutoApply', 'files Windows re-applies after a reset', 'HIGH');
  OA.checkTree('13', rec + '\\Customizations', 'captured OEM customization packages (.ppkg)', 'HIGH', { cat: 'software' });
  OA.checkFile('13', P.sys32 + '\\Recovery\\ResetConfig.xml', 'reset configuration', 'MED');
  if (P.tools.reagentc) { r = OA.exec('reagentc /info'); OA.addNote('13', 'reagentc-info', r.out, 'Windows Recovery Environment location and state (the WinRE image itself is not copied)', 'HIGH'); }
  OA.addReg('13', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Setup', 'Setup', 'setup source paths');
  OA.checkTree('14', P.windir + '\\OEM', 'conventional OEM asset folder (logos, layouts, customization files)', 'HIGH');
};

OA.collectors6 = [
  ['01 Branding / system info', OA.col01], ['02 Boot / logon / lock', OA.col02], ['03 Wallpapers', OA.col03], ['04 Themes', OA.col04],
  ['05 Sounds', OA.col05], ['06 Cursors / icons / savers', OA.col06], ['07 Account pictures', OA.col07], ['08 OOBE / setup', OA.col08],
  ['09 Start / taskbar / desktop', OA.col09], ['10 Browser / help', OA.col10], ['11 Drivers', OA.col11], ['12 Software', OA.col12],
  ['13/14 Recovery and other', OA.col13]
];

// ---------- main ----------
OA.main6 = function () {
  var P, name, base, root, free = -1, sel, req;
  OA.ensureCscript(); OA.ensureNative(); OA.parseArgs();
  if (OA.args.help || OA.args['?']) { OA.usage(); WScript.Quit(0); }
  OA.say('OEM-Archiver ' + OA.version + '  (Windows Vista - 11 edition, JScript)');
  OA.say('Archives everything the PC maker added on top of a retail Windows install. Read-only on the system.');
  OA.recommendations();
  OA.probeSystem(); P = OA.profile;
  if (P.family !== 'NT6' && !OA.args.ignoreos) {
    OA.say(''); OA.say('This is the Vista-to-11 edition, but this PC runs Windows ' + P.major + '.' + P.minor + '. Use OEM-Archive-NT5.js (or OEM-Archive.bat, which picks the right one).');
    OA.finish(1);
  }
  P.admin = OA.isAdmin();
  if (!P.admin && !OA.args.noelevate && !OA.args.elevated) {
    OA.say('');
    OA.say('Not running as administrator. Some OEM folders (C:\\Recovery, driver store ACLs) can only be read as administrator.');
    if (!OA.args.yes && OA.yesno('Relaunch as administrator now (recommended)?', true)) { OA.relaunchElevated(); }
  }
  OA.say('');
  OA.say('This PC : ' + (P.makerRaw || '?') + ' / ' + (P.modelRaw || '?'));
  OA.say('Windows : ' + P.osCaption + ' ' + P.major + '.' + P.minor + '.' + P.build + (P.displayVersion ? ' (' + P.displayVersion + ')' : '') + '   ProductId channel: ' + P.channel);
  OA.say('OOBE end: ' + (P.oobeEnd ? OA.fmtDate(P.oobeEnd) + ' (' + P.oobeSrc + ')' : 'unknown') + '   Elevated: ' + (P.admin ? 'yes' : 'no'));
  if (!OA.args.scan) {
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
  OA.say(''); OA.say('Scanning (read-only)...');
  OA.runCollectors(OA.collectors6);
  OA.printScanSummary();
  if (OA.args.list) { OA.printScanList(); }
  if (OA.args.scan) { OA.say(''); OA.say('Scan only: nothing was copied.'); OA.finish(0); }
  free = OA.freeSpace(base);
  if (OA.args.fakefree) { free = parseInt(OA.args.fakefree, 10) * 1048576; }   // test hook only
  OA.selectionPages(free);
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
