# Auto Backup Script for Nexus Shop
# This script creates automatic backups of important files

$backupDir = ".\backups"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupPath = "$backupDir\backup_$timestamp"

# Create backup directory if it doesn't exist
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# Create timestamped backup folder
New-Item -ItemType Directory -Path $backupPath

Write-Host "🔄 Creating backup: $backupPath" -ForegroundColor Green

# Backup important directories
$directories = @(
    "app",
    "components", 
    "lib",
    "prisma",
    "scripts"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        $destPath = "$backupPath\$dir"
        Copy-Item -Path $dir -Destination $destPath -Recurse -Force
        Write-Host "✅ Backed up: $dir" -ForegroundColor Green
    }
}

# Backup important files
$files = @(
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "README.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "$backupPath\$file" -Force
        Write-Host "✅ Backed up: $file" -ForegroundColor Green
    }
}

# Create backup info file
$backupInfo = @"
Backup Created: $timestamp
Project: Nexus Shop
Backup Location: $backupPath

Directories Backed Up:
$($directories -join "`n")

Files Backed Up:
$($files -join "`n")

To Restore:
1. Stop the server
2. Copy files from backup folder to project root
3. Restart server
"@

$backupInfo | Out-File -FilePath "$backupPath\BACKUP_INFO.txt" -Encoding UTF8

Write-Host "`n🎉 Backup completed successfully!" -ForegroundColor Green
Write-Host "📁 Backup location: $backupPath" -ForegroundColor Yellow
Write-Host "📝 Backup info: $backupPath\BACKUP_INFO.txt" -ForegroundColor Yellow

# Keep only last 5 backups
$backups = Get-ChildItem -Path $backupDir -Directory | Sort-Object CreationTime -Descending
if ($backups.Count -gt 5) {
    $oldBackups = $backups | Select-Object -Skip 5
    foreach ($oldBackup in $oldBackups) {
        Remove-Item -Path $oldBackup.FullName -Recurse -Force
        Write-Host "🗑️ Removed old backup: $($oldBackup.Name)" -ForegroundColor Red
    }
}
