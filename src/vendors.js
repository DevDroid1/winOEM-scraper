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
