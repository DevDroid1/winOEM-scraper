// ===== selftest.js : unit checks for the shared engine =====
// Not run directly. tests\run-tests.ps1 concatenates src\vendors.js + src\common.js + this file into one script
// (so the globals OA and OAV exist) and runs it with cscript.

var T = { pass: 0, fail: 0 };
function eq(name, got, want) {
  if (String(got) === String(want)) { T.pass++; }
  else { T.fail++; WScript.Echo('FAIL ' + name + '\n     got : ' + got + '\n     want: ' + want); }
}
function ok(name, cond) { if (cond) { T.pass++; } else { T.fail++; WScript.Echo('FAIL ' + name); } }

// ---- archive location nesting rule ----
eq('nest C:\\OEM',               OA.resolveArchiveRoot('C:\\OEM', 'X'),               'C:\\OEM\\OEM Archive\\X');
eq('nest Archive leaf',          OA.resolveArchiveRoot('D:\\Stuff\\Archive', 'X'),    'D:\\Stuff\\Archive\\X');
eq('nest oem archive + slash',   OA.resolveArchiveRoot('D:\\Stuff\\oem archive\\', 'X'), 'D:\\Stuff\\oem archive\\X');
eq('nest OEM ARCHIVE caps',      OA.resolveArchiveRoot('E:\\OEM ARCHIVE', 'Z'),       'E:\\OEM ARCHIVE\\Z');
eq('nest drive root',            OA.resolveArchiveRoot('D:\\', 'X'),                  'D:\\OEM Archive\\X');
eq('nest bare drive',            OA.resolveArchiveRoot('D:', 'X'),                    'D:\\OEM Archive\\X');
eq('nest UNC',                   OA.resolveArchiveRoot('\\\\srv\\share\\Backups', 'X'), '\\\\srv\\share\\Backups\\OEM Archive\\X');
eq('nest "My Archive" is not Archive', OA.resolveArchiveRoot('C:\\My Archive', 'X'),  'C:\\My Archive\\OEM Archive\\X');
eq('nest "Archives" is not Archive',   OA.resolveArchiveRoot('C:\\Archives', 'X'),    'C:\\Archives\\OEM Archive\\X');
eq('nest Documents',             OA.resolveArchiveRoot('C:\\Users\\a\\Documents', 'N'), 'C:\\Users\\a\\Documents\\OEM Archive\\N');

// ---- folder-name helpers ----
eq('safeName illegal chars',  OA.safeName('a<b>:c"d/e\\f|g?h*i', 50), 'abcdefghi');
eq('safeName spaces',         OA.safeName('Omni Book  5', 50), 'Omni-Book-5');
eq('safeName trailing dots',  OA.safeName('name. . ', 50), 'name');
eq('safeName cap',            OA.safeName('abcdefghij', 4), 'abcd');
eq('joinName',                OA.joinName(['HP', '', 'Omni Book', 'Win11-25H2']), 'HP_Omni-Book_Win11-25H2');
eq('cleanMaker HP',           OA.cleanMaker('Hewlett-Packard'), 'HP');
eq('cleanMaker Dell',         OA.cleanMaker('Dell Inc.'), 'Dell');
eq('cleanMaker ASUS',         OA.cleanMaker('ASUSTeK COMPUTER INC.'), 'ASUS');
eq('cleanMaker MSI',          OA.cleanMaker('Micro-Star International Co., Ltd.'), 'MSI');
eq('cleanMaker Lenovo',       OA.cleanMaker('LENOVO'), 'Lenovo');
eq('cleanMaker junk',         OA.cleanMaker('To Be Filled By O.E.M.'), '');
eq('cleanMaker unknown',      OA.cleanMaker('Foo Bar Technology Co., Ltd.'), 'Foo Bar');
eq('cleanModel strips maker', OA.cleanModel('HP OmniBook 5 Laptop', 'HP'), 'OmniBook 5 Laptop');
eq('cleanModel junk',         OA.cleanModel('System Product Name', 'ASUS'), '');
eq('junkFilter',              OA.junkFilter('Default string'), '');
eq('junkFilter keeps real',   OA.junkFilter('ABC123'), 'ABC123');

// ---- the three name presets, from a synthetic profile ----
OA.profile = { maker: 'HP', model: 'OmniBook 5 Laptop', winName: 'Win11', winSuffix: '25H2', serial: 'CND123', productId: '00342-21596-95867-AAOEM',
               oobeEnd: new Date(2026, 8, 9, 8, 32, 0), installDate: null };
var no = OA.nameOptions();
eq('name preset 1', no[0].value, 'HP_OmniBook-5-Laptop_Win11-25H2');
eq('name preset 2', no[1].value, 'HP_OmniBook-5-Laptop_CND123');
eq('name preset 3', no[2].value, '00342-21596-95867-AAOEM_2026-09-09');
OA.profile = { maker: '', model: '', winName: 'WinXP', winSuffix: 'SP3', serial: '', productId: '', oobeEnd: null, installDate: null };
no = OA.nameOptions();
eq('name preset 1 unknown machine', no[0].value, 'UnknownMaker_UnknownModel_WinXP-SP3');
eq('name preset 2 no serial',       no[1].value, 'UnknownMaker_UnknownModel_NoSerial');
eq('name preset 3 nothing known',   no[2].value, 'NoProductId_NoDate');

// ---- vendor matching: only the machine's own maker counts for folder fingerprints ----
OA.vendorRx = OAV.vendors[0].rx; OA.vendorShort = 'HP';
ok('vendorFolder HPAppPrintScanDoctor', OA.vendorFolder('HPAppPrintScanDoctor'));
ok('vendorFolder Hewlett-Packard',      OA.vendorFolder('Hewlett-Packard'));
ok('vendorFolder Samsung is NOT own',   !OA.vendorFolder('Samsung'));
ok('vendorFolder Microsoft is NOT own', !OA.vendorFolder('Microsoft'));
eq('matchVendor other OEM brand', OA.matchVendor('Samsung Electronics'), 'Samsung');

// ---- era ----
OA.profile = { oobeEnd: new Date(2026, 8, 9, 8, 32, 0) };
eq('era before',  OA.eraOf(new Date(2026, 8, 8, 1, 0, 0)), 'Factory');
eq('era after',   OA.eraOf(new Date(2026, 8, 10, 1, 0, 0)), 'Post');
eq('era no date', OA.eraOf(null), '');
eq('eraOfDay same day = Factory', OA.eraOfDay(new Date(2026, 8, 9, 23, 0, 0)), 'Factory');
eq('eraOfDay next day = Post',    OA.eraOfDay(new Date(2026, 8, 10, 0, 5, 0)), 'Post');
OA.profile = { oobeEnd: null };
eq('era unknown OOBE', OA.eraOf(new Date()), '');

// ---- dates from FSO must be convertible ----
var vd = OA.fso.GetFile(WScript.ScriptFullName).DateCreated;
var dd = OA.toDate(vd);
ok('toDate gives a usable Date', dd !== null && typeof dd.getTime === 'function' && !isNaN(dd.getTime()));
ok('fmtDate formats', /^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(OA.fmtDate(dd)));

// ---- secrets / csv / sizes / ini ----
eq('maskSecrets ini',  OA.maskSecrets('ProductKey = AAAAA-BBBBB\nOther=1'), 'ProductKey = ***masked***\nOther=1');
eq('maskSecrets xml',  OA.maskSecrets('<ProductKey>AAAAA</ProductKey>'), '<ProductKey>***masked***</ProductKey>');
eq('csv plain',        OA.csv('abc'), 'abc');
eq('csv comma+quote',  OA.csv('a,"b"'), '"a,""b"""');
eq('fmtSize KB',       OA.fmtSize(2048), '2.0 KB');
eq('fmtSize GB',       OA.fmtSize(3 * 1073741824), '3.00 GB');

var tmp = OA.expand('%TEMP%') + '\\oa-selftest-' + (new Date().getTime());
OA.mkdirp(tmp + '\\a\\b');
OA.writeText(tmp + '\\t.ini', '[General]\r\nManufacturer = Acme \r\n; comment\r\nModel=Z1\r\n[Support Information]\r\nLine1=Call us\r\n', false);
var ini = OA.readIni(tmp + '\\t.ini');
eq('readIni value',      ini.general.manufacturer, 'Acme');
eq('readIni section',    ini['support information'].line1, 'Call us');

// ---- INF parsing: provider token resolved from [Strings] ----
OA.writeText(tmp + '\\x.inf', '[Version]\r\nSignature="$WINDOWS NT$"\r\nClass=Net\r\nProvider=%Mfg%\r\nDriverVer=01/02/2020,1.2.3.4\r\n[Strings]\r\nMfg="Acme Corp"\r\n', false);
var inf = OA.parseInf(tmp + '\\x.inf');
eq('parseInf provider', inf.provider, 'Acme Corp');
eq('parseInf class',    inf.cls, 'Net');
eq('parseInf ver',      inf.ver, '01/02/2020,1.2.3.4');

// ---- directory helpers ----
eq('uniqueDir existing', OA.uniqueDir(tmp + '\\a'), tmp + '\\a_2');
eq('uniqueDir new',      OA.uniqueDir(tmp + '\\zzz'), tmp + '\\zzz');
OA.writeText(tmp + '\\a\\b\\f.txt', 'hello', false);
var fs = OA.buildFileStructure(tmp);
ok('file-structure lists the folder', fs.indexOf('a\\') >= 0 && fs.indexOf('f.txt') >= 0);
ok('file-structure has totals',       /Totals: \d+ folders, \d+ files/.test(fs));
ok('freeSpace works',                 OA.freeSpace(tmp) > 0);

// ---- selection logic: presets and per-category switches ----
function mk(cat, gid, sub, era) { return { kind: 'tree', cat: cat, gid: gid, sub: sub || '', era: era || '', size: 10, src: 'x' + Math.random() }; }
OA.items = [mk('branding', '03'), mk('branding', '05'), mk('drivers', '11', 'Factory', 'Factory'), mk('drivers', '11', 'PostDelivery-OEMVendor', 'Post'),
            mk('software', '12', 'ProgramFolders', 'Factory'), mk('software', '12', 'ProgramFolders', 'Post')];
function count() { return OA.selectedItems().length; }
OA.args = {};
OA.applyPreset(1); eq('preset 1 selects branding+drivers(factory)+software(all, post on)', count(), 5);   // 2 + 1 + 2
OA.modes.postSoftware = false; eq('preset 1, post software off', count(), 4);
OA.modes.postSoftware = true; OA.modes.postDrivers = true; eq('preset 1, post drivers on', count(), 6);
OA.modes.postDrivers = false;
OA.applyPreset(2); eq('preset 2 (software manifest only)', count(), 3);   // branding 2 + factory driver 1
OA.applyPreset(3); eq('preset 3 branding only', count(), 2);
OA.applyPreset(4); eq('preset 4 drivers only', count(), 1);
OA.applyPreset(5); eq('preset 5 software only', count(), 2);
OA.applyPreset(6); eq('preset 6 (FAT32) selects everything', count(), 5); eq('preset 6 per-file cap is the FAT32 limit', OA.modes.cap, 4095);
OA.applyPreset(7); eq('preset 7 (custom) starts as everything', count(), 5);
OA.applyPreset(1); eq('presets apply no per-file cap', OA.modes.cap, 0); eq('presets apply no total cap', OA.modes.totalCap, 0);
OA.args.cap = '50'; OA.args.totalcap = '1'; OA.applyPreset(1); eq('/cap overrides', OA.modes.cap, 50); eq('/totalcap overrides', OA.modes.totalCap, 1); OA.args = {};
OA.applyPreset(6); OA.applyPreset(1); eq('presets reset the limits', OA.modes.cap, 0);
OA.modes.totalCap = 4; eq('effectiveSize under cap', OA.effectiveSize(1000), 1000);
eq('effectiveSize over cap', OA.effectiveSize(5 * 1073741824), 4 * 1073741824);
OA.modes.totalCap = 0; eq('effectiveSize no cap', OA.effectiveSize(5 * 1073741824), 5 * 1073741824); OA.modes.totalCap = 4;
OA.applyPreset(1); OA.modes.groupsOff['05'] = true; eq('group toggle removes group 05', count(), 4);
OA.applyPreset(1); OA.modes.drivers = 'manifest'; eq('drivers manifest copies no driver files', count(), 4);
OA.modes.drivers = 'skip'; OA.modes.software = 'skip'; eq('drivers+software skip leaves branding', count(), 2);
OA.modes.branding = 'skip'; eq('everything skipped', count(), 0);

// ---- TUI / dialogs helpers ----
OA.args = {}; ok('useTui when interactive', OA.useTui());
OA.args = { yes: true }; ok('useTui off with /yes', !OA.useTui()); ok('useGui off with /yes', !OA.useGui());
OA.args = { classic: true }; ok('useTui off with /classic', !OA.useTui());
OA.args = { nogui: true }; ok('useGui off with /nogui', !OA.useGui()); OA.args = {};
eq('seven preset names', OA.presetNames.length, 7);
// ---- debug flag ----
OA.args = {}; OA.dbgLog = []; OA.dbg('silent'); eq('dbg is silent without /debug', OA.dbgLog.length, 0);
OA.args = { debug: true }; OA.dbg('traced'); eq('dbg records with /debug', OA.dbgLog.length, 1); ok('dbg line has a timestamp', /^\[debug \d\d:\d\d:\d\d\] traced$/.test(OA.dbgLog[0]));
OA.args = {}; OA.dbgLog = [];
// ---- progress helpers ----
eq('fmtTime short', OA.fmtTime(65), '1:05');
eq('fmtTime hours', OA.fmtTime(3725), '1:02:05');
eq('rep', OA.rep('#', 3), '###');
eq('htmlEsc', OA.htmlEsc('a<b>&'), 'a&lt;b&gt;&amp;');
// ---- baseline (install media) logic ----
var kv = OA.dismKv('Index : 2\nName : Windows 11 Home\nArchitecture : x64\nVersion : 10.0.26100\nServicePack Build : 1\nEdition : Core\n');
eq('dismKv name', kv.name, 'Windows 11 Home'); eq('dismKv version', kv.version, '10.0.26100'); eq('dismKv ubr key', kv['servicepack build'], '1');
OA.profile = { major: 10, minor: 0, build: 26100, arch: 'AMD64', osCaption: 'Windows 11 Home' };
var inst = OA.regRead('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\UBR');
var ed = OA.regStr('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\EditionID');
var c1 = OA.compareWim([{ index: 1, name: 'x', version: '10.0.19045', ubr: 1, edition: ed, arch: 'x64' }]);
eq('compare: different build', c1.level, 'build'); ok('build mismatch explains consequences', c1.consequence.indexOf('confidence level lower') > 0);
var c2 = OA.compareWim([{ index: 1, name: 'x', version: '10.0.26100', ubr: 1, edition: ed, arch: 'arm64' }]);
eq('compare: wrong architecture is refused', c2.level, 'arch');
var c3 = OA.compareWim([{ index: 1, name: 'x', version: '10.0.26100', ubr: 99999, edition: ed, arch: 'x64' }, { index: 2, name: 'y', version: '10.0.26100', ubr: 99999, edition: 'Other', arch: 'x64' }]);
eq('compare: same build, other revision', c3.level, 'revision'); eq('compare: picks the matching edition index', c3.idx, 1);
var c4 = OA.compareWim([{ index: 1, name: 'x', version: '10.0.26100', ubr: parseInt(inst, 10), edition: ed, arch: 'x64' }]);
ok('compare: exact or revision when UBR present', c4.level === 'exact' || c4.level === 'revision');
OA.base = { active: false, degraded: false };
eq('baseConf normal', OA.baseConf('HIGH'), 'HIGH');
OA.base = { active: true, degraded: true, files: {}, infs: {} };
eq('baseConf lowered HIGH', OA.baseConf('HIGH'), 'MED'); eq('baseConf lowered MED', OA.baseConf('MED'), 'LOW');
// stockCheckBaseline with a fake Windows folder
var fw = tmp + '\\fakewin';
OA.mkdirp(fw + '\\Web\\Wallpaper');
OA.writeText(fw + '\\Web\\Wallpaper\\same.jpg', 'abcde', false);
OA.writeText(fw + '\\Web\\Wallpaper\\diff.jpg', 'abcdefghij', false);
OA.writeText(fw + '\\Web\\Wallpaper\\new.jpg', 'xyz', false);
OA.profile = { windir: fw, family: 'NT6', tools: { fsutil: false } };
OA.base = { active: true, degraded: false, files: { 'web\\wallpaper\\same.jpg': OA.fso.GetFile(fw + '\\Web\\Wallpaper\\same.jpg').Size, 'web\\wallpaper\\diff.jpg': 3 }, infs: {} };
ok('baseline: identical path+size is stock', !OA.stockCheckBaseline(fw + '\\Web\\Wallpaper\\same.jpg').oem);
var rd = OA.stockCheckBaseline(fw + '\\Web\\Wallpaper\\diff.jpg'); ok('baseline: changed size, not Windows-owned = OEM replaced', rd.oem && rd.conf === 'HIGH');
var rn = OA.stockCheckBaseline(fw + '\\Web\\Wallpaper\\new.jpg'); ok('baseline: not on media = OEM', rn.oem && rn.conf === 'HIGH');
OA.base.degraded = true;
eq('baseline: confidence lowered when build differs', OA.stockCheckBaseline(fw + '\\Web\\Wallpaper\\new.jpg').conf, 'MED');
OA.base = null;
// ---- reference sheet round trip (.oemref) ----
OA.args = { yes: true };
OA.profile = { major: 10, minor: 0, build: 26100, arch: 'AMD64', osCaption: 'Windows 11 Home', windir: fw, sys32: fw + '\\System32', family: 'NT6', tools: { fsutil: false } };
var ubrNow = String(inst === null ? '0' : inst);
var sheetB = { meta: { name: 'Windows 11 Home', version: '10.0.26100', ubr: ubrNow, edition: ed, arch: 'x64', sp: '' }, files: { 'web\\wallpaper\\same.jpg': 5 }, infs: { 'foo.inf': true }, names: { 'bar.exe': true } };
var sheetFile = OA.writeRef(sheetB, tmp);
ok('writeRef creates a .oemref file', /\.oemref$/i.test(sheetFile) && OA.fileExists(sheetFile));
ok('baselineFromSheet imports it', OA.baselineFromSheet(sheetFile) === true && OA.base && OA.base.active);
eq('sheet: file entry', OA.base.files['web\\wallpaper\\same.jpg'], 5); ok('sheet: inf entry', OA.base.infs['foo.inf'] === true); ok('sheet: name entry', OA.base.names['bar.exe'] === true);
OA.writeText(tmp + '\\bad.oemref', 'nothing useful', true);
ok('invalid sheet is rejected', OA.baselineFromSheet(tmp + '\\bad.oemref') === false);
sheetB.meta.arch = 'arm64'; var armSheet = OA.writeRef(sheetB, tmp + '\\arm.oemref');
ok('sheet for another architecture is refused', OA.baselineFromSheet(armSheet) === false);
// name-only reference (XP-style): name on media = stock
OA.base = { active: true, degraded: false, files: {}, infs: {}, names: { 'same.jpg': true } };
ok('name-only reference marks a listed name as stock', !OA.stockCheckBaseline(fw + '\\Web\\Wallpaper\\same.jpg').oem);
OA.base = null; OA.args = {};
// I386 media reader with a fake media folder (any real exe stands in for winnt32.exe)
var im = tmp + '\\media\\i386'; OA.mkdirp(im);
OA.fso.CopyFile(OA.expand('%windir%') + '\\System32\\cmd.exe', im + '\\winnt32.exe', true);
OA.writeText(im + '\\layout.inf', '[SourceDisksFiles]\r\nnotepad.exe = 1,,1\r\n"Long Name.bmp" = 1,,2\r\n', false);
var bi = OA.loadI386(tmp + '\\media');
ok('loadI386 reads the media', bi !== null && bi.names['notepad.exe'] === true && bi.names['long name.bmp'] === true);
ok('loadI386 records version meta', bi !== null && /^\d+\.\d+\.\d+$/.test(bi.meta.version));
// ---- Microsoft device handling ----
ok('Microsoft vendor entry exists', OAV.vendors[OAV.vendors.length - 1] !== undefined);
// ---- cleanup of what this test created ----
try { OA.fso.DeleteFolder(tmp, true); } catch (e) { WScript.Echo('cleanup problem: ' + e.message); }

WScript.Echo('selftest: ' + T.pass + ' passed, ' + T.fail + ' failed');
WScript.Quit(T.fail ? 1 : 0);
