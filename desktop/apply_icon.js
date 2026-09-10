const ResEdit = require('resedit');
const path = require('path');
const fs = require('fs');

async function applyExeIcon() {
  const exePath = path.join(__dirname, 'dist-app/win-unpacked/Reviser.exe');
  const icoPath = path.join(__dirname, 'icon.ico');

  if (!fs.existsSync(exePath)) {
    console.error('Reviser.exe not found at', exePath);
    return;
  }

  if (!fs.existsSync(icoPath)) {
    console.error('icon.ico not found at', icoPath);
    return;
  }

  console.log('[apply_icon] Injecting icon with ResEdit into', exePath);
  try {
    const exeData = fs.readFileSync(exePath);
    const exe = ResEdit.NtExecutable.from(exeData);
    const res = ResEdit.NtExecutableResource.from(exe);

    // Copy icon into dist folder as well
    fs.copyFileSync(icoPath, path.join(__dirname, 'dist-app/win-unpacked/icon.ico'));

    const icoData = fs.readFileSync(icoPath);
    const iconFile = ResEdit.Data.IconFile.from(icoData);

    // Replace icon group 1
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      1,
      1033,
      iconFile.icons.map((item) => item.data)
    );

    // Set Version Info
    const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
    const vi = viList.length > 0 ? viList[0] : ResEdit.Resource.VersionInfo.createEmpty();
    vi.setStringValues(
      { lang: 1033, codepage: 1200 },
      {
        ProductName: 'Reviser',
        FileDescription: 'Reviser — Personal Planning & Spaced Repetition',
        CompanyName: 'Reviser Team',
        LegalCopyright: 'Copyright © 2026 Reviser',
        OriginalFilename: 'Reviser.exe'
      }
    );
    vi.outputToResourceEntries(res.entries);

    res.outputResource(exe);
    const newExeData = Buffer.from(exe.generate());
    fs.writeFileSync(exePath, newExeData);

    console.log('[apply_icon] Successfully injected logo into Reviser.exe with ResEdit!');
  } catch (err) {
    console.error('[apply_icon] Error injecting icon:', err);
  }
}

applyExeIcon();
