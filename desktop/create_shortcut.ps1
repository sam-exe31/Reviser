$wsh = New-Object -ComObject WScript.Shell

$distIcon = 'D:\Projects_for_sam\Reviser\desktop\dist-app\win-unpacked\icon.ico'
$srcIcon = 'D:\Projects_for_sam\Reviser\desktop\icon.ico'
$targetExe = 'D:\Projects_for_sam\Reviser\desktop\dist-app\win-unpacked\Reviser.exe'

if (Test-Path $srcIcon) {
    Copy-Item -Path $srcIcon -Destination $distIcon -Force
}

$locations = @(
    [Environment]::GetFolderPath('Desktop'),
    "C:\Users\sam\Desktop",
    "C:\Users\sam\OneDrive\Desktop"
) | Select-Object -Unique

foreach ($loc in $locations) {
    if (Test-Path $loc) {
        $shortcutPath = Join-Path $loc 'Reviser.lnk'
        $shortcut = $wsh.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = $targetExe
        $shortcut.WorkingDirectory = 'D:\Projects_for_sam\Reviser\desktop\dist-app\win-unpacked'
        $shortcut.Description = 'Reviser — Spaced Repetition Almanac'
        $shortcut.IconLocation = "$srcIcon,0"
        $shortcut.Save()
        (Get-Item $shortcutPath).LastWriteTime = Get-Date
        Write-Host "Created shortcut at $shortcutPath"
    }
}

# Flush Windows Explorer Icon Cache
Start-Process ie4uinit.exe -ArgumentList '-show' -NoNewWindow -ErrorAction SilentlyContinue
Write-Host "Refreshed Windows Shell Icon Cache."
