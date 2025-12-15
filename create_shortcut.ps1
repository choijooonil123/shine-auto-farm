# Shine Muscat Expert - Desktop Shortcut Creator
# Encoding: UTF-8 with BOM for Korean support

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexPath = Join-Path $scriptPath "index.html"

# Check if index.html exists
if (-not (Test-Path $indexPath)) {
    Write-Host "Error: index.html not found: $indexPath" -ForegroundColor Red
    exit 1
}

# Get desktop path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Shine Muscat Expert.lnk"

# Create WScript.Shell object
$WshShell = New-Object -ComObject WScript.Shell

# Create shortcut
$shortcut = $WshShell.CreateShortcut($shortcutPath)

# Set shortcut properties
$shortcut.TargetPath = $indexPath
$shortcut.WorkingDirectory = $scriptPath
$shortcut.Description = "Shine Muscat 52-Week Cultivation Expert System"
$shortcut.WindowStyle = 1

# Set icon (use system icon)
$shell32Path = Join-Path $env:SystemRoot "System32\shell32.dll"
$shortcut.IconLocation = "$shell32Path,41"

# Save shortcut
$shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $shortcutPath" -ForegroundColor Cyan

exit 0
