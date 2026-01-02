<#
.SYNOPSIS
    wootui Installer for Windows
.DESCRIPTION
    Installs wootui, manages PATH, and handles versioning.
.EXAMPLE
    .\install.ps1
.EXAMPLE
    .\install.ps1 -Version 1.0.180
.EXAMPLE
    .\install.ps1 -NoModifyPath
#>

param (
    [string]$Version,
    [switch]$Help,
    [switch]$NoModifyPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Set console encoding to UTF-8 to properly display Unicode characters
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# --- Configuration ---
$RepoOwner = "ashesofphoenix"
$RepoName = "wootui"
$AppName = "wootui"
$InstallDir = "$env:USERPROFILE\.wootui\bin"

# --- Colors (Approximation of Bash colors) ---
function Write-Color {
    param([string]$Text, [ConsoleColor]$Color = [ConsoleColor]::White, [switch]$NoNewLine)
    if ($NoNewLine) { Write-Host $Text -ForegroundColor $Color -NoNewline }
    else { Write-Host $Text -ForegroundColor $Color }
}

function Print-Message {
    param([string]$Level, [string]$Message)
    switch ($Level) {
        "info"    { Write-Color $Message -Color Gray }
        "warning" { Write-Color "Warning: $Message" -Color Yellow }
        "error"   { Write-Color "Error: $Message" -Color Red }
        "success" { Write-Color $Message -Color Green }
    }
}

# --- Help Menu ---
if ($Help) {
    Write-Host @"
wootui Installer

Usage: .\install.ps1 [options]

Options:
    -h, -Help           Display this help message
    -v, -Version <ver>  Install a specific version (e.g., 1.0.180)
    -NoModifyPath       Don't modify the User PATH environment variable

Examples:
    irm https://ashesofphoenix.github.io/wootui/install.ps1 | iex
    & { irm ... } -Version 1.0.180
"@
    exit 0
}

# --- Pre-flight Checks ---
# Ensure TLS 1.2+ is used for GitHub
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Detect Architecture
if ($env:PROCESSOR_ARCHITECTURE -eq "AMD64") {
    $Arch = "x64"
} elseif ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
    $Arch = "arm64" # Assuming you might support this later, otherwise it fails below
} else {
    Print-Message "error" "Unsupported architecture: $env:PROCESSOR_ARCHITECTURE"
    exit 1
}

# Construct Filename (Matching Bash logic: wootui-windows-x64.zip)
$Target = "windows-$Arch"
$ArchiveExt = ".zip"
$Filename = "$AppName-$Target$ArchiveExt"

# --- Version Resolution ---
try {
    if ([string]::IsNullOrEmpty($Version)) {
        Print-Message "info" "Fetching latest version info..."
        $LatestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest"
        $SpecificVersion = $LatestRelease.tag_name -replace "^v", ""
        $DownloadUrl = "https://github.com/$RepoOwner/$RepoName/releases/latest/download/$Filename"
    } else {
        $SpecificVersion = $Version -replace "^v", ""
        # Validate version exists via HEAD request
        $TagUrl = "https://github.com/$RepoOwner/$RepoName/releases/tag/v$SpecificVersion"
        try {
            $null = Invoke-WebRequest -Uri $TagUrl -Method Head -ErrorAction Stop
        } catch {
            Print-Message "error" "Release v$SpecificVersion not found."
            Print-Message "info" "Available releases: https://github.com/$RepoOwner/$RepoName/releases"
            exit 1
        }
        $DownloadUrl = "https://github.com/$RepoOwner/$RepoName/releases/download/v$SpecificVersion/$Filename"
    }
} catch {
    Print-Message "error" "Failed to resolve version information. Check your internet connection."
    exit 1
}

# --- Check Existing Installation ---
$ExePath = Join-Path $InstallDir "$AppName.exe"
if (Test-Path $ExePath) {
    # Logic to check version could go here. 
    # Since we can't easily run the binary to check version in this script without risk,
    # we simply inform the user we are updating.
    Print-Message "info" "Existing installation found. Updating to v$SpecificVersion..."
} else {
    Print-Message "info" "Installing $AppName version: v$SpecificVersion"
}

# --- Download and Install ---
$TempDir = Join-Path $env:TEMP "wootui_install_$PID"
$ZipPath = Join-Path $TempDir $Filename

New-Item -ItemType Directory -Force -Path $TempDir | Out-Null
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

try {
    Write-Color "Downloading..." -Color Cyan -NoNewLine
    # Invoke-WebRequest shows a progress bar by default in interactive sessions
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
    Write-Color " Done." -Color Green

    Write-Color "Extracting..." -Color Cyan -NoNewLine
    Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
    
    $BinaryName = [System.IO.Path]::GetFileNameWithoutExtension($Filename) + ".exe"
    $ExtractedBinary = Get-ChildItem -Path $TempDir -Filter $BinaryName -Recurse | Select-Object -First 1
    
    if ($ExtractedBinary) {
        Move-Item -Path $ExtractedBinary.FullName -Destination $ExePath -Force
        Write-Color " Done." -Color Green
    } else {
        throw "Binary not found in the downloaded archive."
    }

} catch {
    Print-Message "error" "Installation failed: $_"
    Remove-Item -Path $TempDir -Recurse -ErrorAction SilentlyContinue
    exit 1
} finally {
    Remove-Item -Path $TempDir -Recurse -ErrorAction SilentlyContinue
}

# --- Path Configuration ---
if (-not $NoModifyPath) {
    $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($UserPath -notlike "*$InstallDir*") {
        try {
            [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", "User")
            Print-Message "success" "Successfully added $AppName to User PATH."
            Print-Message "warning" "You may need to restart your terminal for changes to take effect."
            
            # Update current session path so it works immediately in this window
            $env:PATH = "$env:PATH;$InstallDir"
        } catch {
            Print-Message "warning" "Failed to modify PATH automatically."
            Print-Message "info" "Please add this directory to your PATH manually: $InstallDir"
        }
    } else {
        Print-Message "info" "$AppName is already in your PATH."
    }
}

# --- Footer / Logo ---
Write-Host ""
Write-Color "█░░░█ █▀▀█ █▀▀█ " -Color DarkGray -NoNewLine; Write-Color "▀▀█▀▀ █░░█ ▀█▀" -Color White
Write-Color "█▄█▄█ █░░█ █░░█ " -Color DarkGray -NoNewLine; Write-Color "░░█░░ █░░█ ░█░" -Color White
Write-Color "░▀░▀░ ▀▀▀▀ ▀▀▀▀ " -Color DarkGray -NoNewLine; Write-Color "░░▀░░ ░▀▀▀ ▀▀▀" -Color White
Write-Host ""
Write-Host ""
Write-Color "For more information visit " -Color DarkGray -NoNewLine
Write-Color "https://ashesofphoenix.github.io/wootui" -Color White
Write-Host ""