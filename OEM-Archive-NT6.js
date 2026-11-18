// OEM-Archiver - built from src\ by build.ps1 - edit src\, then rebuild. Runs with: cscript //nologo OEM-Archive-NT6.js
// ===== vendors.js : OEM vendor list, junk SMBIOS strings, staging-folder names =====
// ES3-only JScript. No trailing commas, no reserved words as property names.

var OAV = {};

// Each vendor: short name used in folder names, a regex matched against publisher / provider /
// folder names / company names. The machine's own SMBIOS maker is added at run time.
OAV.vendors = [
  { s: 'HP',        rx: /\b(hp|hp inc|hewlett[- ]?packard|compaq|palm)\b/i },
  { s: 'Dell',      rx: /\b(dell|alienware|dell inc)\b/i },
  { s: 'Lenovo',    rx: /\b(lenovo|ibm|thinkpad|thinkcentre)\b/i },
  { s: 'ASUS',      rx: /\b(asus|asustek|asustek computer)\b/i },
  { s: 'Acer',      rx: /\b(acer|gateway|emachines|e-machines|packard[- ]?bell)\b/i },
  { s: 'Toshiba',   rx: /\b(toshiba|dynabook)\b/i },
  { s: 'Sony',      rx: /\b(sony|vaio)\b/i },
  { s: 'Samsung',   rx: /\b(samsung)\b/i },
  { s: 'MSI',       rx: /\b(msi|micro-star)\b/i },
  { s: 'Fujitsu',   rx: /\b(fujitsu|fsc|siemens)\b/i },
  { s: 'NEC',       rx: /\b(nec|packard bell nec)\b/i },
  { s: 'Medion',    rx: /\b(medion)\b/i },
  { s: 'Microsoft', rx: /\b(surface)\b/i },
  { s: 'Panasonic', rx: /\b(panasonic)\b/i },
  { s: 'LG',        rx: /\b(lg electronics)\b/i },
  { s: 'Gigabyte',  rx: /\b(gigabyte|aorus)\b/i },
  { s: 'Razer',     rx: /\b(razer)\b/i },
  { s: 'Huawei',    rx: /\b(huawei|honor)\b/i },
  { s: 'Xiaomi',    rx: /\b(xiaomi)\b/i },
  { s: 'Positivo',  rx: /\b(positivo)\b/i },
  { s: 'Tulip',     rx: /\b(tulip)\b/i }
];

// SMBIOS / BIOS placeholder strings that carry no information
OAV.junk = /^(to be filled by o\.?e\.?m\.?|system manufacturer|system product name|system version|system serial number|default string|not applicable|n\/a|none|unknown|oem|o\.e\.m\.?|type1productconfigid|123456789|0123456789|0|\s*)$/i;

// Component vendors that are normally NOT "the OEM" (used only to lower confidence of software hits)
OAV.chipVendors = /\b(microsoft|intel|nvidia|amd|advanced micro|realtek|qualcomm|broadcom|mediatek|synaptics|elan|goodix|waves|dolby|dts|conexant|idt|cirrus|maxlinear|marvell|ralink|atheros|ti texas)\b/i;

// Microsoft package-name prefixes (provisioned Appx) that are inbox, not OEM
OAV.inboxAppx = /^(microsoft\.|microsoftwindows\.|windows\.|msteams|clipchamp|microsoftcorporationii\.|microsoftteams|mspaint|notepad|1527c705|c5e2524a|e2a4f912|f46d4000|windowsapp|nvidiacorp|realtek)/i;

// Appx publisher-name prefixes that identify a specific OEM (package family names start with these)
OAV.appxOem = [
  { p: 'AD2F1837',   s: 'HP' },
  { p: 'DellInc',    s: 'Dell' },
  { p: 'DELLInc',    s: 'Dell' },
  { p: 'E046963F',   s: 'Lenovo' },
  { p: 'LenovoCorporation', s: 'Lenovo' },
  { p: 'LenovoGroupLimited', s: 'Lenovo' },
  { p: 'B9ECED6F',   s: 'ASUS' },
  { p: 'ASUSTeKCOMPUTERINC', s: 'ASUS' },
  { p: 'AcerIncorporated', s: 'Acer' },
  { p: 'AcerIncorporated', s: 'Acer' },
  { p: 'SamsungElectronicsCoLtd', s: 'Samsung' },
  { p: 'SonyCorporation', s: 'Sony' },
  { p: 'ToshibaAmericaInformationSystemsInc', s: 'Toshiba' },
  { p: 'MSI',        s: 'MSI' }
];

// Folders at the drive root that OEMs use as staging areas. d = destination group kind.
//  'soft' -> 12_Software\StagedInstallers   'drv' -> 11_Drivers\Staged   'rec' -> 13_Recovery_Setup_Sources
OAV.rootStaging = [
  { n: 'SWSetup',     d: 'soft' },
  { n: 'SWTOOLS',     d: 'soft' },
  { n: 'Drivers',     d: 'drv'  },
  { n: 'Driver',      d: 'drv'  },
  { n: 'DellDrivers', d: 'drv'  },
  { n: '$OEM$',       d: 'rec'  },
  { n: 'Sysprep',     d: 'rec'  },
  { n: 'system.sav',  d: 'rec'  },
  { n: 'Options',     d: 'rec'  },
  { n: 'I386',        d: 'rec'  }
];
// (Folders named for the OEM, e.g. C:\HP or C:\Dell, are found by name matching, not listed here.
//  (An archive written to a folder called OEM is never scanned: the running archive path is excluded.))

// Files that must never be archived (customer data / secrets) -- compared lower-case against base name
OAV.neverCopy = [
  'userdata.blob', 'sessionkey.blob', 'userchoices.xml'
];

// Locale-neutral helper words stripped from maker / model when building folder names
OAV.stripWords = /\b(inc|inc\.|corp|corporation|co|co\.|ltd|ltd\.|limited|company|computer|computers|technology|technologies|international|electronics|group)\b\.?,?/ig;

// ===== common.js : shared engine (ES3 JScript, runs under cscript) =====
var OA = {};
OA.version = '1.0.0';
OA.sh = new ActiveXObject('WScript.Shell');
OA.fso = new ActiveXObject('Scripting.FileSystemObject');
OA.args = {};
OA.errors = [];      // {where, msg}
OA.items = [];       // scan results (files, trees, registry exports, notes)
OA.drivers = [];     // driver records for driver-manifest.csv
OA.software = [];    // software records for software-manifest.csv
OA.searched = {};    // group id -> array of "checked, nothing found" lines
OA.excluded = [];    // {src, reason}
OA.sensitive = [];   // copied files that may hold keys/passwords
OA.seen = {};        // lower-case src -> true (de-dupe)
OA.treeRoots = [];   // lower-case roots of tree items
OA.profile = {};
OA.modes = { branding: 'copy', drivers: 'full', software: 'all', cap: 0, totalCap: 0, postDrivers: false, postSoftware: true, groupsOff: {} };
OA.noInput = false;

OA.groups = [
  { id: '01', name: 'Branding_SystemInfo',        title: 'Branding / System info',         cat: 'branding' },
  { id: '02', name: 'Boot_Logon_Lock',            title: 'Boot / Logon / Lock screen',     cat: 'branding' },
  { id: '03', name: 'Wallpapers',                 title: 'Wallpapers',                     cat: 'branding' },
  { id: '04', name: 'Themes_VisualStyles',        title: 'Themes / Visual styles',         cat: 'branding' },
  { id: '05', name: 'Sounds',                     title: 'Sounds',                         cat: 'branding' },
  { id: '06', name: 'Cursors_Icons_Screensavers', title: 'Cursors / Icons / Screensavers', cat: 'branding' },
  { id: '07', name: 'Account_Pictures',           title: 'Account pictures',               cat: 'branding' },
  { id: '08', name: 'OOBE_Setup_Unattend',        title: 'OOBE / Setup / Unattend',        cat: 'branding' },
  { id: '09', name: 'StartMenu_Taskbar_Desktop',  title: 'Start menu / Taskbar / Desktop', cat: 'branding' },
  { id: '10', name: 'Browser_Help_Support',       title: 'Browser / Help / Support',       cat: 'branding' },
  { id: '11', name: 'Drivers',                    title: 'Drivers',                        cat: 'drivers'  },
  { id: '12', name: 'Software',                   title: 'Software',                       cat: 'software' },
  { id: '13', name: 'Recovery_Setup_Sources',     title: 'Recovery / Setup sources',       cat: 'branding' },
  { id: '14', name: 'Other',                      title: 'Other',                          cat: 'branding' }
];

// ---------- small utilities ----------
OA.trim = function (s) { return String(s).replace(/^\s+|\s+$/g, ''); };
OA.lc = function (s) { return String(s).toLowerCase(); };
OA.startsWith = function (s, p) { return OA.lc(String(s).substr(0, p.length)) === OA.lc(p); };
OA.endsWith = function (s, p) { s = String(s); return s.length >= p.length && OA.lc(s.substr(s.length - p.length)) === OA.lc(p); };
OA.inArray = function (arr, v) { var i; for (i = 0; i < arr.length; i++) { if (arr[i] === v) { return true; } } return false; };
OA.pad = function (n, w) { var s = String(n); while (s.length < w) { s = '0' + s; } return s; };
OA.groupById = function (id) { var i; for (i = 0; i < OA.groups.length; i++) { if (OA.groups[i].id === id) { return OA.groups[i]; } } return null; };
OA.groupDir = function (id) { var g = OA.groupById(id); return g.id + '_' + g.name; };
OA.fmtSize = function (n) {
  if (n === null || n === undefined || n < 0) { return '?'; }
  if (n < 1024) { return n + ' B'; }
  if (n < 1048576) { return (n / 1024).toFixed(1) + ' KB'; }
  if (n < 1073741824) { return (n / 1048576).toFixed(1) + ' MB'; }
  return (n / 1073741824).toFixed(2) + ' GB';
};
OA.fmtDate = function (d) {
  if (!d) { return ''; }
  try {
    return d.getFullYear() + '-' + OA.pad(d.getMonth() + 1, 2) + '-' + OA.pad(d.getDate(), 2) + ' ' + OA.pad(d.getHours(), 2) + ':' + OA.pad(d.getMinutes(), 2);
  } catch (e) { return ''; }
};
// FSO/WMI dates arrive as opaque VarDate in newer JScript engines: always convert before using Date methods
OA.toDate = function (v) {
  var d;
  if (v === null || v === undefined || v === '') { return null; }
  try { d = new Date(v); if (isNaN(d.getTime())) { return null; } return d; } catch (e) { return null; }
};
OA.fmtDay = function (d) { return d ? d.getFullYear() + '-' + OA.pad(d.getMonth() + 1, 2) + '-' + OA.pad(d.getDate(), 2) : ''; };
OA.csv = function (v) {
  var s = (v === null || v === undefined) ? '' : String(v);
  if (/[",\r\n]/.test(s)) { s = '"' + s.replace(/"/g, '""') + '"'; }
  return s;
};
OA.csvRow = function (arr) { var o = [], i; for (i = 0; i < arr.length; i++) { o.push(OA.csv(arr[i])); } return o.join(','); };
OA.escRx = function (s) { return String(s).replace(/([.*+?^${}()|\[\]\\\/])/g, '\\$1'); };
OA.err = function (where, e) {
  var m = '';
  try { m = (e && e.message) ? e.message : String(e); } catch (x) { m = 'error'; }
  OA.errors.push({ where: where, msg: m });
};
OA.expand = function (s) { return OA.sh.ExpandEnvironmentStrings(s); };
OA.exists = function (p) { try { return OA.fso.FileExists(p) || OA.fso.FolderExists(p); } catch (e) { return false; } };
OA.fileExists = function (p) { try { return OA.fso.FileExists(p); } catch (e) { return false; } };
OA.dirExists = function (p) { try { return OA.fso.FolderExists(p); } catch (e) { return false; } };
OA.leaf = function (p) { return String(p).replace(/[\\\/]+$/, '').replace(/^.*[\\\/]/, ''); };
OA.parent = function (p) { try { return OA.fso.GetParentFolderName(p); } catch (e) { return ''; } };
OA.mkdirp = function (p) {
  if (OA.fso.FolderExists(p)) { return true; }
  var par = OA.fso.GetParentFolderName(p);
  if (par && !OA.fso.FolderExists(par)) { OA.mkdirp(par); }
  OA.fso.CreateFolder(p);
  return true;
};
OA.readText = function (p) {
  var f, s = '';
  try { f = OA.fso.OpenTextFile(p, 1, false, -2); s = f.ReadAll(); f.Close(); } catch (e) { try { f.Close(); } catch (e2) { } }
  return s;
};
OA.writeText = function (p, text, unicode) {
  OA.mkdirp(OA.fso.GetParentFolderName(p));
  var f = OA.fso.CreateTextFile(p, true, unicode ? true : false);
  f.Write(text);
  f.Close();
};
// Minimal INI reader: returns { 'section': { 'key': 'value' } } with lower-case section/key names
OA.readIni = function (p) {
  var txt = OA.readText(p), lines, i, ln, sec = '', m, out = {};
  lines = txt.split('\n');
  for (i = 0; i < lines.length; i++) {
    ln = OA.trim(lines[i]);
    if (ln === '' || ln.charAt(0) === ';') { continue; }
    m = /^\[(.*)\]$/.exec(ln);
    if (m) { sec = OA.lc(OA.trim(m[1])); if (!out[sec]) { out[sec] = {}; } continue; }
    m = /^([^=]+)=(.*)$/.exec(ln);
    if (m) { if (!out[sec]) { out[sec] = {}; } out[sec][OA.lc(OA.trim(m[1]))] = OA.trim(m[2]); }
  }
  return out;
};
OA.maskSecrets = function (text) {
  return String(text).replace(/^(\s*(?:ProductKey|AdminPassword|DomainAdminPassword|Password|EncryptedAdminPassword|JoinPassword)\s*=\s*).*$/igm, '$1***masked***')
                     .replace(/(<(?:ProductKey|Password)>)[^<]*(<\/(?:ProductKey|Password)>)/ig, '$1***masked***$2');
};

// ---------- arguments ----------
OA.parseArgs = function () {
  var a = WScript.Arguments, i, s, m;
  for (i = 0; i < a.length; i++) {
    s = String(a.Item(i));
    m = /^[\/\-]{1,2}([A-Za-z0-9_]+)(?::(.*))?$/.exec(s);
    if (m) { OA.args[OA.lc(m[1])] = (!m[2]) ? true : m[2]; }
  }
};
OA.argList = function () {
  var a = WScript.Arguments, i, o = [];
  for (i = 0; i < a.length; i++) { o.push('"' + a.Item(i) + '"'); }
  return o;
};

// ---------- console ----------
OA.say = function (s) { if (s === undefined) { s = ''; } WScript.StdOut.WriteLine(s); };
OA.sayn = function (s) { WScript.StdOut.Write(s); };
// Safety rule: defaults are only ever taken silently when the user passed /yes. If input is missing (closed or
// redirected stdin) the script stops instead of guessing, so it can never write an archive nobody asked for.
OA.inputEnded = function (why) {
  OA.say('');
  OA.say(why || 'No more input is available, so no choice could be made.');
  OA.say('Nothing was copied. For unattended runs use /yes together with /out: /name: and /preset:.');
  OA.finish(2);
};
OA.ask = function (prompt, def) {
  var s;
  if (OA.args.yes) { return def; }
  OA.sayn(prompt + ((def !== undefined && def !== '') ? ' [' + def + ']' : '') + ': ');
  try {
    if (WScript.StdIn.AtEndOfStream) { OA.inputEnded(); }
    s = OA.trim(WScript.StdIn.ReadLine());
  } catch (e) { OA.inputEnded(); }
  return s === '' ? def : s;
};
OA.menu = function (title, options, defIdx) {
  var i, a, n, tries = 0;
  OA.say('');
  OA.say(title);
  for (i = 0; i < options.length; i++) { OA.say('  ' + (i + 1) + ') ' + options[i]); }
  while (true) {
    a = OA.ask('Choose 1-' + options.length, String(defIdx + 1));
    n = parseInt(a, 10);
    if (n >= 1 && n <= options.length) { return n - 1; }
    tries++;
    if (tries > 5) { OA.inputEnded('Too many invalid answers.'); }
    OA.say('  Please type a number from the list.');
  }
};
OA.yesno = function (prompt, defYes) {
  var r;
  if (OA.useGui && OA.useGui()) {   // real Windows message box; falls back to the console if it cannot be shown
    try { r = OA.sh.Popup(prompt, 0, 'OEM-Archiver', 4 + 32 + (defYes ? 0 : 256)); if (r === 6) { return true; } if (r === 7) { return false; } } catch (e) { }
  }
  return OA.yesnoConsole(prompt, defYes);
};
OA.pause = function () {
  try { OA.sayn('Press Enter to close...'); if (!WScript.StdIn.AtEndOfStream) { WScript.StdIn.ReadLine(); } } catch (e) { }
};

// ---------- host, bitness, elevation ----------
OA.ensureCscript = function () {
  var host = OA.lc(WScript.FullName);
  if (host.indexOf('cscript') < 0) {
    OA.sh.Run('cmd /k cscript //nologo "' + WScript.ScriptFullName + '" ' + OA.argList().join(' '), 1, false);
    WScript.Quit(0);
  }
};
OA.ensureNative = function () {
  var w = '', rc;
  try { w = OA.sh.Environment('Process')('PROCESSOR_ARCHITEW6432'); } catch (e) { }
  if (w) {   // 32-bit host on 64-bit Windows: re-run with the native 64-bit cscript
    rc = OA.sh.Run('"' + OA.expand('%windir%') + '\\Sysnative\\cscript.exe" //nologo "' + WScript.ScriptFullName + '" ' + OA.argList().join(' '), 1, true);
    WScript.Quit(rc);
  }
};
OA.isAdmin = function () {
  var rc;
  try { rc = OA.sh.Run('cmd /s /c "fltmc >nul 2>&1 <nul"', 0, true); if (rc === 0) { return true; } } catch (e) { }
  try { rc = OA.sh.Run('cmd /s /c "net session >nul 2>&1 <nul"', 0, true); return rc === 0; } catch (e2) { }
  return false;
};
OA.relaunchElevated = function () {
  var sa = new ActiveXObject('Shell.Application');
  var a = OA.argList(); a.push('/elevated');
  sa.ShellExecute('cscript.exe', '//nologo "' + WScript.ScriptFullName + '" ' + a.join(' '), OA.fso.GetParentFolderName(WScript.ScriptFullName), 'runas', 1);
  WScript.Quit(0);
};

// ---------- command execution ----------
OA.exec = function (cmd) {
  var p, out = '';
  try {
    p = OA.sh.Exec('cmd /s /c "' + cmd + ' 2>&1 <nul"');
    out = p.StdOut.ReadAll();
    while (p.Status === 0) { WScript.Sleep(15); }
    return { code: p.ExitCode, out: out };
  } catch (e) { OA.err('exec ' + cmd, e); return { code: -1, out: '' }; }
};
OA.run = function (cmd) {
  try { return OA.sh.Run('cmd /s /c "' + cmd + ' <nul"', 0, true); } catch (e) { OA.err('run ' + cmd, e); return -1; }
};

// ---------- registry (WMI StdRegProv for enumeration, WshShell for single reads) ----------
OA.HKLM = 2147483650;
OA.HKCU = 2147483649;
OA._prov = null;
OA.prov = function () {
  if (!OA._prov) { OA._prov = GetObject('winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\default:StdRegProv'); }
  return OA._prov;
};
OA.regEnumKeys = function (hive, path) {
  try {
    var p = OA.prov(), m = p.Methods_('EnumKey'), inp = m.InParameters.SpawnInstance_(), out;
    inp.hDefKey = hive; inp.sSubKeyName = path;
    out = p.ExecMethod_('EnumKey', inp);
    if (out.ReturnValue !== 0 || out.sNames === null) { return []; }
    return new VBArray(out.sNames).toArray();
  } catch (e) { return []; }
};
OA.regKeyExists = function (hive, path) {
  try {
    var p = OA.prov(), m = p.Methods_('EnumKey'), inp = m.InParameters.SpawnInstance_(), out;
    inp.hDefKey = hive; inp.sSubKeyName = path;
    out = p.ExecMethod_('EnumKey', inp);
    return out.ReturnValue === 0;
  } catch (e) { return false; }
};
OA.regEnumValues = function (hive, path) {
  try {
    var p = OA.prov(), m = p.Methods_('EnumValues'), inp = m.InParameters.SpawnInstance_(), out;
    inp.hDefKey = hive; inp.sSubKeyName = path;
    out = p.ExecMethod_('EnumValues', inp);
    if (out.ReturnValue !== 0 || out.sNames === null) { return []; }
    return new VBArray(out.sNames).toArray();
  } catch (e) { return []; }
};
// Read one value; full = 'HKLM\\SOFTWARE\\...\\Name'. Returns null when missing; arrays for binary/multi-string.
OA.regRead = function (full) {
  var v;
  try { v = OA.sh.RegRead(full); } catch (e) { return null; }
  try { if (typeof v === 'unknown') { return new VBArray(v).toArray(); } } catch (e2) { }
  return v;
};
OA.regStr = function (full) { var v = OA.regRead(full); return (v === null || v === undefined) ? '' : String(v); };
OA.sysTimeToDate = function (b) {   // 16-byte SYSTEMTIME (UTC)
  if (!b || b.length < 16) { return null; }
  var y = b[0] + 256 * b[1], mo = b[2] + 256 * b[3], d = b[6] + 256 * b[7], h = b[8] + 256 * b[9], mi = b[10] + 256 * b[11], s = b[12] + 256 * b[13];
  if (y < 1990 || y > 2200 || mo < 1 || mo > 12) { return null; }
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s));
};
OA.unixToDate = function (n) { n = parseInt(n, 10); return (n > 0) ? new Date(n * 1000) : null; };

// ---------- WMI (cimv2) ----------
OA._wmi = null;
OA.wmi = function () {
  if (!OA._wmi) { OA._wmi = GetObject('winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\cimv2'); }
  return OA._wmi;
};
OA.wmiAll = function (cls) {
  var out = [], e;
  try { e = new Enumerator(OA.wmi().InstancesOf(cls)); for (; !e.atEnd(); e.moveNext()) { out.push(e.item()); } } catch (x) { OA.err('wmi ' + cls, x); }
  return out;
};
OA.wmiFirst = function (cls) { var a = OA.wmiAll(cls); return a.length ? a[0] : null; };

// ---------- vendor matching ----------
OA.vendorRx = null;      // matches the machine's own maker
OA.vendorShort = '';
OA.matchVendor = function (text) {      // '' or vendor short name (own maker first, then known OEMs)
  var i;
  text = String(text === null || text === undefined ? '' : text);
  if (text === '') { return ''; }
  if (OA.vendorRx && OA.vendorRx.test(text)) { return OA.vendorShort; }
  for (i = 0; i < OAV.vendors.length; i++) { if (OAV.vendors[i].rx.test(text)) { return OAV.vendors[i].s; } }
  return '';
};
OA.isOwnVendor = function (text) { return !!(OA.vendorRx && OA.vendorRx.test(String(text || ''))); };
OA.cleanMaker = function (raw) {
  var i, s = OA.trim(String(raw || ''));
  if (s === '' || OAV.junk.test(s)) { return ''; }
  for (i = 0; i < OAV.vendors.length; i++) { if (OAV.vendors[i].rx.test(s)) { return OAV.vendors[i].s; } }
  s = s.replace(OAV.stripWords, ' ');
  s = OA.trim(s.replace(/[,.]+/g, ' ').replace(/\s+/g, ' '));
  return s;
};
OA.cleanModel = function (raw, maker) {
  var s = OA.trim(String(raw || ''));
  if (s === '' || OAV.junk.test(s)) { return ''; }
  if (maker && OA.startsWith(s, maker + ' ')) { s = s.substr(maker.length + 1); }
  s = s.replace(/^(hewlett[- ]packard|hp|dell inc\.?|lenovo|asustek computer inc\.?|asus|acer|toshiba|sony|samsung)\s+/i, '');
  return OA.trim(s);
};
OA.junkFilter = function (s) { s = OA.trim(String(s === null || s === undefined ? '' : s)); return (s === '' || OAV.junk.test(s)) ? '' : s; };

// ---------- system profile ----------
OA.winName = function () {
  var P = OA.profile;
  if (P.major >= 10) { return P.build >= 22000 ? 'Win11' : 'Win10'; }
  if (P.major === 6) { if (P.minor >= 3) { return 'Win8.1'; } if (P.minor === 2) { return 'Win8'; } if (P.minor === 1) { return 'Win7'; } return 'Vista'; }
  if (P.major === 5) { if (P.minor >= 2) { return 'Win2003'; } if (P.minor === 1) { return 'WinXP'; } return 'Win2000'; }
  return 'Win' + P.major + '.' + P.minor;
};
OA.probeSystem = function () {
  var P = OA.profile, os, cs, csp, bios, v, i, t, d, key = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\';
  P.windir = OA.expand('%windir%');
  P.sysdrive = OA.expand('%SystemDrive%');
  P.sys32 = P.windir + '\\System32';
  P.progFiles = OA.expand('%ProgramFiles%');
  P.progFiles86 = OA.expand('%ProgramFiles(x86)%'); if (P.progFiles86 === '%ProgramFiles(x86)%') { P.progFiles86 = ''; }
  P.progData = OA.expand('%ProgramData%'); if (P.progData === '%ProgramData%') { P.progData = OA.expand('%ALLUSERSPROFILE%'); }
  P.userProfile = OA.expand('%USERPROFILE%');
  P.arch = OA.expand('%PROCESSOR_ARCHITECTURE%');

  os = OA.wmiFirst('Win32_OperatingSystem');
  if (os) {
    P.osCaption = OA.trim(os.Caption || '');
    v = String(os.Version || '').split('.');
    P.major = parseInt(v[0], 10); P.minor = parseInt(v[1], 10);
    P.build = parseInt(os.BuildNumber, 10);
    P.csd = OA.trim(os.CSDVersion || '');
  } else {
    P.osCaption = OA.regStr(key + 'ProductName');
    v = OA.regStr(key + 'CurrentVersion').split('.');
    P.major = parseInt(v[0], 10) || 5; P.minor = parseInt(v[1], 10) || 1;
    P.build = parseInt(OA.regStr(key + 'CurrentBuildNumber'), 10) || 0;
    P.csd = OA.regStr(key + 'CSDVersion');
  }
  if (OA.regRead(key + 'CurrentMajorVersionNumber') !== null) { P.major = parseInt(OA.regRead(key + 'CurrentMajorVersionNumber'), 10); P.minor = parseInt(OA.regRead(key + 'CurrentMinorVersionNumber'), 10) || 0; }
  P.family = (P.major >= 6) ? 'NT6' : 'NT5';
  P.winName = OA.winName();
  P.displayVersion = OA.regStr(key + 'DisplayVersion') || OA.regStr(key + 'ReleaseId');
  P.winSuffix = P.displayVersion;
  if (!P.winSuffix && P.csd) { t = /Service Pack (\d+)/i.exec(P.csd); P.winSuffix = t ? 'SP' + t[1] : P.csd.replace(/\s+/g, ''); }
  P.productName = OA.regStr(key + 'ProductName');
  P.productId = OA.regStr(key + 'ProductId');
  P.channel = /OEM/i.test(P.productId) ? 'OEM' : (P.productId ? 'Retail / Volume / other (no "OEM" in ProductId)' : 'unknown');
  P.installDate = OA.unixToDate(OA.regRead(key + 'InstallDate'));

  // maker / model / serial (WMI first, then OEM info files / registry fallbacks)
  cs = OA.wmiFirst('Win32_ComputerSystem');
  csp = OA.wmiFirst('Win32_ComputerSystemProduct');
  bios = OA.wmiFirst('Win32_BIOS');
  P.makerRaw = OA.junkFilter(cs ? cs.Manufacturer : '');
  P.modelRaw = OA.junkFilter(cs ? cs.Model : '');
  if (!P.makerRaw && csp) { P.makerRaw = OA.junkFilter(csp.Vendor); }
  if (!P.modelRaw && csp) { P.modelRaw = OA.junkFilter(csp.Name); }
  P.serial = OA.junkFilter(bios ? bios.SerialNumber : '');
  if (!P.serial && csp) { P.serial = OA.junkFilter(csp.IdentifyingNumber); }
  P.biosVendor = OA.junkFilter(bios ? bios.Manufacturer : '');
  P.makerSource = P.makerRaw ? 'WMI' : '';
  if (!P.makerRaw) {
    t = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation\\Manufacturer');
    if (OA.junkFilter(t)) { P.makerRaw = t; P.makerSource = 'OEMInformation registry'; }
  }
  if (!P.modelRaw) {
    t = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation\\Model');
    if (OA.junkFilter(t)) { P.modelRaw = t; }
  }
  if (!P.makerRaw) {
    t = OA.regStr('HKLM\\HARDWARE\\DESCRIPTION\\System\\BIOS\\SystemManufacturer');
    if (OA.junkFilter(t)) { P.makerRaw = t; P.makerSource = 'BIOS registry'; }
    t = OA.regStr('HKLM\\HARDWARE\\DESCRIPTION\\System\\BIOS\\SystemProductName');
    if (!P.modelRaw && OA.junkFilter(t)) { P.modelRaw = t; }
  }
  if (!P.makerRaw) {
    for (i = 0; i < 2; i++) {
      t = (i === 0 ? P.sys32 : P.windir + '\\SYSTEM') + '\\OEMINFO.INI';
      if (OA.fileExists(t)) {
        d = OA.readIni(t);
        if (d.general && OA.junkFilter(d.general.manufacturer)) { P.makerRaw = d.general.manufacturer; P.makerSource = 'OEMINFO.INI'; if (!P.modelRaw) { P.modelRaw = d.general.model || ''; } break; }
      }
    }
  }
  P.maker = OA.cleanMaker(P.makerRaw);
  P.model = OA.cleanModel(P.modelRaw, P.maker);
  for (i = 0; i < OAV.vendors.length; i++) { if (OAV.vendors[i].rx.test(P.makerRaw || '') || OAV.vendors[i].s === P.maker) { OA.vendorRx = OAV.vendors[i].rx; OA.vendorShort = OAV.vendors[i].s; break; } }
  if (!OA.vendorRx && P.maker) { OA.vendorRx = new RegExp('\\b' + OA.escRx(P.maker) + '\\b', 'i'); OA.vendorShort = P.maker; }
  P.microsoftOem = false;
  if (OA.vendorShort === 'Microsoft') { OA.vendorRx = null; OA.vendorShort = ''; P.microsoftOem = true; }   // Surface etc.: Microsoft is both OS vendor and OEM; publisher matching would flag everything

  // reference time: end of OOBE / first-user setup ("Factory" = before this, "Post" = after)
  P.oobeEnd = null; P.oobeSrc = '';
  if (P.family === 'NT6') {
    d = OA.sysTimeToDate(OA.regRead('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OOBE\\Stats\\EndTimeStamp'));
    if (d) { P.oobeEnd = d; P.oobeSrc = 'HKLM\\...\\OOBE\\Stats\\EndTimeStamp'; }
    if (!P.oobeEnd && OA.fileExists(P.windir + '\\Setup\\State\\State.ini')) {
      try { P.oobeEnd = new Date(OA.fso.GetFile(P.windir + '\\Setup\\State\\State.ini').DateLastModified); P.oobeSrc = '%windir%\\Setup\\State\\State.ini (last modified)'; } catch (e) { }
    }
  }
  if (!P.oobeEnd && P.installDate) { P.oobeEnd = P.installDate; P.oobeSrc = 'NT\\CurrentVersion\\InstallDate (may be rewritten by feature updates / Mini-Setup)'; }
  P.imageState = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Setup\\State\\ImageState');

  // tools
  P.tools = {};
  t = ['reg', 'robocopy', 'fsutil', 'dism', 'pnputil', 'icacls', 'certutil', 'xcopy', 'reagentc', 'attrib', 'regedit'];
  for (i = 0; i < t.length; i++) {
    P.tools[t[i]] = OA.fileExists(P.sys32 + '\\' + t[i] + '.exe') || (t[i] === 'regedit' && OA.fileExists(P.windir + '\\regedit.exe'));
  }
};
// Era of a file/record from its creation date relative to the end of OOBE
OA.eraOf = function (d) {
  var P = OA.profile;
  if (!P.oobeEnd || !d) { return ''; }
  try { return (d.getTime() <= P.oobeEnd.getTime()) ? 'Factory' : 'Post'; } catch (e) { return ''; }
};

// ---------- archive folder name ----------
OA.safeName = function (s, max) {
  s = String(s === null || s === undefined ? '' : s);
  s = s.replace(/[\\\/:*?"<>|\x00-\x1f]/g, '');
  s = s.replace(/\s+/g, '-').replace(/-{2,}/g, '-');
  s = s.replace(/^[\-_. ]+/, '').replace(/[\-_. ]+$/, '');
  if (max && s.length > max) { s = s.substr(0, max).replace(/[\-_. ]+$/, ''); }
  return s;
};
OA.joinName = function (parts) {
  var o = [], i, p;
  for (i = 0; i < parts.length; i++) { p = OA.safeName(parts[i], 48); if (p !== '') { o.push(p); } }
  return o.join('_');
};
OA.nameOptions = function () {
  var P = OA.profile, maker = P.maker || 'UnknownMaker', model = P.model || 'UnknownModel';
  var winv = P.winName + (P.winSuffix ? '-' + P.winSuffix : '');
  var dt = P.oobeEnd || P.installDate;
  return [
    { label: 'Maker_Model_WinVer',    value: OA.joinName([maker, model, winv]) },
    { label: 'Maker_Model_Serial',    value: OA.joinName([maker, model, P.serial || 'NoSerial']) },
    { label: 'ProductId_OOBEdate',    value: OA.joinName([P.productId || 'NoProductId', dt ? OA.fmtDay(dt) : 'NoDate']) }
  ];
};
OA.chooseName = function () {
  var opts = OA.nameOptions(), labels = [], i, idx, n;
  if (OA.args.name && OA.args.name !== true) { return OA.safeName(OA.args.name, 100) || opts[0].value; }
  for (i = 0; i < opts.length; i++) { labels.push(opts[i].label + '   ->  ' + opts[i].value); }
  labels.push('Custom (type your own name)');
  idx = OA.menu('Name for this OEM Archive folder?', labels, 0);
  if (idx < opts.length) { return opts[idx].value; }
  n = OA.safeName(OA.ask('Type the folder name', opts[0].value), 100);
  return n || opts[0].value;
};

// ---------- archive location ----------
OA.driveLabel = function (d) {
  var lab = '', free = '';
  try { lab = d.VolumeName || ''; } catch (e) { }
  try { free = OA.fmtSize(d.FreeSpace); } catch (e2) { }
  return d.DriveLetter + ': ' + (lab ? '[' + lab + '] ' : '') + '(' + free + ' free)';
};
OA.listLocations = function () {
  var L = [], P = OA.profile, docs = '', dl = '', t, e, d, sysLetter = P.sysdrive.charAt(0).toUpperCase();
  try { docs = OA.sh.SpecialFolders('MyDocuments'); } catch (x) { }
  if (docs) { L.push({ label: 'Documents  (' + docs + ')', path: docs, kind: 'docs' }); }
  t = OA.regStr('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders\\{374DE290-123F-4565-9164-39C4925E467B}');
  if (t) { dl = OA.expand(t); }
  if (!dl) { dl = P.userProfile + '\\Downloads'; }
  if (OA.dirExists(dl)) { L.push({ label: 'Downloads  (' + dl + ')', path: dl, kind: 'dl' }); }
  L.push({ label: 'Same folder as this script  (' + OA.fso.GetParentFolderName(WScript.ScriptFullName) + ')', path: OA.fso.GetParentFolderName(WScript.ScriptFullName), kind: 'script' });
  try {
    e = new Enumerator(OA.fso.Drives);
    for (; !e.atEnd(); e.moveNext()) {
      d = e.item();
      try {
        if (!d.IsReady) { continue; }
        if (d.DriveLetter.toUpperCase() === sysLetter) { continue; }
        if (d.DriveType === 1 || d.DriveType === 2) {
          L.push({ label: 'External / other drive  ' + OA.driveLabel(d) + (d.DriveType === 1 ? '  [removable]' : ''), path: d.DriveLetter + ':\\', kind: 'drive', removable: (d.DriveType === 1), letter: d.DriveLetter.toUpperCase() });
        }
      } catch (x2) { }
    }
  } catch (x3) { }
  L.push({ label: 'Custom directory...', path: null, kind: 'custom' });
  return L;
};
OA.pickFolder = function () {
  var f, sa;
  try {
    sa = new ActiveXObject('Shell.Application');
    f = sa.BrowseForFolder(0, 'Choose the folder that will hold the OEM Archive', 0x51, 17);
    if (f) { return f.Self.Path; }
  } catch (e) { }
  return '';
};
OA.chooseLocation = function () {
  var L, labels = [], i, def = 0, idx, p, sl;
  if (OA.args.out && OA.args.out !== true) { return OA.args.out; }
  L = OA.listLocations();
  try { sl = OA.fso.GetDriveName(WScript.ScriptFullName).charAt(0).toUpperCase(); } catch (e) { sl = ''; }
  for (i = 0; i < L.length; i++) { labels.push(L[i].label); if (L[i].kind === 'drive' && L[i].letter === sl && L[i].removable) { def = i; } }
  idx = OA.menu('Where should the OEM Archive be stored?', labels, def);
  p = L[idx].path;
  if (p === null) {
    p = OA.ask('Type a folder path (leave blank to open a folder picker)', '');
    if (!p) { p = OA.pickFolder(); }
    if (!p) { OA.say('  No folder chosen; using Documents.'); p = L[0].path; }
  }
  return p;
};
// Nesting rule: <chosen>\OEM Archive\<name>, unless the chosen folder is itself named "Archive" or "OEM Archive"
OA.resolveArchiveRoot = function (chosen, name) {
  var c = String(chosen).replace(/[\\\/]+$/, ''), leaf;
  leaf = c.replace(/^.*[\\\/]/, '');
  if (/^(oem )?archive$/i.test(leaf)) { return c + '\\' + name; }
  return c + '\\OEM Archive\\' + name;
};
OA.uniqueDir = function (p) {
  var n = 2, q = p;
  while (OA.dirExists(q)) { q = p + '_' + n; n++; }
  return q;
};

// ---------- item model ----------
OA.destRelFor = function (gid, src, sub) {
  var d = OA.groupDir(gid) + (sub ? '\\' + sub : ''), m;
  m = /^([A-Za-z]):(.*)$/.exec(src);
  if (m) { return d + '\\' + m[1].toUpperCase() + m[2]; }
  m = /^\\\\([^\\]+)\\(.*)$/.exec(src);
  if (m) { return d + '\\UNC\\' + m[1] + '\\' + m[2]; }
  return d + '\\' + src;
};
OA.excludeRoot = '';     // lower-case path of the archive being written; never scanned
// treeRoots entries are { r: lower-case root, cat: category }. A path is "covered" only by a tree of the SAME
// category, so a branding file inside a software folder (e.g. the OEM logo in ProgramData\HP) is still listed
// under branding and is copied by branding-only runs.
OA.covered = function (src, cat) {
  var s = OA.lc(src), i, r;
  if (OA.excludeRoot && (s === OA.excludeRoot || s.indexOf(OA.excludeRoot + '\\') === 0)) { return true; }
  for (i = 0; i < OA.treeRoots.length; i++) {
    r = OA.treeRoots[i];
    if (r.cat === cat && (s === r.r || s.indexOf(r.r + '\\') === 0)) { return true; }
  }
  return false;
};
OA.nothing = function (gid, what) {
  if (!OA.searched[gid]) { OA.searched[gid] = []; }
  OA.searched[gid].push(what);
};
OA.isNeverCopy = function (src) {
  var b = OA.lc(OA.leaf(src)), i;
  for (i = 0; i < OAV.neverCopy.length; i++) {
    if (b === OAV.neverCopy[i]) { OA.excluded.push({ src: src, reason: 'customer registration / secret data - never archived' }); return true; }
  }
  return false;
};
OA.addFile = function (gid, src, why, conf, ex) {
  var f, it, key = OA.lc(src), cat;
  ex = ex || {};
  cat = ex.cat || OA.groupById(gid).cat;
  if (OA.seen[key] || OA.covered(src, cat)) { return null; }
  if (OA.isNeverCopy(src)) { return null; }
  try { f = OA.fso.GetFile(src); } catch (e) { OA.err('stat ' + src, e); return null; }
  it = { kind: 'file', gid: gid, src: src, size: f.Size, mtime: OA.toDate(f.DateLastModified), ctime: OA.toDate(f.DateCreated),
         why: why, conf: conf, sub: ex.sub || '', cat: cat, status: '', note: '' };
  it.destRel = ex.destRel || OA.destRelFor(gid, src, ex.sub);
  it.era = OA.eraOf(it.ctime);
  if (ex.era) { it.era = ex.era; }
  OA.seen[key] = true;
  OA.items.push(it);
  if (it.size < 2097152 && /(unattend|sysprep|winbom|\$winnt\$|answer)[^\\]*\.(inf|xml|ini)$/i.test(src)) {
    if (/(ProductKey|AdminPassword|DomainAdminPassword|JoinPassword|<Password>)/i.test(OA.readText(src))) { OA.sensitive.push(src); }
  }
  return it;
};
OA.addTree = function (gid, src, why, conf, ex) {
  var fo, it, key = OA.lc(src), i, r, kept = [], cat;
  ex = ex || {};
  cat = ex.cat || OA.groupById(gid).cat;
  if (OA.seen[key] || OA.covered(src, cat)) { return null; }
  if (!OA.dirExists(src)) { OA.nothing(gid, 'folder not present: ' + src); return null; }
  try { fo = OA.fso.GetFolder(src); } catch (e) { OA.err('open ' + src, e); return null; }
  it = { kind: 'tree', gid: gid, src: src, size: -1, mtime: null, ctime: null, why: why, conf: conf, sub: ex.sub || '',
         cat: cat, status: '', note: '' };
  try { it.size = fo.Size; } catch (e2) { it.note = 'size unavailable (access denied?)'; }
  try { it.ctime = OA.toDate(fo.DateCreated); it.mtime = OA.toDate(fo.DateLastModified); } catch (e3) { }
  if (it.size === 0 && !ex.keepEmpty) { OA.nothing(gid, 'folder present but empty: ' + src); return null; }
  it.destRel = ex.destRel || OA.destRelFor(gid, src, ex.sub);
  it.era = ex.era || OA.eraOf(it.ctime);
  // drop earlier file/tree items of the same category that this tree now covers
  r = key + '\\';
  for (i = 0; i < OA.items.length; i++) {
    if ((OA.items[i].kind === 'file' || OA.items[i].kind === 'tree') && OA.items[i].cat === cat && OA.lc(OA.items[i].src).indexOf(r) === 0) { continue; }
    kept.push(OA.items[i]);
  }
  OA.items = kept;
  kept = [];
  for (i = 0; i < OA.treeRoots.length; i++) { if (!(OA.treeRoots[i].cat === cat && OA.treeRoots[i].r.indexOf(r) === 0)) { kept.push(OA.treeRoots[i]); } }
  OA.treeRoots = kept;
  OA.seen[key] = true;
  OA.treeRoots.push({ r: key, cat: cat });
  OA.items.push(it);
  return it;
};
OA.HKU = 2147483651;
OA.regPathParts = function (full) {
  var m = /^(HKLM|HKEY_LOCAL_MACHINE|HKCU|HKEY_CURRENT_USER|HKU|HKEY_USERS)\\(.*)$/i.exec(full);
  if (!m) { return null; }
  return { hive: /^HKLM|^HKEY_LOCAL/i.test(m[1]) ? OA.HKLM : (/^HKU|^HKEY_USERS/i.test(m[1]) ? OA.HKU : OA.HKCU), path: m[2] };
};
OA.addReg = function (gid, full, name, why) {
  var p = OA.regPathParts(full), it, key = 'reg:' + OA.lc(full);
  if (OA.seen[key]) { return null; }
  if (!p || !OA.regKeyExists(p.hive, p.path)) { OA.nothing(gid, 'registry key not present: ' + full); return null; }
  it = { kind: 'reg', gid: gid, src: full, size: 0, why: why, conf: 'HIGH', sub: '', cat: OA.groupById(gid).cat, status: '', note: '', era: '',
         destRel: '00_Transcript\\registry\\' + OA.safeName(name, 80) + '.reg' };
  OA.seen[key] = true;
  OA.items.push(it);
  return it;
};
OA.addNote = function (gid, name, text, why, conf) {
  var it = { kind: 'note', gid: gid, src: '(captured text) ' + name, size: String(text).length, why: why, conf: conf || 'HIGH', sub: '', cat: OA.groupById(gid).cat,
             status: '', note: '', era: '', text: text, destRel: OA.groupDir(gid) + '\\_info\\' + OA.safeName(name, 80) + '.txt' };
  OA.items.push(it);
  return it;
};
OA.checkFile = function (gid, path, why, conf, ex) {
  if (OA.fileExists(path)) { return OA.addFile(gid, path, why, conf, ex); }
  OA.nothing(gid, 'file not present: ' + path);
  return null;
};
OA.checkTree = function (gid, path, why, conf, ex) {
  if (OA.dirExists(path)) { return OA.addTree(gid, path, why, conf, ex); }
  OA.nothing(gid, 'folder not present: ' + path);
  return null;
};
OA.walkFiles = function (dir, recurse, cb) {
  var fo, e, f;
  try { fo = OA.fso.GetFolder(dir); } catch (x) { OA.err('open ' + dir, x); return; }
  try { for (e = new Enumerator(fo.Files); !e.atEnd(); e.moveNext()) { cb(e.item()); } } catch (x2) { OA.err('list ' + dir, x2); }
  if (recurse) {
    try {
      for (e = new Enumerator(fo.SubFolders); !e.atEnd(); e.moveNext()) {
        f = e.item();
        try { if (f.Attributes & 1024) { continue; } } catch (x4) { }
        OA.walkFiles(f.Path, true, cb);
      }
    } catch (x3) { OA.err('list ' + dir, x3); }
  }
};
OA.subDirs = function (dir) {
  var out = [], e, fo;
  try { fo = OA.fso.GetFolder(dir); for (e = new Enumerator(fo.SubFolders); !e.atEnd(); e.moveNext()) { out.push(e.item()); } } catch (x) { }
  return out;
};

// ---------- "is this a stock Windows file?" tests ----------
OA._owners = {};
OA.loadOwners = function (dir) {
  var r = OA.exec('dir /q /-c /a-d "' + dir + '"'), lines = r.out.split('\n'), i, m, map = {}, n = 0;
  for (i = 0; i < lines.length; i++) {
    m = /^\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}\s+\d{1,2}[:.]\d{2}(?:\s*[AaPp]\.?[Mm]\.?)?\s+(\d+)\s(.{23})(.+?)\s*$/.exec(lines[i]);
    if (m) { map[OA.lc(m[3])] = OA.trim(m[2]); n++; }
  }
  return map;
};
OA.ownerOf = function (path) {
  var dir = OA.parent(path), key = OA.lc(dir);
  if (!OA._owners[key]) { OA._owners[key] = OA.loadOwners(dir); }
  return OA._owners[key][OA.lc(OA.leaf(path))] || '';
};
OA.hasWinSxSLink = function (path) {
  var r;
  if (!OA.profile.tools.fsutil) { return null; }
  r = OA.exec('fsutil hardlink list "' + path + '"');
  if (r.code !== 0) { return null; }
  return /\\WinSxS\\|\\servicing\\/i.test(r.out);
};
OA.stockCheck6 = function (path) {
  var owner = OA.ownerOf(path), link;
  if (/^NT SERVICE\\TrustedInsta/i.test(owner)) { return { oem: false, why: 'owner TrustedInstaller' }; }
  link = OA.hasWinSxSLink(path);
  if (link === true) { return { oem: false, why: 'hard-linked into WinSxS' }; }
  if (link === false) { return { oem: true, conf: 'MED', why: 'not TrustedInstaller-owned (' + (owner || 'owner unknown') + '); no WinSxS hard link' }; }
  return { oem: true, conf: 'LOW', why: 'owner ' + (owner || 'unknown') + '; hard-link test unavailable' };
};
// NT5: names listed in layout.inf [SourceDisksFiles*] or present in system32\dllcache are stock
OA._layout = null;
OA.loadLayout = function () {
  var txt, lines, i, ln, m, inSec = false, names = {}, e, dc;
  txt = OA.readText(OA.profile.windir + '\\inf\\layout.inf');
  lines = txt.split('\n');
  for (i = 0; i < lines.length; i++) {
    ln = OA.trim(lines[i]);
    if (ln.charAt(0) === '[') { inSec = /^\[sourcedisksfiles/i.test(ln); continue; }
    if (!inSec || ln === '' || ln.charAt(0) === ';') { continue; }
    m = /^"?([^"=]+?)"?\s*=/.exec(ln);
    if (m) { names[OA.lc(OA.trim(m[1]))] = true; }
  }
  dc = OA.profile.sys32 + '\\dllcache';
  if (OA.dirExists(dc)) { try { for (e = new Enumerator(OA.fso.GetFolder(dc).Files); !e.atEnd(); e.moveNext()) { names[OA.lc(e.item().Name)] = true; } } catch (x) { } }
  OA._layoutCount = 0; for (m in names) { OA._layoutCount++; }
  return names;
};
OA.stockCheck5 = function (path) {
  var sn = '';
  if (!OA._layout) { OA._layout = OA.loadLayout(); }
  if (OA._layoutCount < 500) { return { oem: true, conf: 'LOW', why: 'layout.inf unavailable; cannot tell stock from OEM (compare with a clean install)' }; }
  if (OA._layout[OA.lc(OA.leaf(path))]) { return { oem: false, why: 'listed in layout.inf / dllcache' }; }
  try { sn = OA.lc(OA.fso.GetFile(path).ShortName); } catch (e) { }   // layout.inf uses 8.3 names for some long-named files
  if (sn && OA._layout[sn]) { return { oem: false, why: 'listed in layout.inf / dllcache (8.3 name)' }; }
  return { oem: true, conf: 'MED', why: 'not listed in layout.inf [SourceDisksFiles] and not in dllcache' };
};
OA.stockCheck = function (path) {
  if (OA.base && OA.base.active) { return OA.stockCheckBaseline(path); }
  return (OA.profile.family === 'NT6') ? OA.stockCheck6(path) : OA.stockCheck5(path);
};

// Scan a Windows-owned folder and add every file that does not look stock.
// opts: flat (no recursion), rx (name filter), why (prefix), sub, skipRx (names to ignore)
OA.scanStockDir = function (gid, dir, opts) {
  var found = 0, checked = 0;
  opts = opts || {};
  if (!OA.dirExists(dir)) { OA.nothing(gid, 'folder not present: ' + dir); return 0; }
  OA.walkFiles(dir, !opts.flat, function (f) {
    var r, nm = f.Name;
    if (/^(desktop\.ini|thumbs\.db)$/i.test(nm)) { return; }
    if (opts.rx && !opts.rx.test(nm)) { return; }
    if (opts.skipRx && opts.skipRx.test(nm)) { return; }
    checked++;
    r = OA.stockCheck(f.Path);
    if (r.oem && OA.addFile(gid, f.Path, (opts.why ? opts.why + ': ' : '') + r.why, opts.conf || r.conf, { sub: opts.sub })) { found++; }
  });
  if (!found) { OA.nothing(gid, 'no non-stock files in ' + dir + ' (' + checked + ' files checked)'); }
  return found;
};

// ---------- sizes, presets and the selection pages ----------
OA.sum = function (fn) {
  var i, n = 0, s = 0, it;
  for (i = 0; i < OA.items.length; i++) { it = OA.items[i]; if (fn(it)) { n++; if (it.size > 0) { s += it.size; } } }
  return { n: n, size: s };
};
OA.itemSelected = function (it) {
  var m = OA.modes;
  if (it.cat === 'drivers') { return m.drivers === 'full' && (it.sub !== 'PostDelivery-OEMVendor' || m.postDrivers); }
  if (it.cat === 'software') { return m.software === 'all' && (it.era !== 'Post' || m.postSoftware); }
  return m.branding === 'copy' && !m.groupsOff[it.gid];
};
// Presets: 1 Everything, 2 Branding + drivers + software manifest, 3 Branding only, 4 Drivers only, 5 Software only,
// 6 FAT32-safe (everything, but files of 4 GB or more are skipped: FAT32 cannot store them), 7 Custom.
// Presets apply NO limits (except 6); limits are only set on the Adjust pages or with /cap and /totalcap.
OA.DEFAULT_CAP_MB = 0;
OA.DEFAULT_TOTALCAP_GB = 0;
OA.FAT32_CAP_MB = 4095;
OA.applyPreset = function (n) {
  var m = OA.modes, cap = parseInt(OA.args.cap, 10), tcap = parseInt(OA.args.totalcap, 10);
  m.groupsOff = {};
  m.cap = OA.DEFAULT_CAP_MB; m.totalCap = OA.DEFAULT_TOTALCAP_GB;
  if (n === 1 || n === 6 || n === 7) { m.branding = 'copy'; m.drivers = 'full'; m.software = 'all'; }
  if (n === 6) { m.cap = OA.FAT32_CAP_MB; }
  if (n === 2) { m.branding = 'copy'; m.drivers = 'full'; m.software = 'manifest'; }
  if (n === 3) { m.branding = 'copy'; m.drivers = 'skip'; m.software = 'skip'; }
  if (n === 4) { m.branding = 'skip'; m.drivers = 'full'; m.software = 'skip'; }
  if (n === 5) { m.branding = 'skip'; m.drivers = 'skip'; m.software = 'all'; }
  if (cap >= 0 && OA.args.cap) { m.cap = cap; }
  if (tcap >= 0 && OA.args.totalcap) { m.totalCap = tcap; }
};
OA.totalCapBytes = function () { return OA.modes.totalCap > 0 ? OA.modes.totalCap * 1073741824 : 0; };
OA.effectiveSize = function (n) { var c = OA.totalCapBytes(); return (c > 0 && n > c) ? c : n; };
OA.presetEstimate = function (n) {
  var save = OA.copyModes(), r;
  OA.applyPreset(n);
  r = OA.sum(function (it) { return OA.itemSelected(it); });
  OA.modes = save;
  return r;
};
OA.copyModes = function () {
  var m = OA.modes, g = {}, k;
  for (k in m.groupsOff) { g[k] = m.groupsOff[k]; }
  return { branding: m.branding, drivers: m.drivers, software: m.software, cap: m.cap, totalCap: m.totalCap, postDrivers: m.postDrivers, postSoftware: m.postSoftware, groupsOff: g };
};
OA.selectedItems = function () {
  var out = [], i;
  for (i = 0; i < OA.items.length; i++) { if (OA.itemSelected(OA.items[i])) { out.push(OA.items[i]); } }
  return out;
};
OA.groupSummary = function () {
  var out = [], i, s;
  for (i = 0; i < OA.groups.length; i++) {
    s = OA.sum((function (gid) { return function (it) { return it.gid === gid; }; })(OA.groups[i].id));
    out.push({ g: OA.groups[i], n: s.n, size: s.size });
  }
  return out;
};
OA.modeText = function () {
  var m = OA.modes, off = [], k, t;
  for (k in m.groupsOff) { if (m.groupsOff[k]) { off.push(k); } }
  t = 'Branding: ' + m.branding + (off.length ? ' (groups off: ' + off.join(',') + ')' : '') + ' | Drivers: ' + m.drivers + (m.drivers === 'full' ? (m.postDrivers ? ' +post-delivery OEM drivers' : '') : '') +
      ' | Software: ' + m.software + (m.software === 'all' ? (m.postSoftware ? ' (+post-delivery OEM software)' : ' (factory only)') : '') + ' | Per-file cap: ' + (m.cap > 0 ? m.cap + ' MB' + (m.cap === OA.FAT32_CAP_MB ? ' (FAT32 file-size limit)' : '') : 'none') + ' | Total cap: ' + (m.totalCap > 0 ? m.totalCap + ' GB' : 'none');
  return t;
};
OA.pageBranding = function () {
  var gs, i, line, ans, parts, j, n, gid, idx;
  while (true) {
    gs = OA.groupSummary();
    OA.say(''); OA.say('--- Page 2: Branding and customization ---');
    for (i = 0; i < gs.length; i++) {
      if (gs[i].g.cat !== 'branding') { continue; }
      OA.say('  [' + (OA.modes.groupsOff[gs[i].g.id] ? ' ' : 'x') + '] ' + gs[i].g.id + ' ' + gs[i].g.title + '  -  ' + gs[i].n + ' items, ' + OA.fmtSize(gs[i].size));
    }
    ans = OA.ask('Type group numbers to toggle (e.g. 05,06) or press Enter to continue', '');
    if (!ans) { break; }
    parts = ans.replace(/[;\s]+/g, ',').split(',');
    for (j = 0; j < parts.length; j++) { if (parts[j]) { gid = OA.pad(parseInt(parts[j], 10), 2); if (OA.groupById(gid) && OA.groupById(gid).cat === 'branding') { OA.modes.groupsOff[gid] = !OA.modes.groupsOff[gid]; } } }
    if (OA.noInput) { break; }
  }
  idx = OA.menu('Branding and customization: copy the selected groups?', ['Copy selected groups', 'Skip all branding'], OA.modes.branding === 'copy' ? 0 : 1);
  OA.modes.branding = (idx === 0) ? 'copy' : 'skip';
};
OA.pageDrivers = function () {
  var f = OA.sum(function (it) { return it.cat === 'drivers' && it.sub !== 'PostDelivery-OEMVendor'; });
  var p = OA.sum(function (it) { return it.cat === 'drivers' && it.sub === 'PostDelivery-OEMVendor'; });
  var idx, cur = OA.modes.drivers === 'full' ? 0 : (OA.modes.drivers === 'manifest' ? 1 : 2);
  OA.say(''); OA.say('--- Page 3: Drivers ---');
  OA.say('  Factory driver packages / staged driver folders: ' + f.n + ' items, ' + OA.fmtSize(f.size));
  OA.say('  Post-delivery OEM-vendor driver packages:        ' + p.n + ' items, ' + OA.fmtSize(p.size));
  OA.say('  Driver inventory (driver-manifest.csv): ' + OA.drivers.length + ' packages listed');
  idx = OA.menu('Drivers: what to do?', ['Full driver packages (+ manifest)', 'Manifest only (driver-manifest.csv, no files)', 'Skip drivers'], cur);
  OA.modes.drivers = ['full', 'manifest', 'skip'][idx];
  if (idx === 0 && p.n > 0) { OA.modes.postDrivers = OA.yesno('Also copy post-delivery OEM-vendor drivers?', OA.modes.postDrivers); }
};
OA.pageSoftware = function () {
  var f = OA.sum(function (it) { return it.cat === 'software' && it.era !== 'Post'; });
  var p = OA.sum(function (it) { return it.cat === 'software' && it.era === 'Post'; });
  var idx, cur = OA.modes.software === 'all' ? 0 : (OA.modes.software === 'manifest' ? 1 : 2);
  OA.say(''); OA.say('--- Page 4: Software ---');
  OA.say('  Program folders / staged installers (factory era or unknown): ' + f.n + ' items, ' + OA.fmtSize(f.size));
  OA.say('  Program folders / staged installers installed after OOBE:     ' + p.n + ' items, ' + OA.fmtSize(p.size));
  OA.say('  Software inventory (software-manifest.csv): ' + OA.software.length + ' entries');
  idx = OA.menu('Software: what to do?', ['All software (program folders + staged installers + manifest)', 'Manifest only (software-manifest.csv, no files)', 'Skip software'], cur);
  OA.modes.software = ['all', 'manifest', 'skip'][idx];
  if (idx === 0 && p.n > 0) { OA.modes.postSoftware = OA.yesno('Include software installed after OOBE (OEM utilities that updated themselves)?', OA.modes.postSoftware); }
};
OA.pageLimits = function () {
  var a;
  OA.say(''); OA.say('--- Limits ---');
  OA.say('  Files larger than the per-file cap are skipped and listed in the transcript. (4095 MB = the FAT32 limit.)');
  OA.say('  Copying stops adding items once the archive would pass the total cap.  0 = no limit.');
  a = parseInt(OA.ask('Per-file cap in MB', String(OA.modes.cap)), 10);
  if (a >= 0) { OA.modes.cap = a; }
  a = parseInt(OA.ask('Total cap in GB', String(OA.modes.totalCap)), 10);
  if (a >= 0) { OA.modes.totalCap = a; }
};
OA.adjustPages = function () { OA.pageBranding(); OA.pageDrivers(); OA.pageSoftware(); OA.pageLimits(); };
OA.selectionPages = function (freeBytes) {
  var labels, est, i, idx, def, names, sw = false, a, tot, sel, ans;
  names = ['Everything', 'Branding + drivers, software manifest only', 'Branding only', 'Drivers only', 'Software only', 'FAT32-safe: everything, skipping files of 4 GB or more (for FAT32 USB sticks)', 'Custom (go straight to the Adjust pages)'];
  if (OA.args.preset || OA.args.branding || OA.args.drivers || OA.args.software) {
    sw = true;
    OA.applyPreset(parseInt(OA.args.preset, 10) || 1);
    if (OA.args.branding === 'copy' || OA.args.branding === 'skip') { OA.modes.branding = OA.args.branding; }
    if (OA.args.drivers === 'full' || OA.args.drivers === 'manifest' || OA.args.drivers === 'skip') { OA.modes.drivers = OA.args.drivers; }
    if (OA.args.software === 'all' || OA.args.software === 'full' || OA.args.software === 'manifest' || OA.args.software === 'skip') { OA.modes.software = (OA.args.software === 'full') ? 'all' : OA.args.software; }
    if (OA.args.postdrivers) { OA.modes.postDrivers = true; }
    if (OA.args.postsoftware === 'off') { OA.modes.postSoftware = false; }
    return;
  }
  while (true) {
    labels = []; est = [];
    for (i = 1; i <= 7; i++) { est[i] = (i < 7) ? OA.presetEstimate(i) : null; }
    for (i = 0; i < 7; i++) { labels.push(names[i] + (est[i + 1] ? '   est. ' + OA.fmtSize(OA.effectiveSize(est[i + 1].size)) : '')); }
    def = (freeBytes > 0 && est[1].size > freeBytes * 0.95) ? 1 : 0;
    OA.say(''); OA.say('--- Page 1: Preset ---');
    idx = OA.menu('What do you want to copy?', labels, def);
    OA.applyPreset(idx + 1);
    if (idx + 1 === 7) { OA.adjustPages(); }
    while (true) {
      sel = OA.sum(function (it) { return OA.itemSelected(it); });
      OA.say(''); OA.say('--- Summary ---');
      OA.say('  ' + OA.modeText());
      OA.say('  Files/folders to copy: ' + sel.n + ', estimated ' + OA.fmtSize(OA.effectiveSize(sel.size)) + (freeBytes > 0 ? ', target free space ' + OA.fmtSize(freeBytes) : ', target free space unknown'));
      ans = OA.menu('Continue?', ['Confirm and copy', 'Adjust (branding / drivers / software / limits)', 'Back to the preset page', 'Cancel'], 0);
      if (ans === 0) { return; }
      if (ans === 1) { OA.adjustPages(); continue; }
      if (ans === 3) { OA.say('Cancelled. Nothing was copied.'); OA.finish(0); }
      break;
    }
  }
};
OA.finish = function (code) {
  if (OA.args.elevated || OA.args.pause) { OA.say(''); OA.pause(); }
  WScript.Quit(code);
};

// ---------- free space ----------
OA.freeSpace = function (path) {
  try { return OA.fso.GetDrive(OA.fso.GetDriveName(OA.fso.GetAbsolutePathName(path))).AvailableSpace; } catch (e) { return -1; }
};

// ---------- copy engine ----------
OA.resuming = false;
OA.copyFileSafe = function (src, dest) {
  var sd, dd, nm, rc;
  if (OA.resuming) {   // resume: keep a file that is already there with the same size
    try { if (OA.fso.FileExists(dest) && OA.fso.GetFile(dest).Size === OA.fso.GetFile(src).Size) { return { ok: true, note: 'already present (resume)' }; } } catch (e0) { }
  }
  try {
    OA.mkdirp(OA.fso.GetParentFolderName(dest));
    OA.fso.CopyFile(src, dest, true);
    if (OA.fso.FileExists(dest)) { return { ok: true, note: '' }; }
  } catch (e) { OA.lastCopyErr = (e && e.message) ? e.message : String(e); }
  if (OA.profile.tools.robocopy) {   // fallback: backup mode / long paths
    sd = OA.fso.GetParentFolderName(src); dd = OA.fso.GetParentFolderName(dest); nm = OA.fso.GetFileName(src);
    rc = OA.run('robocopy "' + sd + '" "' + dd + '" "' + nm + '" ' + (OA.profile.admin ? '/B ' : '') + '/R:0 /W:0 /NP /NFL /NDL /NJH /NJS /COPY:DAT');
    if (OA.fso.FileExists(dest) && rc < 8) { return { ok: true, note: 'copied with robocopy fallback' }; }
  }
  return { ok: false, note: OA.lastCopyErr || 'copy failed' };
};
OA.copyTree = function (it, destDir, capBytes) {
  var src = it.src, cmd, rc, files = [], tot = 0, bad = 0, skipped = 0, rel, d, ok, sz, copied = 0;
  it.files = [];
  OA.mkdirp(destDir);
  if (capBytes > 0 && !OA.profile.tools.robocopy) {
    OA.walkFiles(src, true, function (f) {
      var rl = f.Path.substr(src.length + 1), r, s = f.Size;
      if (s > capBytes) { it.files.push({ rel: rl, size: s, st: 'skipped-cap' }); skipped++; return; }
      r = OA.copyFileSafe(f.Path, destDir + '\\' + rl);
      it.files.push({ rel: rl, size: s, st: r.ok ? 'copied' : 'FAILED', note: r.note });
      if (r.ok) { copied++; } else { bad++; }
    });
  } else {
    if (OA.profile.tools.robocopy) {
      rc = OA.run('robocopy "' + src + '" "' + destDir + '" /E ' + (OA.profile.admin ? '/B ' : '') + '/XJ /R:1 /W:1 /NP /NFL /NDL /NJH /NJS /COPY:DAT /DCOPY:T' + (capBytes > 0 ? ' /MAX:' + capBytes : ''));
      if (rc >= 8) { it.note = 'robocopy exit code ' + rc + ' (some files may have failed)'; }
    } else if (OA.profile.tools.xcopy) {
      rc = OA.run('xcopy "' + src + '\\*" "' + destDir + '\\" /E /I /H /K /C /Y /Q');
      if (rc !== 0) { it.note = 'xcopy exit code ' + rc; }
    } else {
      try { OA.fso.CopyFolder(src, destDir, true); } catch (e) { it.note = 'CopyFolder failed: ' + e.message; }
    }
    OA.walkFiles(src, true, function (f) {
      var rl = f.Path.substr(src.length + 1), dp = destDir + '\\' + rl, good = false, s = f.Size, nt = '';
      if (capBytes > 0 && s > capBytes) { it.files.push({ rel: rl, size: s, st: 'skipped-cap' }); skipped++; return; }
      if (dp.length >= 259) {   // FileSystemObject cannot see long paths: trust robocopy's exit code
        good = (rc !== undefined && (OA.profile.tools.robocopy ? rc < 8 : rc === 0)); nt = good ? 'path longer than 259 characters; verified by the copy tool exit code only' : 'path longer than 259 characters; could not verify';
      } else {
        try { good = OA.fso.FileExists(dp) && OA.fso.GetFile(dp).Size === s; } catch (e2) { good = false; }
      }
      it.files.push({ rel: rl, size: s, st: good ? 'copied' : 'FAILED', note: nt });
      if (good) { copied++; } else { bad++; }
    });
  }
  it.filesCopied = copied; it.filesFailed = bad; it.filesSkipped = skipped;
  it.status = (bad === 0 && it.files.length === copied + skipped) ? 'copied' : (copied > 0 ? 'partial' : 'failed');
  if (copied === 0 && it.files.length === 0 && !it.note) { it.status = 'copied'; it.note = 'folder is empty'; }
};
OA.exportReg = function (it, dest) {
  var key = it.src, rc, k2;
  OA.mkdirp(OA.fso.GetParentFolderName(dest));
  if (OA.profile.tools.reg) { rc = OA.run('reg export "' + key + '" "' + dest + '" /y'); }
  else if (OA.profile.tools.regedit) { k2 = key.replace(/^HKLM\\/i, 'HKEY_LOCAL_MACHINE\\').replace(/^HKCU\\/i, 'HKEY_CURRENT_USER\\').replace(/^HKU\\/i, 'HKEY_USERS\\'); rc = OA.run('regedit /e "' + dest + '" "' + k2 + '"'); }
  return OA.fso.FileExists(dest);
};
OA.copyAll = function (root) {
  var sel = OA.selectedItems(), i, it, dest, cap = OA.modes.cap > 0 ? OA.modes.cap * 1048576 : 0, r, n = sel.length, dots = 0, tcap = OA.totalCapBytes(), done = 0, sz, tot = 0;
  OA.mkdirp(root + '\\00_Transcript\\registry');
  OA.say('');
  OA.say((OA.resuming ? 'Resuming: copying ' : 'Copying ') + n + ' items to ' + root);
  for (i = 0; i < n; i++) { if (sel[i].size > 0) { tot += sel[i].size; } }
  OA.progressStart(tot, n);
  for (i = 0; i < OA.items.length; i++) { if (!OA.itemSelected(OA.items[i])) { OA.items[i].status = 'not-copied'; } }
  for (i = 0; i < n; i++) {
    it = sel[i];
    dest = root + '\\' + it.destRel;
    sz = (it.size > 0) ? it.size : 0;
    if (tcap > 0 && it.kind !== 'reg' && it.kind !== 'note' && done + sz > tcap) { it.status = 'skipped-total'; it.note = 'would pass the ' + OA.modes.totalCap + ' GB total cap'; OA.progress(sz); continue; }
    try {
      if (it.kind === 'file') {
        if (cap > 0 && it.size > cap) { it.status = 'skipped-cap'; it.note = 'larger than the ' + OA.modes.cap + ' MB cap'; OA.progress(sz); continue; }
        r = OA.copyFileSafe(it.src, dest);
        it.status = r.ok ? 'copied' : 'FAILED'; it.note = r.note;
      } else if (it.kind === 'tree') {
        OA.copyTree(it, dest, cap);
      } else if (it.kind === 'reg') {
        it.status = OA.exportReg(it, dest) ? 'copied' : 'FAILED';
        if (it.status === 'copied') { try { it.size = OA.fso.GetFile(dest).Size; } catch (e4) { } }
      } else if (it.kind === 'note') {
        OA.writeText(dest, it.text, true);
        it.status = 'copied';
      }
    } catch (e) { it.status = 'FAILED'; it.note = (e && e.message) ? e.message : String(e); OA.err('copy ' + it.src, e); }
    if (it.status === 'copied' || it.status === 'partial') { done += sz; }
    OA.progress(sz);
  }
  OA.say('');
};

// ---------- reports ----------
OA.statusMark = function (s) { return s === 'copied' ? 'OK    ' : (/^skipped/.test(s) ? 'SKIP  ' : (s === 'not-copied' ? 'NOT   ' : (s === 'partial' ? 'PART  ' : 'FAIL  '))); };
OA.itemLine = function (it) {
  var s = '  [' + (it.conf || '') + '] ' + OA.statusMark(it.status) + it.src;
  if (it.destRel) { s += '  ->  ' + it.destRel; }
  s += '  (' + OA.fmtSize(it.size) + ')';
  if (it.era) { s += '  {' + it.era + '}'; }
  if (it.why) { s += '\r\n          why: ' + it.why; }
  if (it.note) { s += '\r\n          note: ' + it.note; }
  return s;
};
OA.buildTranscript = function (root) {
  var L = [], P = OA.profile, gi, g, gitems, i, j, it, k, s, copiedN = 0, failedN = 0, skippedN = 0, notN = 0, bytes = 0, fl;
  L.push('OEM ARCHIVE TRANSCRIPT');
  L.push('======================');
  L.push('Created by OEM-Archiver ' + OA.version + ' (' + P.family + ' script) on ' + OA.fmtDate(new Date()));
  L.push('Archive folder : ' + root);
  L.push('Machine        : ' + (P.makerRaw || '?') + ' / ' + (P.modelRaw || '?') + (P.serial ? '  (serial recorded in system-profile.txt)' : ''));
  L.push('Windows        : ' + P.osCaption + '  ' + P.major + '.' + P.minor + '.' + P.build + (P.displayVersion ? ' (' + P.displayVersion + ')' : '') + (P.csd ? ' ' + P.csd : ''));
  L.push('ProductId      : ' + P.productId + '   channel: ' + P.channel);
  L.push('OOBE finished  : ' + (P.oobeEnd ? OA.fmtDate(P.oobeEnd) + '  (source: ' + P.oobeSrc + ')' : 'unknown - Factory/Post tags unavailable'));
  L.push('Selection      : ' + OA.modeText());
  L.push('Baseline       : ' + ((OA.base && OA.base.active) ? OA.base.summary : 'none (heuristics only)'));
  if (OA.resuming) { L.push('Run type       : RESUMED - files already present with the same size were kept'); }
  L.push('');
  L.push('Legend: [HIGH|MED|LOW] = how sure the script is that the item is OEM-specific.');
  L.push('        OK = copied, NOT = detected but not copied by the chosen options, SKIP = over the per-file or total size cap, FAIL = error.');
  L.push('        {Factory} = created before OOBE finished, {Post} = created afterwards.');
  L.push('');
  for (gi = 0; gi < OA.groups.length; gi++) {
    g = OA.groups[gi];
    gitems = [];
    for (i = 0; i < OA.items.length; i++) { if (OA.items[i].gid === g.id) { gitems.push(OA.items[i]); } }
    gitems.sort(function (a, b) { var x = OA.lc(a.src), y = OA.lc(b.src); return x < y ? -1 : (x > y ? 1 : 0); });
    s = 0; for (i = 0; i < gitems.length; i++) { if (gitems[i].size > 0) { s += gitems[i].size; } }
    L.push('[' + g.id + '] ' + g.title.toUpperCase() + '   (' + gitems.length + ' items, ' + OA.fmtSize(s) + ')');
    L.push('------------------------------------------------------------------------');
    for (i = 0; i < gitems.length; i++) {
      it = gitems[i];
      L.push(OA.itemLine(it));
      if (it.kind === 'tree' && it.files) {
        L.push('          ' + it.files.length + ' files: ' + (it.filesCopied || 0) + ' copied' + (it.filesSkipped ? ', ' + it.filesSkipped + ' skipped (cap)' : '') + (it.filesFailed ? ', ' + it.filesFailed + ' FAILED' : ''));
        for (j = 0; j < it.files.length; j++) {
          fl = it.files[j];
          L.push('            ' + (fl.st === 'copied' ? 'ok   ' : (fl.st === 'skipped-cap' ? 'skip ' : 'FAIL ')) + fl.rel + '  (' + OA.fmtSize(fl.size) + ')' + (fl.note ? '  ' + fl.note : ''));
        }
      }
      if (it.status === 'copied' || it.status === 'partial') { copiedN++; if (it.size > 0) { bytes += it.size; } }
      else if (it.status === 'FAILED' || it.status === 'failed') { failedN++; }
      else if (/^skipped/.test(it.status)) { skippedN++; }
      else { notN++; }
    }
    if (g.id === '11' && OA.modes.drivers === 'manifest') { L.push('  (driver packages not copied: manifest-only mode; see 11_Drivers\\driver-manifest.csv, ' + OA.drivers.length + ' packages)'); }
    if (g.id === '12' && OA.modes.software === 'manifest') { L.push('  (program files not copied: manifest-only mode; see 12_Software\\software-manifest.csv, ' + OA.software.length + ' entries)'); }
    if (OA.searched[g.id]) {
      L.push('  Checked, nothing found:');
      for (j = 0; j < OA.searched[g.id].length; j++) { L.push('    - ' + OA.searched[g.id][j]); }
    }
    L.push('');
  }
  L.push('SUMMARY');
  L.push('-------');
  L.push('Items copied: ' + copiedN + ' (' + OA.fmtSize(bytes) + ')   not copied by choice: ' + notN + '   skipped by a cap: ' + skippedN + '   failed: ' + failedN);
  if (OA.excluded.length) {
    L.push(''); L.push('EXCLUDED FOR PRIVACY');
    for (i = 0; i < OA.excluded.length; i++) { L.push('  ' + OA.excluded[i].src + '   (' + OA.excluded[i].reason + ')'); }
  }
  if (OA.errors.length) {
    L.push(''); L.push('ERRORS / WARNINGS (' + OA.errors.length + ')');
    for (i = 0; i < OA.errors.length; i++) { L.push('  ' + OA.errors[i].where + ': ' + OA.errors[i].msg); }
  }
  L.push('');
  L.push('Note: copying an installed program folder is not a working backup of that program.');
  L.push('Note: detection is evidence-based, not proof; compare MED/LOW items against a clean install of the same Windows version.');
  return L.join('\r\n');
};
OA.buildManifest = function () {
  var L = [OA.csvRow(['group', 'kind', 'source', 'destination', 'size_bytes', 'modified', 'created', 'era', 'confidence', 'status', 'evidence', 'note'])], i, j, it, fl;
  for (i = 0; i < OA.items.length; i++) {
    it = OA.items[i];
    L.push(OA.csvRow([it.gid, it.kind, it.src, it.destRel, it.size, OA.fmtDate(it.mtime), OA.fmtDate(it.ctime), it.era, it.conf, it.status, it.why, it.note]));
    if (it.kind === 'tree' && it.files) {
      for (j = 0; j < it.files.length; j++) {
        fl = it.files[j];
        L.push(OA.csvRow([it.gid, 'file', it.src + '\\' + fl.rel, it.destRel + '\\' + fl.rel, fl.size, '', '', it.era, it.conf, fl.st, 'inside ' + it.src, fl.note || '']));
      }
    }
  }
  return L.join('\r\n');
};
OA.buildDriverManifest = function () {
  var L = [OA.csvRow(['published_inf', 'original_inf', 'provider', 'class', 'driver_ver', 'created', 'era', 'oem_vendor_match', 'baseline', 'package_folder', 'size_bytes', 'copied'])], i, r;
  for (i = 0; i < OA.drivers.length; i++) {
    r = OA.drivers[i];
    L.push(OA.csvRow([r.pub, r.orig, r.provider, r.cls, r.ver, OA.fmtDate(r.created), r.era, r.vendor, r.baseline || '', r.folder, r.size, (r.item && (r.item.status === 'copied' || r.item.status === 'partial')) ? 'yes' : 'no']));
  }
  return L.join('\r\n');
};
OA.buildSoftwareManifest = function () {
  var L = [OA.csvRow(['kind', 'name', 'publisher', 'version', 'install_date', 'install_location', 'uninstall_string', 'est_size_kb', 'evidence', 'confidence', 'era', 'vendor_match', 'copied'])], i, r;
  for (i = 0; i < OA.software.length; i++) {
    r = OA.software[i];
    L.push(OA.csvRow([r.kind, r.name, r.publisher, r.version, r.date, r.loc, r.uninst, r.kb, r.why, r.conf, r.era, r.vendor, (r.item && (r.item.status === 'copied' || r.item.status === 'partial')) ? 'yes' : 'no']));
  }
  return L.join('\r\n');
};
OA.buildProfile = function (root) {
  var P = OA.profile, L = [], k, t = [], i;
  L.push('SYSTEM PROFILE'); L.push('==============');
  L.push('Windows        : ' + P.osCaption + ' (' + P.productName + ')  version ' + P.major + '.' + P.minor + '.' + P.build + ' ' + (P.displayVersion || '') + ' ' + (P.csd || ''));
  L.push('Architecture   : ' + P.arch);
  L.push('Maker (raw)    : ' + P.makerRaw + '   [source: ' + P.makerSource + ']');
  L.push('Model (raw)    : ' + P.modelRaw);
  L.push('BIOS vendor    : ' + P.biosVendor);
  L.push('Serial/tag     : ' + P.serial);
  L.push('ProductId      : ' + P.productId + '   channel: ' + P.channel + '   (the product key itself is never read)');
  L.push('Install date   : ' + (P.installDate ? OA.fmtDate(P.installDate) : '?') + '  (can be rewritten by feature updates)');
  L.push('OOBE finished  : ' + (P.oobeEnd ? OA.fmtDate(P.oobeEnd) + '  from ' + P.oobeSrc : 'unknown'));
  L.push('ImageState     : ' + (P.imageState || 'n/a'));
  L.push('Elevated       : ' + (P.admin ? 'yes' : 'NO - protected folders (Recovery, DriverStore ACLs) may have been unreadable'));
  for (k in P.tools) { t.push(k + '=' + (P.tools[k] ? 'yes' : 'no')); }
  L.push('Tools          : ' + t.join(' '));
  L.push('Script         : OEM-Archiver ' + OA.version + ' (' + P.family + ')');
  L.push('Selection      : ' + OA.modeText());
  L.push('Baseline       : ' + ((OA.base && OA.base.active) ? OA.base.summary + '  (media file: ' + OA.base.src + ')' : 'none (heuristics only)'));
  if (P.microsoftOem) { L.push('Note           : Microsoft device - publisher-based OEM detection is disabled (planned: dedicated handling)'); }
  L.push('Archive folder : ' + root);
  if (OA.sensitive.length) {
    L.push(''); L.push('COPIED ANSWER/SETUP FILES THAT MAY CONTAIN PRODUCT KEYS OR PASSWORDS (handle the archive accordingly):');
    for (i = 0; i < OA.sensitive.length; i++) { L.push('  ' + OA.sensitive[i]); }
  }
  return L.join('\r\n');
};
OA.buildSkipped = function () {
  var L = ['SKIPPED, DENIED AND FAILED ITEMS', '================================'], i, it, n = 0;
  for (i = 0; i < OA.items.length; i++) {
    it = OA.items[i];
    if (it.status === 'FAILED' || it.status === 'failed' || /^skipped/.test(it.status) || it.status === 'partial') { L.push(it.status + '  ' + it.src + '   ' + (it.note || '')); n++; }
    if (it.files) { var j; for (j = 0; j < it.files.length; j++) { if (it.files[j].st !== 'copied') { L.push(it.files[j].st + '  ' + it.src + '\\' + it.files[j].rel + '   ' + (it.files[j].note || '')); n++; } } }
  }
  for (i = 0; i < OA.excluded.length; i++) { L.push('excluded  ' + OA.excluded[i].src + '   ' + OA.excluded[i].reason); n++; }
  for (i = 0; i < OA.errors.length; i++) { L.push('error  ' + OA.errors[i].where + '   ' + OA.errors[i].msg); n++; }
  if (!n) { L.push('(none)'); }
  return L.join('\r\n');
};
// Full ASCII tree of the finished archive
OA.treeLines = function (dir, prefix, out, st) {
  var fo, subs = [], files = [], e, i, last, nm, sz;
  try { fo = OA.fso.GetFolder(dir); } catch (x) { return; }
  try { for (e = new Enumerator(fo.SubFolders); !e.atEnd(); e.moveNext()) { subs.push(e.item()); } } catch (x1) { }
  try { for (e = new Enumerator(fo.Files); !e.atEnd(); e.moveNext()) { files.push(e.item()); } } catch (x2) { }
  subs.sort(function (a, b) { var p = OA.lc(a.Name), q = OA.lc(b.Name); return p < q ? -1 : (p > q ? 1 : 0); });
  files.sort(function (a, b) { var p = OA.lc(a.Name), q = OA.lc(b.Name); return p < q ? -1 : (p > q ? 1 : 0); });
  for (i = 0; i < subs.length; i++) {
    last = (i === subs.length - 1 && files.length === 0);
    sz = -1; try { sz = subs[i].Size; } catch (x3) { }
    out.push(prefix + (last ? '\\-- ' : '+-- ') + subs[i].Name + '\\    [' + OA.fmtSize(sz) + ']');
    st.dirs++;
    OA.treeLines(subs[i].Path, prefix + (last ? '    ' : '|   '), out, st);
  }
  for (i = 0; i < files.length; i++) {
    last = (i === files.length - 1);
    out.push(prefix + (last ? '\\-- ' : '+-- ') + files[i].Name + '    (' + OA.fmtSize(files[i].Size) + ')');
    st.files++; st.bytes += files[i].Size;
  }
};
OA.buildFileStructure = function (root) {
  var out = [], st = { dirs: 0, files: 0, bytes: 0 };
  out.push('FULL FILE STRUCTURE OF THIS ARCHIVE');
  out.push('===================================');
  out.push(root + '\\');
  OA.treeLines(root, '', out, st);
  out.push('');
  out.push('Totals: ' + st.dirs + ' folders, ' + st.files + ' files, ' + OA.fmtSize(st.bytes) + '  (this file excluded)');
  return out.join('\r\n');
};
OA.writeOutputs = function (root) {
  var t = root + '\\00_Transcript';
  OA.mkdirp(t);
  if (OA.modes.drivers !== 'skip' && OA.drivers.length) { OA.writeText(root + '\\' + OA.groupDir('11') + '\\driver-manifest.csv', OA.buildDriverManifest(), true); }
  if (OA.modes.software !== 'skip' && OA.software.length) { OA.writeText(root + '\\' + OA.groupDir('12') + '\\software-manifest.csv', OA.buildSoftwareManifest(), true); }
  OA.writeText(t + '\\system-profile.txt', OA.buildProfile(root), true);
  OA.writeText(t + '\\manifest.csv', OA.buildManifest(), true);
  OA.writeText(t + '\\skipped-and-errors.txt', OA.buildSkipped(), true);
  OA.writeText(t + '\\transcript.txt', OA.buildTranscript(root), true);
  OA.writeText(t + '\\file-structure.txt', OA.buildFileStructure(root), true);   // last, so it shows every other output file
};
OA.printScanSummary = function () {
  var gs = OA.groupSummary(), i, tot = 0, n = 0;
  OA.say('');
  OA.say('Scan results (nothing has been copied yet):');
  for (i = 0; i < gs.length; i++) {
    OA.say('  [' + gs[i].g.id + '] ' + (gs[i].g.title + '                                 ').substr(0, 34) + OA.pad(gs[i].n, 4) + ' items  ' + OA.fmtSize(gs[i].size));
    tot += gs[i].size > 0 ? gs[i].size : 0; n += gs[i].n;
  }
  OA.say('  Total: ' + n + ' items, ' + OA.fmtSize(tot) + '   (drivers listed: ' + OA.drivers.length + ', software entries: ' + OA.software.length + ')');
};
OA.printScanList = function () {
  var i, it;
  OA.say('');
  for (i = 0; i < OA.items.length; i++) {
    it = OA.items[i];
    OA.say('[' + it.gid + '][' + (it.conf || '') + '][' + (it.era || '-') + '] ' + it.kind + ' ' + it.src + '  (' + OA.fmtSize(it.size) + ')  why: ' + it.why);
  }
};

// ---------- shared collector helpers ----------
OA.vendorFolder = function (name) {      // does a folder/file name look like it belongs to the OEM?
  var n = String(name || '');   // only the machine's OWN maker counts: a Samsung folder on an HP PC is user software
  if (OA.isOwnVendor(n)) { return true; }
  if (OA.vendorShort && OA.vendorShort.length >= 2 && new RegExp('^' + OA.escRx(OA.vendorShort), 'i').test(n)) { return true; }
  return false;
};
OA.addFilesUnder = function (gid, dir, why, conf, ex) {
  var n = 0;
  if (!OA.dirExists(dir)) { OA.nothing(gid, 'folder not present: ' + dir); return 0; }
  OA.walkFiles(dir, true, function (f) {
    if (/^(desktop\.ini|thumbs\.db)$/i.test(f.Name)) { return; }
    if (OA.addFile(gid, f.Path, why, conf, ex)) { n++; }
  });
  if (!n) { OA.nothing(gid, 'folder present but no (new) files: ' + dir); }
  return n;
};
OA.defaultProfile = function () {
  var p = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList\\Default');
  if (p) { return OA.expand(p); }
  p = OA.profile.sysdrive + '\\Users\\Default';
  if (OA.dirExists(p)) { return p; }
  return OA.profile.sysdrive + '\\Documents and Settings\\Default User';
};
// Parse an INF: provider, class, DriverVer, resolving %Token% strings from [Strings]
OA.parseInf = function (path) {
  var txt = OA.readText(path), lines = txt.split('\n'), i, ln, sec = '', m, strs = {}, out = { provider: '', cls: '', ver: '' }, raw = { provider: '', cls: '', ver: '' };
  for (i = 0; i < lines.length; i++) {
    ln = OA.trim(lines[i].replace(/;.*$/, ''));
    if (ln === '') { continue; }
    if (ln.charAt(0) === '[') { sec = OA.lc(ln); continue; }
    if (sec === '[version]') {
      m = /^provider\s*=\s*(.*)$/i.exec(ln); if (m && !raw.provider) { raw.provider = OA.trim(m[1]); }
      m = /^class\s*=\s*(.*)$/i.exec(ln); if (m && !raw.cls) { raw.cls = OA.trim(m[1]); }
      m = /^driverver\s*=\s*(.*)$/i.exec(ln); if (m && !raw.ver) { raw.ver = OA.trim(m[1]); }
    } else if (/^\[strings/.test(sec)) {
      m = /^([^=\s]+)\s*=\s*"?([^"]*)"?\s*$/.exec(ln);
      if (m && strs[OA.lc(m[1])] === undefined) { strs[OA.lc(m[1])] = m[2]; }
    }
  }
  function res(s) {
    var t = /^%(.+)%$/.exec(s);
    if (t && strs[OA.lc(t[1])] !== undefined) { return strs[OA.lc(t[1])]; }
    return s.replace(/^"|"$/g, '');
  }
  out.provider = res(raw.provider); out.cls = res(raw.cls); out.ver = res(raw.ver);
  return out;
};
OA.safeRun = function (name, fn) { try { fn(); } catch (e) { OA.err('collector ' + name, e); } };
OA.runCollectors = function (list) {
  var i, before;
  for (i = 0; i < list.length; i++) {
    OA.sayn('  ' + (list[i][0] + '                                   ').substr(0, 34));
    before = OA.items.length;
    OA.safeRun(list[i][0], list[i][1]);
    OA.say(OA.pad(OA.items.length - before, 4) + ' items');
  }
};
OA.parseInstallDate = function (s) {
  var m = /^(\d{4})(\d{2})(\d{2})$/.exec(String(s || ''));
  if (!m) { return null; }
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), 12, 0, 0);
};
// day-level era for install-date style values (same calendar day as OOBE end counts as Factory)
OA.eraOfDay = function (d) {
  var e = OA.profile.oobeEnd, a, b;
  if (!e || !d) { return ''; }
  a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  b = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
  return (a <= b) ? 'Factory' : 'Post';
};
OA.softwareFromUninstall = function () {
  // Reads HKLM Uninstall (native + WOW6432). Adds records to OA.software and program-folder trees for the OEM's own software.
  var P = OA.profile, roots = ['SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'], r, ks, i, base, name, pub, ver, idate, loc, un, kb, vend, own, era, conf, why, rec, rel, d, k;
  for (r = 0; r < roots.length; r++) {
    ks = OA.regEnumKeys(OA.HKLM, roots[r]);
    for (i = 0; i < ks.length; i++) {
      k = ks[i];
      base = 'HKLM\\' + roots[r] + '\\' + k;
      name = OA.regStr(base + '\\DisplayName');
      if (!name) { continue; }
      if (OA.regRead(base + '\\ParentKeyName') !== null) { continue; }
      rel = OA.regStr(base + '\\ReleaseType');
      if (/update|hotfix/i.test(rel)) { continue; }
      pub = OA.regStr(base + '\\Publisher');
      ver = OA.regStr(base + '\\DisplayVersion');
      idate = OA.regStr(base + '\\InstallDate');
      loc = OA.regStr(base + '\\InstallLocation');
      un = OA.regStr(base + '\\UninstallString');
      kb = OA.regRead(base + '\\EstimatedSize');
      d = OA.parseInstallDate(idate);
      era = OA.eraOfDay(d);
      vend = OA.matchVendor(pub + ' ' + name);
      own = OA.isOwnVendor(pub) || OA.isOwnVendor(name);
      if (/^microsoft/i.test(pub) && !own) { continue; }
      if (own) { conf = OA.isOwnVendor(pub) ? 'HIGH' : 'MED'; why = 'publisher/name matches the OEM (' + OA.vendorShort + ')'; }
      else if (vend && era !== 'Post') { conf = 'MED'; why = 'publisher/name matches another OEM brand (' + vend + ')'; }
      else if (era === 'Factory') { conf = 'LOW'; why = 'installed on/before the OOBE day by a non-Microsoft publisher (possible OEM preload or component)'; }
      else { continue; }
      rec = { kind: 'Win32 (Uninstall)', name: name, publisher: pub, version: ver, date: idate, loc: loc, uninst: un, kb: (kb === null ? '' : kb), why: why, conf: conf, era: era, vendor: vend, item: null };
      OA.software.push(rec);
      if (own && loc) {
        loc = OA.expand(loc).replace(/[\\\/]+$/, '');
        if (OA.dirExists(loc) && /^[A-Za-z]:\\[^\\]+\\[^\\]+/.test(loc) && OA.lc(loc).indexOf(OA.lc(P.windir)) !== 0) {
          rec.item = OA.addTree('12', loc, 'install location of "' + name + '"', conf, { sub: 'ProgramFolders', era: era });
        }
      }
    }
  }
};
OA.vendorFoldersIn = function (parentDir, why) {
  var subs = OA.subDirs(parentDir), i, it, f;
  for (i = 0; i < subs.length; i++) {
    f = subs[i];
    try { if (f.Attributes & 1024) { continue; } } catch (e) { }
    if (OA.vendorFolder(f.Name)) {
      it = OA.addTree('12', f.Path, why, 'MED', { sub: 'ProgramFolders' });
      if (it) { OA.software.push({ kind: 'Folder', name: f.Path, publisher: OA.vendorShort, version: '', date: OA.fmtDay(it.ctime), loc: f.Path, uninst: '', kb: Math.round((it.size > 0 ? it.size : 0) / 1024), why: why, conf: 'MED', era: it.era, vendor: OA.vendorShort, item: it }); }
    }
  }
};
OA.stagingFolders = function () {
  var P = OA.profile, i, s, dir, it, subs, f, handled = {}, nm, d;
  for (i = 0; i < OAV.rootStaging.length; i++) {
    s = OAV.rootStaging[i];
    dir = P.sysdrive + '\\' + s.n;
    if (!OA.dirExists(dir)) { continue; }
    handled[OA.lc(s.n)] = true;
    OA.addStaging(dir, s.d, 'HIGH', 'known OEM staging folder at the drive root');
  }
  subs = OA.subDirs(P.sysdrive + '\\');
  for (i = 0; i < subs.length; i++) {
    f = subs[i]; nm = f.Name;
    if (handled[OA.lc(nm)]) { continue; }
    try { if (f.Attributes & 1024) { continue; } } catch (e) { }
    if (/^(windows|program files.*|users|programdata|perflogs|documents and settings|recovery|system volume information|\$.*|msocache|inetpub|boot)$/i.test(nm)) { continue; }
    if (OA.vendorFolder(nm)) { OA.addStaging(f.Path, 'soft', 'MED', 'folder at the drive root named for the OEM'); }
  }
};
OA.addStaging = function (dir, kind, conf, why) {
  var it, nm = OA.leaf(dir);
  if (kind === 'soft') { it = OA.addTree('12', dir, why, conf, { sub: 'StagedInstallers', destRel: '12_Software\\StagedInstallers\\' + nm }); }
  else if (kind === 'drv') { it = OA.addTree('11', dir, why, conf, { sub: 'Staged', destRel: '11_Drivers\\Staged\\' + nm }); }
  else { it = OA.addTree('13', dir, why + ' (recovery/setup source - follows the software setting because it can be large)', conf, { cat: 'software', destRel: '13_Recovery_Setup_Sources\\' + nm }); }
  if (it) { OA.software.push({ kind: 'Staging folder', name: dir, publisher: OA.vendorShort, version: '', date: OA.fmtDay(it.ctime), loc: dir, uninst: '', kb: Math.round((it.size > 0 ? it.size : 0) / 1024), why: why, conf: conf, era: it.era, vendor: OA.vendorShort, item: it }); }
  return it;
};
OA.addDesktopItems = function (dir, label) {
  var n = 0;
  if (!OA.dirExists(dir)) { OA.nothing('09', 'folder not present: ' + dir); return 0; }
  OA.walkFiles(dir, false, function (f) {
    var era, conf, why;
    if (/^desktop\.ini$/i.test(f.Name)) { return; }
    era = OA.eraOf(OA.toDate(f.DateCreated));
    if (OA.vendorFolder(f.Name)) { conf = 'MED'; why = 'item named for the OEM on the ' + label; }
    else if (era !== 'Post') { conf = 'LOW'; why = 'item on the ' + label + ' created before OOBE finished (or OOBE time unknown)'; }
    else { return; }
    if (OA.addFile('09', f.Path, why, conf)) { n++; }
  });
  if (!n) { OA.nothing('09', 'no OEM-looking items on the ' + label + ' (' + dir + ')'); }
  return n;
};
// ---------- startup advice ----------
OA.recommendations = function () {
  OA.say('');
  OA.say('NOTICE: for best results, run this on a FRESH or recently installed copy of Windows');
  OA.say('        (before the PC is used heavily, updated, or has other software installed).');
  OA.say('        On a used system more items show up as "post-delivery" and some OEM files may');
  OA.say('        already have been replaced or removed.');
  OA.say('');
  if (!OA.args.yes) { OA.ask('Press Enter to continue (Ctrl+C to cancel)', ''); }
};

// ---------- progress bar with percentage and time estimate ----------
OA.rep = function (ch, n) { var s = '', i; for (i = 0; i < n; i++) { s += ch; } return s; };
OA.fmtTime = function (sec) {
  var s = Math.round(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  s = s % 60;
  return h > 0 ? h + ':' + OA.pad(m, 2) + ':' + OA.pad(s, 2) : m + ':' + OA.pad(s, 2);
};
OA._pg = null;
OA.progressStart = function (totalBytes, totalItems) { OA._pg = { t0: new Date().getTime(), total: totalBytes, done: 0, last: 0, items: totalItems, n: 0 }; };
OA.progress = function (addBytes) {
  var p = OA._pg, now = new Date().getTime(), pct, w = 30, filled, el, eta = -1, line;
  if (!p) { return; }
  p.done += addBytes; p.n++;
  if (now - p.last < 700 && p.n < p.items) { return; }
  p.last = now;
  pct = (p.total > 0) ? Math.min(100, Math.floor(p.done * 100 / p.total)) : Math.floor(p.n * 100 / Math.max(1, p.items));
  filled = Math.floor(pct * w / 100);
  el = (now - p.t0) / 1000;
  if (pct >= 3 && pct < 100) { eta = el * (100 - pct) / pct; }
  line = '[' + OA.rep('#', filled) + OA.rep('-', w - filled) + '] ' + pct + '%  ' + OA.fmtSize(p.done) + ' / ' + OA.fmtSize(p.total) + '  elapsed ' + OA.fmtTime(el) + (eta >= 0 ? '  about ' + OA.fmtTime(eta) + ' left' : '');
  while (line.length < 78) { line += ' '; }
  OA.sayn('\r' + line);
};

// ---------- dry run: what WOULD be copied with the current choices ----------
OA.dryRunReport = function () {
  var i, it, tcap = OA.totalCapBytes(), cap = OA.modes.cap > 0 ? OA.modes.cap * 1048576 : 0, done = 0, sz, nCopy = 0, nSkip = 0, nNot = 0, bCopy = 0, lines = [];
  for (i = 0; i < OA.items.length; i++) {
    it = OA.items[i]; sz = it.size > 0 ? it.size : 0;
    if (!OA.itemSelected(it)) { nNot++; continue; }
    if (tcap > 0 && it.kind !== 'reg' && it.kind !== 'note' && done + sz > tcap) { nSkip++; lines.push('SKIP (total cap)  ' + it.src + '  (' + OA.fmtSize(sz) + ')'); continue; }
    if (cap > 0 && it.kind === 'file' && sz > cap) { nSkip++; lines.push('SKIP (file cap)   ' + it.src + '  (' + OA.fmtSize(sz) + ')'); continue; }
    nCopy++; bCopy += sz; done += sz;
    if (OA.args.list) { lines.push('COPY              ' + it.src + '  (' + OA.fmtSize(sz) + ')'); }
  }
  OA.say(''); OA.say('--- Dry run (nothing is written) ---');
  OA.say('  ' + OA.modeText());
  for (i = 0; i < lines.length; i++) { OA.say('  ' + lines[i]); }
  OA.say('  Would copy: ' + nCopy + ' items, ' + OA.fmtSize(bCopy) + '.  Skipped by a cap: ' + nSkip + '.  Not selected: ' + nNot + '.');
  if (cap > 0) { OA.say('  Folders are copied whole; files inside them over the ' + OA.modes.cap + ' MB cap are skipped and listed at copy time.'); }
};

// ---------- finishing: html summary, zip, open in Explorer ----------
OA.htmlEsc = function (s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[^\x20-\x7E]/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; });
};
OA.makeHtml = function (root) {
  var P = OA.profile, h = [], gs = [], i, g, it, n, s, rel, imgs = [], nm = OA.leaf(root);
  for (i = 0; i < OA.groups.length; i++) { gs.push({ g: OA.groups[i], n: 0, size: 0 }); }
  for (i = 0; i < OA.items.length; i++) {
    it = OA.items[i];
    if (it.status !== 'copied' && it.status !== 'partial') { continue; }
    for (n = 0; n < gs.length; n++) { if (gs[n].g.id === it.gid) { gs[n].n++; if (it.size > 0) { gs[n].size += it.size; } } }
    if (it.kind === 'file' && /\.(jpe?g|png|gif|bmp)$/i.test(it.src) && /^(01|02|03|07)$/.test(it.gid) && it.size < 8388608 && imgs.length < 40) { imgs.push(it); }
  }
  h.push('<!DOCTYPE html><html><head><meta charset="utf-8"><title>OEM Archive - ' + OA.htmlEsc(nm) + '</title>');
  h.push('<style>body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#222}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 10px;text-align:left}img{max-width:220px;max-height:140px;margin:6px;border:1px solid #ddd}</style></head><body>');
  h.push('<h1>OEM Archive: ' + OA.htmlEsc(nm) + '</h1>');
  h.push('<p><b>Machine:</b> ' + OA.htmlEsc((P.makerRaw || '?') + ' / ' + (P.modelRaw || '?')) + '<br><b>Windows:</b> ' + OA.htmlEsc(P.osCaption + ' ' + P.major + '.' + P.minor + '.' + P.build) + '<br><b>ProductId channel:</b> ' + OA.htmlEsc(P.channel) + '<br><b>Selection:</b> ' + OA.htmlEsc(OA.modeText()) + '</p>');
  h.push('<h2>Groups</h2><table><tr><th>Group</th><th>Items copied</th><th>Size</th></tr>');
  for (i = 0; i < gs.length; i++) { h.push('<tr><td><a href="' + OA.htmlEsc(OA.groupDir(gs[i].g.id)) + '/">' + OA.htmlEsc(gs[i].g.id + ' ' + gs[i].g.title) + '</a></td><td>' + gs[i].n + '</td><td>' + OA.fmtSize(gs[i].size) + '</td></tr>'); }
  h.push('</table><h2>Reports</h2><ul><li><a href="00_Transcript/transcript.txt">transcript.txt</a></li><li><a href="00_Transcript/file-structure.txt">file-structure.txt</a></li><li><a href="00_Transcript/manifest.csv">manifest.csv</a></li><li><a href="00_Transcript/system-profile.txt">system-profile.txt</a></li><li><a href="00_Transcript/skipped-and-errors.txt">skipped-and-errors.txt</a></li></ul>');
  if (imgs.length) {
    h.push('<h2>Pictures (wallpapers, logos)</h2>');
    for (i = 0; i < imgs.length; i++) { rel = imgs[i].destRel.replace(/\\/g, '/').replace(/ /g, '%20'); h.push('<img src="' + OA.htmlEsc(rel) + '" title="' + OA.htmlEsc(imgs[i].src) + '">'); }
  }
  h.push('</body></html>');
  OA.writeText(root + '\\index.html', h.join('\r\n'), false);
  return root + '\\index.html';
};
OA.makeZip = function (root) {
  var zp = root + '.zip', sa, ns, src, last = -1, same = 0, t0 = new Date().getTime(), sz, f;
  if (OA.profile.major < 5 || (OA.profile.major === 5 && OA.profile.minor < 1)) { OA.say('  The built-in zip needs Windows XP or newer; skipped.'); return ''; }
  try {
    f = OA.fso.CreateTextFile(zp, true); f.Write('PK' + String.fromCharCode(5, 6) + OA.rep(String.fromCharCode(0), 18)); f.Close();
    sa = new ActiveXObject('Shell.Application');
    ns = sa.NameSpace(zp); src = sa.NameSpace(root);
    ns.CopyHere(src.Items(), 4 + 16);
    OA.say('  Zipping (the Windows zip engine works in the background; this can take a while)...');
    while (true) {
      WScript.Sleep(2000);
      sz = OA.fso.GetFile(zp).Size;
      if (sz === last) { same++; } else { same = 0; last = sz; }
      if (same >= 5 || (new Date().getTime() - t0) > 7200000) { break; }
    }
    return zp;
  } catch (e) { OA.err('zip', e); OA.say('  Could not create the zip: ' + e.message); return ''; }
};
OA.finishOptions = function (root) {
  var html = !!OA.args.html, zip = !!OA.args.zip, idx, hp = '', zp = '';
  if (!OA.args.yes && !OA.args.html && !OA.args.zip) {
    OA.say('');
    OA.say('Note: the built-in .zip is slow, may show a Windows copy window, and Windows zip files cannot hold');
    OA.say('files over 4 GB. The archive folder is kept either way. (This will probably not matter.)');
    idx = OA.menu('Package the finished archive?', ['Nothing more', 'Create an index.html summary page', 'Create a .zip file', 'Both index.html and .zip'], 0);
    html = (idx === 1 || idx === 3); zip = (idx === 2 || idx === 3);
  }
  if (html) { try { hp = OA.makeHtml(root); OA.say('  Wrote ' + hp); } catch (e) { OA.err('html', e); } }
  if (zip) { zp = OA.makeZip(root); if (zp) { OA.say('  Wrote ' + zp + '  (' + OA.fmtSize(OA.fso.GetFile(zp).Size) + ')'); } }
  if (OA.args.open || (!OA.args.yes && OA.yesno('Open the archive folder in Explorer now?', true))) { try { OA.sh.Run('explorer "' + root + '"', 1, false); } catch (e2) { } }
};
// ---------- native dialogs (yes/no via a real Windows message box) ----------
// Works wherever Windows Script Host runs (98/ME/2000/XP/Vista-11). /nogui keeps everything in the console.
OA.useGui = function () { return !OA.args.nogui && !OA.args.yes; };
OA.yesnoConsole = function (prompt, defYes) { var a = OA.ask(prompt + ' (y/n)', defYes ? 'y' : 'n'); return /^y/i.test(a); };

// ---------- warning shown ONLY when a media option (verify against disc / back up recovery media) is chosen ----------
OA.mediaWarning = function () {
  OA.say('');
  OA.say('*** MEDIA WARNING ***');
  OA.say('  Install/recovery media used for verification MUST be the SAME Windows edition AND the SAME build');
  OA.say('  as this PC. Use the disc that came with the system if you have it. Media of a different build');
  OA.say('  gives wrong results (stock files would look like OEM additions, or the reverse).');
  return OA.yesno('Continue with the media option?', true);
};

// ---------- menu-based TUI ----------
OA.presetNames = ['Everything', 'Branding + drivers, software manifest only', 'Branding only', 'Drivers only', 'Software only', 'FAT32-safe: everything, skipping files of 4 GB or more', 'Custom (go straight to the Adjust pages)'];
OA.useTui = function () {
  return !(OA.args.yes || OA.args.scan || OA.args.dryrun || OA.args.classic || OA.args.preset || OA.args.branding || OA.args.drivers || OA.args.software);
};
OA.resetScan = function () {
  OA.items = []; OA.drivers = []; OA.software = []; OA.searched = {}; OA.excluded = []; OA.sensitive = []; OA.seen = {}; OA.treeRoots = []; OA.errors = [];
};
OA.tuiHeader = function (S) {
  var P = OA.profile, sel, root = '';
  if (S.base) { root = OA.resolveArchiveRoot(S.base, S.name); }
  OA.say(''); OA.say(OA.rep('=', 70));
  OA.say(' OEM-Archiver ' + OA.version + '   ' + (P.makerRaw || '?') + ' / ' + (P.modelRaw || '?') + '   ' + P.winName + (P.winSuffix ? ' ' + P.winSuffix : ''));
  OA.say(OA.rep('-', 70));
  OA.say(' Name     : ' + S.name);
  OA.say(' Baseline : ' + ((OA.base && OA.base.active) ? OA.base.summary : 'none (heuristics only)'));
  OA.say(' Location : ' + (S.base ? S.base : '(not chosen yet)'));
  if (root) { OA.say(' Archive  : ' + root); }
  if (S.scanned) {
    sel = OA.sum(function (it) { return OA.itemSelected(it); });
    OA.say(' Scan     : done, ' + OA.items.length + ' items detected');
    OA.say(' Choices  : ' + OA.modeText());
    OA.say(' Selected : ' + sel.n + ' items, about ' + OA.fmtSize(OA.effectiveSize(sel.size)));
  } else { OA.say(' Scan     : not done yet (choose 3)'); }
  OA.say(OA.rep('=', 70));
};
OA.tuiScan = function (S, collectors) {
  var r;
  OA.resetScan();
  if (S.base) { OA.excludeRoot = OA.lc(OA.resolveArchiveRoot(S.base, S.name)); }
  OA.say(''); OA.say('Scanning (read-only)...');
  OA.runCollectors(collectors);
  OA.printScanSummary();
  S.scanned = true;
};
OA.runTui = function (collectors) {
  var S = { name: (OA.args.name && OA.args.name !== true) ? (OA.safeName(OA.args.name, 100) || OA.nameOptions()[0].value) : OA.nameOptions()[0].value, base: (OA.args.out && OA.args.out !== true) ? OA.args.out : '', scanned: false, presetSet: false }, c, src, def, labels, est, i, idx, root, free;
  while (true) {
    OA.tuiHeader(S);
    def = !S.base ? 1 : (!S.scanned ? 2 : (!S.presetSet ? 3 : 7));
    c = OA.menu('Main menu', ['Name', 'Location', 'Scan this PC', 'Preset (what to copy)', 'Adjust (branding / drivers / software / limits)', 'Baseline (verify against Windows install media)', 'Dry run (show what would be copied)', 'Start copy', 'Quit'], def);
    if (c === 0) { S.name = OA.chooseName(); if (S.scanned && S.base) { OA.excludeRoot = OA.lc(OA.resolveArchiveRoot(S.base, S.name)); } continue; }
    if (c === 1) { S.base = OA.chooseLocation(); continue; }
    if (c === 8) { OA.say('Quit. Nothing was copied.'); OA.finish(0); }
    if (c === 2) { OA.tuiScan(S, collectors); continue; }
    if (c === 5) {
      src = OA.ask('Path to an ISO, install.wim, reference sheet (.oemref), or the drive letter of mounted media (blank = cancel)', '');
      if (src && OA.setupBaseline(src)) {
        S.scanned = false;
        OA.say('  Baseline ready. Run the scan again (option 3) so it uses the baseline.');
        if (OA.base.meta && !/\.oemref$/i.test(src) && OA.yesno('Save a reference sheet (.oemref) next to the script, to reuse on other PCs?', false)) { OA.say('  Saved: ' + OA.writeRef(OA.base, true)); }
      }
      continue;
    }
    if (!S.scanned) { OA.say('  Scanning first (needed for sizes and choices)...'); OA.tuiScan(S, collectors); }
    free = S.base ? OA.freeSpace(S.base) : -1;
    if (c === 3) {
      labels = [];
      for (i = 1; i <= 7; i++) { est = (i < 7) ? OA.presetEstimate(i) : null; labels.push(OA.presetNames[i - 1] + (est ? '   est. ' + OA.fmtSize(OA.effectiveSize(est.size)) : '')); }
      idx = OA.menu('Preset: what do you want to copy?', labels, 0);
      OA.applyPreset(idx + 1); S.presetSet = true;
      if (idx + 1 === 7) { OA.adjustPages(); }
      continue;
    }
    if (c === 4) { OA.adjustPages(); S.presetSet = true; continue; }
    if (c === 6) { OA.dryRunReport(); OA.ask('Press Enter to return to the menu', ''); continue; }
    if (c === 7) {
      if (!S.base) { OA.say('  Choose a location first (option 2).'); continue; }
      root = OA.resolveArchiveRoot(S.base, S.name);
      if (OA.dirExists(root)) {
        if (OA.yesno('That archive folder already exists. Resume into it (files already copied are skipped)?', false)) { OA.resuming = true; }
        else { root = OA.uniqueDir(root); }
      }
      OA.excludeRoot = OA.lc(root);
      OA.say(''); OA.say((OA.resuming ? 'Resuming into: ' : 'Archive will be written to: ') + root);
      if (OA.yesno('Start copying now?', true)) { return { root: root, base: S.base }; }
    }
  }
};
// ---------- baseline: verify against Windows install media ----------
// Reads the stock file list and inbox driver list from a Windows install image (install.wim), after checking that
// the media matches this PC's build. Comparison is by path and size (no hashes).
OA.base = null;      // { active, degraded, level, summary, files: {rel: size}, infs: {name: true} }
OA.mount = null;
OA.baseConf = function (c) {
  if (OA.base && OA.base.degraded) { return c === 'HIGH' ? 'MED' : 'LOW'; }
  return c;
};
OA.findTool = function (exe, dirs) {
  var P = OA.profile, i, j, p, v, bases = [P.progFiles, P.progFiles86];
  v = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\' + exe + '\\').replace(/"/g, '');
  if (v && OA.fileExists(v)) { return v; }
  for (j = 0; j < bases.length; j++) {
    if (!bases[j]) { continue; }
    for (i = 0; i < dirs.length; i++) { p = bases[j] + '\\' + dirs[i] + '\\' + exe; if (OA.fileExists(p)) { return p; } }
  }
  return '';
};
OA.mediaTools = function () {
  var P = OA.profile;
  return {
    native: (P.build >= 9200 && OA.fileExists(P.sys32 + '\\WindowsPowerShell\\v1.0\\powershell.exe')),
    dt: OA.findTool('DTAgent.exe', ['DAEMON Tools Lite', 'DAEMON Tools Ultra', 'DAEMON Tools Pro', 'DAEMON Tools Lite 10']),
    imgburn: OA.findTool('ImgBurn.exe', ['ImgBurn'])
  };
};
OA.cdDrives = function () {
  var out = {}, e, d;
  try { for (e = new Enumerator(OA.fso.Drives); !e.atEnd(); e.moveNext()) { d = e.item(); try { if (d.DriveType === 4 && d.IsReady) { out[d.DriveLetter.toUpperCase()] = true; } } catch (x) { } } } catch (x2) { }
  return out;
};
OA.mountIso = function (iso, tools) {
  var r, lines, last, before, after, t, k;
  if (tools.native) {
    r = OA.exec('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Mount-DiskImage -ImagePath \'' + iso.replace(/'/g, "''") + '\' -PassThru | Get-Volume).DriveLetter"');
    lines = r.out.split('\n'); last = '';
    for (t = lines.length - 1; t >= 0; t--) { if (OA.trim(lines[t]) !== '') { last = OA.trim(lines[t]); break; } }
    if (/^[A-Za-z]$/.test(last)) { OA.mount = { how: 'native', iso: iso }; return last.toUpperCase() + ':\\'; }
  }
  if (tools.dt) {
    before = OA.cdDrives();
    OA.exec('"' + tools.dt + '" -mount ide, 0, "' + iso + '"');
    for (t = 0; t < 20; t++) {
      WScript.Sleep(1000);
      after = OA.cdDrives();
      for (k in after) { if (!before[k]) { OA.mount = { how: 'dt', iso: iso, dt: tools.dt }; return k + ':\\'; } }
    }
  }
  return '';
};
OA.unmountIso = function () {
  if (!OA.mount) { return; }
  if (OA.mount.how === 'native') { OA.exec('powershell -NoProfile -ExecutionPolicy Bypass -Command "Dismount-DiskImage -ImagePath \'' + OA.mount.iso.replace(/'/g, "''") + '\'"'); }
  else if (OA.mount.how === 'dt') { OA.exec('"' + OA.mount.dt + '" -unmount ide, 0'); }
  OA.mount = null;
};
OA.dismKv = function (text) {
  var lines = String(text).split('\n'), i, m, kv = {};
  for (i = 0; i < lines.length; i++) {
    m = /^\s*([A-Za-z][A-Za-z ]*?)\s*:\s*(.*?)\s*$/.exec(lines[i]);
    if (m && kv[OA.lc(m[1])] === undefined) { kv[OA.lc(m[1])] = m[2]; }
  }
  return kv;
};
OA.wimIndexes = function (wim) {
  var r = OA.exec('dism /English /Get-WimInfo /WimFile:"' + wim + '"'), re = /Index\s*:\s*(\d+)/g, m, ids = [], out = [], i, d, kv;
  while ((m = re.exec(r.out)) !== null) { ids.push(parseInt(m[1], 10)); }
  for (i = 0; i < ids.length; i++) {
    d = OA.exec('dism /English /Get-WimInfo /WimFile:"' + wim + '" /Index:' + ids[i]);
    kv = OA.dismKv(d.out);
    out.push({ index: ids[i], name: kv.name || '', version: kv.version || '', ubr: parseInt(kv['servicepack build'], 10), edition: kv.edition || '', arch: OA.lc(kv.architecture || ''), sp: kv['servicepack level'] || '' });
  }
  return out;
};
// Compare the media images with this PC. Returns { idx, level: exact|revision|edition|build|arch, mediaText, installedText, verdict, consequence }
OA.compareWim = function (list) {
  var P = OA.profile, key = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\', ub = parseInt(OA.regRead(key + 'UBR'), 10), kv0, ed = OA.lc(OA.regStr(key + 'EditionID')),
      a = OA.lc(P.arch), arch = (a === 'amd64') ? 'x64' : (a === 'x86' ? 'x86' : a), inst = P.major + '.' + P.minor + '.' + P.build, i, pick = null, arches = [], r = { idx: 0, level: 'exact' }, vp, mb;
  if (isNaN(ub) && P.major < 10) { try { kv0 = String(OA.fso.GetFileVersion(P.sys32 + '\\ntoskrnl.exe')).split('.'); ub = parseInt(kv0[3], 10); } catch (x) { } }
  for (i = 0; i < list.length; i++) { if (list[i].arch === arch) { arches.push(list[i]); } }
  r.installedText = P.osCaption + ', version ' + inst + (isNaN(ub) ? '' : '.' + ub) + ', edition ' + (ed || '?') + ', ' + arch;
  if (!arches.length) {
    r.level = 'arch'; r.idx = list.length ? list[0].index : 0;
    r.mediaText = list.length ? list[0].name + ' ' + list[0].version + ' ' + list[0].arch : 'no images found';
    r.verdict = 'The media is for a different processor architecture (' + (list.length ? list[0].arch : '?') + ' vs ' + arch + ').';
    r.consequence = 'Nothing would match. The baseline check is refused.';
    return r;
  }
  for (i = 0; i < arches.length; i++) { if (OA.lc(arches[i].edition) === ed) { pick = arches[i]; break; } }
  if (!pick) { pick = arches[0]; }
  r.idx = pick.index; r.pick = pick;
  r.mediaText = pick.name + ', version ' + pick.version + (isNaN(pick.ubr) ? '' : '.' + pick.ubr) + ', edition ' + pick.edition + ', ' + pick.arch;
  vp = pick.version.split('.'); mb = vp[0] + '.' + vp[1] + '.' + vp[2];
  if (mb !== inst) {
    r.level = 'build';
    r.verdict = 'DIFFERENT BUILD: media ' + mb + ' vs this PC ' + inst + '.';
    r.consequence = 'Windows changes many files and drivers between builds. Stock files that changed will look like OEM replacements, drivers added in a newer build will look "not on media", and real OEM changes can be hidden. Every result from this check is marked one confidence level lower. You should use media of the same build (best: the disc that came with the PC).';
  } else if (!isNaN(ub) && !isNaN(pick.ubr) && ub !== pick.ubr) {
    r.level = 'revision';
    r.verdict = 'Same build (' + inst + ') but different update revision: media .' + pick.ubr + ' vs this PC .' + ub + '.';
    r.consequence = 'Files serviced by cumulative updates will have different sizes. They are treated as "updated stock" when Windows owns them, so the effect is small, but a few updated files may be reported wrongly.';
  } else if (pick.edition && ed && OA.lc(pick.edition) !== ed) {
    r.level = 'edition';
    r.verdict = 'Same build, different edition: media ' + pick.edition + ' vs this PC ' + ed + '.';
    r.consequence = 'Editions share most files; a few edition-specific components differ, so some items may be reported as "not on media" when they are normal for your edition.';
  } else { r.verdict = 'Exact match: same build, edition and architecture.'; r.consequence = ''; }
  return r;
};
OA.loadBaseline = function (mnt, cmp, src) {
  var w = mnt + '\\Windows', n = (w + '\\').length, dirs = ['Web\\Wallpaper', 'Web\\4K', 'Web\\Screen', 'Media', 'Cursors', 'Resources'], i, subs, m, cnt = 0;
  OA.base = { active: true, degraded: (cmp.level === 'build'), level: cmp.level, files: {}, infs: {}, names: {}, src: src, summary: '', meta: { name: cmp.pick.name, version: cmp.pick.version, ubr: isNaN(cmp.pick.ubr) ? '0' : String(cmp.pick.ubr), edition: cmp.pick.edition, arch: cmp.pick.arch, sp: cmp.pick.sp || '' } };
  function add(f) { OA.base.files[OA.lc(f.Path.substr(n))] = f.Size; cnt++; }
  for (i = 0; i < dirs.length; i++) { if (OA.dirExists(w + '\\' + dirs[i])) { OA.walkFiles(w + '\\' + dirs[i], true, add); } }
  OA.walkFiles(w + '\\System32', false, function (f) { if (/\.scr$/i.test(f.Name)) { add(f); } });
  OA.walkFiles(w + '\\INF', false, function (f) { if (/\.inf$/i.test(f.Name)) { OA.base.infs[OA.lc(f.Name)] = true; } });
  subs = OA.subDirs(w + '\\System32\\DriverStore\\FileRepository');
  for (i = 0; i < subs.length; i++) { m = /^(.+\.inf)_[^_]+_[0-9a-f]{16}$/i.exec(subs[i].Name); if (m) { OA.base.infs[OA.lc(m[1])] = true; } }
  OA.base.count = cnt;
  OA.base.summary = 'media ' + cmp.mediaText + ' [' + cmp.level + (OA.base.degraded ? ', confidence lowered' : '') + '], ' + cnt + ' reference files';
};
// stock test with the baseline: path + size on the media decide; Windows ownership explains updates
OA.stockCheckBaseline = function (path) {
  var P = OA.profile, r0 = (P.family === 'NT6') ? OA.stockCheck6(path) : OA.stockCheck5(path), rel = null, size = -1, mbase, w = P.windir + '\\', sfx = OA.base.degraded ? ' (media build differs)' : '';
  if (OA.lc(path).indexOf(OA.lc(w)) === 0) { rel = OA.lc(path.substr(w.length)); }
  try { size = OA.fso.GetFile(path).Size; } catch (e) { }
  if (rel !== null) { mbase = OA.base.files[rel]; }
  if (mbase === undefined && OA.base.names && OA.base.names[OA.lc(OA.leaf(path))]) { return { oem: false, why: 'file name is part of the install media (name-only reference)' + sfx }; }
  if (rel !== null && mbase !== undefined) {
    if (mbase === size && !OA.base.degraded) { return { oem: false, why: 'identical path and size on the install media' }; }
    if (mbase === size) { return { oem: false, why: 'same path and size as the install media' + sfx }; }
    if (!r0.oem) { return { oem: false, why: r0.why + '; size differs from the media (updated by Windows)' + sfx }; }
    return { oem: true, conf: OA.baseConf('HIGH'), why: 'path exists on the install media but the size differs and Windows does not own it: replaced by the OEM' + sfx };
  }
  if (!r0.oem) { return { oem: false, why: r0.why + '; not on the media (added by a later update)' + sfx }; }
  return { oem: true, conf: OA.baseConf('HIGH'), why: 'not on the install media and not owned by Windows' + sfx };
};
OA.decideMedia = function (cmp) {
  var go;
  OA.say('');
  OA.say('  This PC : ' + cmp.installedText);
  OA.say('  Media   : ' + cmp.mediaText);
  OA.say('  Result  : ' + cmp.verdict);
  if (cmp.level === 'arch') { OA.say('  ' + cmp.consequence); return false; }
  if (cmp.level !== 'exact') {
    OA.say('  If you continue: ' + cmp.consequence);
    go = OA.yesno('The media does not match exactly. Continue anyway?', cmp.level !== 'build');
    if (!go) { OA.say('  Baseline check cancelled; nothing was changed.'); return false; }
  }
  return true;
};
// ----- reference sheets (.oemref): a portable text export of a baseline, importable on any edition -----
OA.refName = function (m) { return 'OEM-Reference_' + OA.safeName((m.name || 'Windows') + '_' + m.version + '.' + (m.ubr || '0') + '_' + m.arch + (m.edition ? '_' + m.edition : ''), 100) + '.oemref'; };
OA.writeRef = function (B, target) {
  var m = B.meta, L = [], k, f;
  if (!target || target === true) { target = OA.fso.GetParentFolderName(WScript.ScriptFullName); }
  f = OA.dirExists(target) ? target + '\\' + OA.refName(m) : target;
  L.push('OEMREF\t1');
  for (k in m) { L.push('meta\t' + k + '\t' + m[k]); }
  L.push('meta\tcreated\t' + OA.fmtDate(new Date()));
  for (k in B.files) { L.push('F\t' + k + '\t' + B.files[k]); }
  for (k in B.infs) { L.push('I\t' + k); }
  for (k in B.names) { L.push('N\t' + k); }
  OA.writeText(f, L.join('\r\n'), true);
  return f;
};
OA.metaCmp = function (m) { return OA.compareWim([{ index: 0, name: m.name || 'reference', version: m.version, ubr: parseInt(m.ubr, 10), edition: m.edition || '', arch: OA.lc(m.arch || ''), sp: m.sp || '' }]); };
OA.baselineFromSheet = function (file) {
  var lines, i, p, m = {}, B, cmp, n = 0;
  if (!OA.fileExists(file)) { OA.say('  File not found: ' + file); return false; }
  lines = OA.readText(file).split('\n');
  B = { active: false, degraded: false, files: {}, infs: {}, names: {}, src: file, meta: m };
  for (i = 0; i < lines.length; i++) {
    p = lines[i].replace(/\r$/, '').split('\t');
    if (p[0] === 'meta' && p.length >= 2) { m[p[1]] = p[2] || ''; }
    else if (p[0] === 'F' && p.length >= 3) { B.files[p[1]] = parseInt(p[2], 10); n++; }
    else if (p[0] === 'I') { B.infs[p[1]] = true; n++; }
    else if (p[0] === 'N') { B.names[p[1]] = true; n++; }
  }
  if (!m.version || !m.arch) { OA.say('  That is not a valid reference sheet.'); return false; }
  cmp = OA.metaCmp(m);
  if (!OA.decideMedia(cmp)) { return false; }
  B.active = true; B.degraded = (cmp.level === 'build'); B.level = cmp.level; B.count = n;
  B.summary = 'reference sheet ' + cmp.mediaText + ' [' + cmp.level + (B.degraded ? ', confidence lowered' : '') + '], ' + n + ' entries';
  OA.base = B;
  OA.say('  Baseline ready: ' + B.summary);
  return true;
};
// ----- XP-era setup media (i386 folder): readable on any Windows, names only -----
OA.loadI386 = function (root) {
  var d = root.replace(/[\\\/]+$/, ''), ver, parts, B, txt, lines, i, ln, m, inSec = false, cabs = ['driver.cab', 'sp1.cab', 'sp2.cab', 'sp3.cab'], c, r, ll, tmp, n = 0, k;
  if (OA.dirExists(d + '\\i386')) { d += '\\i386'; }
  if (!OA.fileExists(d + '\\winnt32.exe')) { return null; }
  ver = String(OA.fso.GetFileVersion(d + '\\winnt32.exe')); parts = ver.split('.');
  B = { active: true, degraded: false, files: {}, infs: {}, names: {}, src: d, meta: { name: 'Windows setup media', version: parts[0] + '.' + parts[1] + '.' + parts[2], ubr: parts[3] || '0', edition: '', arch: 'x86', sp: '' } };
  ll = d + '\\layout.inf';
  if (!OA.fileExists(ll) && OA.fileExists(d + '\\layout.in_')) {
    tmp = OA.expand('%TEMP%') + '\\oa-layout-' + (new Date().getTime()) + '.inf';
    OA.exec('expand "' + d + '\\layout.in_" "' + tmp + '"');
    if (OA.fileExists(tmp)) { ll = tmp; }
  }
  if (OA.fileExists(ll)) {
    lines = OA.readText(ll).split('\n');
    for (i = 0; i < lines.length; i++) {
      ln = OA.trim(lines[i]);
      if (ln.charAt(0) === '[') { inSec = /^\[sourcedisksfiles/i.test(ln); continue; }
      if (!inSec || ln === '' || ln.charAt(0) === ';') { continue; }
      m = /^"?([^"=]+?)"?\s*=/.exec(ln);
      if (m) { B.names[OA.lc(OA.trim(m[1]))] = true; }
    }
  }
  for (c = 0; c < cabs.length; c++) {
    if (!OA.fileExists(d + '\\' + cabs[c])) { continue; }
    r = OA.exec('expand -D "' + d + '\\' + cabs[c] + '"');
    lines = r.out.split('\n');
    for (i = 0; i < lines.length; i++) { m = /([^\s\\\/]+\.[A-Za-z0-9]{1,4})\s*$/.exec(OA.trim(lines[i])); if (m) { B.names[OA.lc(m[1])] = true; } }
  }
  for (k in B.names) { n++; }
  B.count = n;
  return B;
};
OA.setupBaseline = function (src) {
  var P = OA.profile, tools, root = '', wim = '', list, cmp, mnt, r, iso = '', B, dest;
  OA.base = null;
  OA.say(''); OA.say('--- Baseline check against install media ---');
  if (!OA.mediaWarning()) { OA.say('  Baseline check cancelled.'); return false; }
  src = OA.trim(String(src)).replace(/^"|"$/g, '');
  if (/\.oemref$/i.test(src)) { return OA.baselineFromSheet(src); }
  tools = OA.mediaTools();
  OA.say('  Tools: Windows ISO mount ' + (tools.native ? 'yes' : 'no') + ' | Daemon Tools ' + (tools.dt ? 'found' : 'not found') + ' | ImgBurn ' + (tools.imgburn ? 'found' : 'not found'));
  try {
    if (/\.iso$/i.test(src)) {
      iso = src;
      if (!OA.fileExists(iso)) { OA.say('  File not found: ' + iso); return false; }
      OA.say('  Mounting the ISO...');
      root = OA.mountIso(iso, tools);
      if (!root) { OA.say('  Could not mount the ISO automatically. Mount it yourself (double-click on Windows 8 and newer, or with Daemon Tools) and give the drive letter instead.'); return false; }
      OA.say('  Mounted as ' + root + ' (it is dismounted again when the check finishes).');
    } else if (/\.wim$/i.test(src)) { wim = src; }
    else if (/\.esd$/i.test(src)) { OA.say('  install.esd cannot be mounted read-only by DISM. Use media that has install.wim (the disc that came with the PC normally does).'); return false; }
    else if (/^[A-Za-z]:?\\?$/.test(src)) { root = src.charAt(0).toUpperCase() + ':\\'; }
    else if (OA.dirExists(src)) { root = src.replace(/[\\\/]+$/, '') + '\\'; }
    else { OA.say('  Not recognised as an ISO, WIM, drive, folder or .oemref sheet: ' + src); return false; }

    // Windows 2000/XP/2003 setup media: readable on any Windows, names only
    if (!wim && root && (OA.fileExists(root + 'i386\\winnt32.exe') || OA.fileExists(root + 'winnt32.exe'))) {
      OA.say('  Reading the setup media file lists (names only; sizes are not available for this media type)...');
      B = OA.loadI386(root);
      if (!B) { OA.say('  Could not read the setup media.'); return false; }
      cmp = OA.metaCmp(B.meta);
      if (!OA.decideMedia(cmp)) { return false; }
      B.degraded = (cmp.level === 'build'); B.level = cmp.level;
      B.summary = 'setup media ' + cmp.mediaText + ' [' + cmp.level + (B.degraded ? ', confidence lowered' : '') + '], ' + B.count + ' file names';
      OA.base = B;
      OA.say('  Baseline ready: ' + B.summary);
      if (OA.args.makeref) { dest = OA.writeRef(B, OA.args.makeref); OA.say('  Reference sheet written: ' + dest); }
      return true;
    }

    // Vista and newer install media (install.wim) needs DISM and administrator rights
    if (P.family !== 'NT6') { OA.say('  install.wim media can only be read on Windows Vista or newer. On such a PC run this with /baseline:<media> /makeref to create a reference sheet (.oemref), then import it here with /baseline:<sheet>.'); return false; }
    if (!P.tools.dism) { OA.say('  DISM was not found; it is needed to read install.wim.'); return false; }
    if (!P.admin) { OA.say('  Reading install.wim needs administrator rights (DISM mounts the image). Restart as administrator.'); return false; }
    if (!wim) {
      wim = root + 'sources\\install.wim';
      if (!OA.fileExists(wim)) {
        if (OA.fileExists(root + 'sources\\install.esd')) { OA.say('  This media has install.esd, which cannot be mounted read-only. Use media with install.wim.'); }
        else { OA.say('  No sources\\install.wim (or i386 setup files) found on ' + root); }
        return false;
      }
    }
    OA.say('  Reading the image list...');
    list = OA.wimIndexes(wim);
    if (!list.length) { OA.say('  DISM could not read ' + wim); return false; }
    cmp = OA.compareWim(list);
    if (!OA.decideMedia(cmp)) { return false; }
    mnt = OA.expand('%TEMP%') + '\\oa-baseline-' + (new Date().getTime());
    OA.mkdirp(mnt);
    OA.say('  Mounting the image read-only (can take a minute or two)...');
    r = OA.exec('dism /English /Mount-Image /ImageFile:"' + wim + '" /Index:' + cmp.idx + ' /MountDir:"' + mnt + '" /ReadOnly');
    if (!OA.dirExists(mnt + '\\Windows')) { OA.say('  DISM could not mount the image:'); OA.say('  ' + OA.trim(r.out).split('\n').slice(-3).join('\n  ')); OA.cleanMount(mnt); return false; }
    try { OA.loadBaseline(mnt, cmp, wim); }
    finally { OA.cleanMount(mnt); }
    OA.say('  Baseline ready: ' + OA.base.summary);
    if (OA.args.makeref) { dest = OA.writeRef(OA.base, OA.args.makeref); OA.say('  Reference sheet written: ' + dest); }
    return true;
  } finally { OA.unmountIso(); }
};OA.cleanMount = function (mnt) {
  var r = OA.exec('dism /English /Unmount-Image /MountDir:"' + mnt + '" /Discard'), fo;
  try { fo = OA.fso.GetFolder(mnt); if (fo.Files.Count === 0 && fo.SubFolders.Count === 0) { OA.fso.DeleteFolder(mnt, true); } else { OA.say('  Note: the mount folder ' + mnt + ' is still in use. If it stays mounted run: dism /Cleanup-Wim'); } } catch (e) { }
};
OA.usage = function () {
  OA.say('OEM-Archiver ' + OA.version + '  - archives everything an OEM added to this Windows install.');
  OA.say('');
  OA.say('Switches (all optional):');
  OA.say('  /scan              scan only, copy nothing        /list            print every detected item');
  OA.say('  /name:<text>       archive folder name            /out:<folder>    base folder (see nesting rule)');
  OA.say('  /preset:1-7        1=Everything 2=Branding+drivers+software manifest 3=Branding only');
  OA.say('                     4=Drivers only 5=Software only 6=FAT32-safe (skip files >= 4 GB) 7=Custom');
  OA.say('  /branding:copy|skip   /drivers:full|manifest|skip   /software:all|manifest|skip');
  OA.say('  /cap:<MB>          per-file cap in MB             /totalcap:<GB>   total cap in GB (none by default)');
  OA.say('  /postdrivers       include post-delivery OEM drivers');
  OA.say('  /postsoftware:off  leave out software installed after OOBE');
  OA.say('  /hive              also read Default-user hive wallpaper/theme values (loads and unloads it)');
  OA.say('  /yes               accept defaults, no prompts    /noelevate       do not offer to run as administrator');
  OA.say('  /baseline:<iso|install.wim|drive:|sheet.oemref>   verify against install media or a reference sheet');
  OA.say('  /makeref[:<folder|file>]   with /baseline: write a portable reference sheet (.oemref) and stop');
  OA.say('  /classic           step-by-step prompts instead of the main menu     /nogui   no Windows message boxes');
  OA.say('Archive location: <chosen folder>\\OEM Archive\\<name>, unless the chosen folder is itself called');
  OA.say('"Archive" or "OEM Archive", in which case <chosen folder>\\<name> is used.');
};


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
      if (OA.base && OA.base.active) {
        rec.baseline = (rec.orig && OA.base.infs[OA.lc(rec.orig)]) ? 'INF name also on media' : 'not on media';
        if (sub && rec.baseline === 'not on media') { conf = OA.baseConf('HIGH'); why += '; not part of the install media'; }
        else if (sub) { conf = OA.baseConf('MED'); why += '; the same INF name also ships on the install media (an OEM-supplied or newer version of a Windows driver)'; }
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
  var P, name, base, root, free = -1, sel, req, tui, tr;
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
  if (P.microsoftOem) { OA.say(''); OA.say('NOTE: this is a Microsoft device (e.g. Surface). Microsoft is both the OS vendor and the OEM, so publisher-based detection is switched off and results lean on the other signals (and the baseline check). Dedicated handling is planned.'); }
  if (OA.args.baseline && OA.args.baseline !== true) { OA.setupBaseline(String(OA.args.baseline)); if (OA.args.makeref) { OA.finish((OA.base && OA.base.active) ? 0 : 1); } }
  tui = OA.useTui();  if (tui) { tr = OA.runTui(OA.collectors6); root = tr.root; base = tr.base; }
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
    OA.runCollectors(OA.collectors6);
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

OA.main6();
