# Restore Script for Nexus Shop
# This script restores files from backup

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupName
)

$backupDir = ".\backups"
$backupPath = "$backupDir\$BackupName"

if (!(Test-Path $backupPath)) {
    Write-Host "❌ Backup not found: $backupPath" -ForegroundColor Red
    Write-Host "Available backups:" -ForegroundColor Yellow
    Get-ChildItem -Path $backupDir -Directory | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }
    exit 1
}

Write-Host "🔄 Restoring from backup: $backupPath" -ForegroundColor Green
Write-Host "⚠️ This will overwrite current files. Continue? (y/N)" -ForegroundColor Yellow

$response = Read-Host
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ Restore cancelled" -ForegroundColor Red
    exit 0
}

# Stop server if running
Write-Host "🛑 Stopping server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Create restore backup of current state
$restoreBackupDir = ".\restore-backups"
if (!(Test-Path $restoreBackupDir)) {
    New-Item -ItemType Directory -Path $restoreBackupDir
}

$currentBackupPath = "$restoreBackupDir\before-restore_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
New-Item -ItemType Directory -Path $currentBackupPath

# Backup current state
$directories = @("app", "components", "lib", "prisma", "scripts")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Copy-Item -Path $dir -Destination "$currentBackupPath\$dir" -Recurse -Force
    }
}

Write-Host "✅ Current state backed up to: $currentBackupPath" -ForegroundColor Green

# Restore from backup
Write-Host "🔄 Restoring files..." -ForegroundColor Yellow

foreach ($dir in $directories) {
    $backupDirPath = "$backupPath\$dir"
    if (Test-Path $backupDirPath) {
        # Remove current directory
        if (Test-Path $dir) {
            Remove-Item -Path $dir -Recurse -Force
        }
        # Copy from backup
        Copy-Item -Path $backupDirPath -Destination $dir -Recurse -Force
        Write-Host "✅ Restored: $dir" -ForegroundColor Green
    }
}

# Restore important files
$files = @("package.json", "package-lock.json", "next.config.ts", "tsconfig.json")
foreach ($file in $files) {
    $backupFilePath = "$backupPath\$file"
    if (Test-Path $backupFilePath) {
        Copy-Item -Path $backupFilePath -Destination $file -Force
        Write-Host "✅ Restored: $file" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Restore completed successfully!" -ForegroundColor Green
Write-Host "📁 Restored from: $backupPath" -ForegroundColor Yellow
Write-Host "📁 Current state backup: $currentBackupPath" -ForegroundColor Yellow
Write-Host "`n🔄 Now you can restart the server with: npm run dev" -ForegroundColor Cyan
