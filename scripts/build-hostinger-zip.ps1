$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$source = Join-Path $root "apps\web"
$deployRoot = Join-Path $root "deploy\hostinger"
$staging = Join-Path $deployRoot "ibob-agent-web"
$zipPath = Join-Path $deployRoot "ibob-agent-web-hostinger.zip"

New-Item -ItemType Directory -Force -Path $deployRoot | Out-Null

if (Test-Path -LiteralPath $staging) {
  Remove-Item -LiteralPath $staging -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Force -Path $staging | Out-Null

$itemsToCopy = @(
  "src",
  "public",
  "server.js",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "next-env.d.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  ".gitignore"
)

foreach ($item in $itemsToCopy) {
  $from = Join-Path $source $item
  if (Test-Path -LiteralPath $from) {
    $to = Join-Path $staging $item
    if ((Get-Item -LiteralPath $from).PSIsContainer) {
      Copy-Item -LiteralPath $from -Destination $to -Recurse -Force
    } else {
      Copy-Item -LiteralPath $from -Destination $to -Force
    }
  }
}

function ConvertTo-ZipPath {
  param(
    [string] $BasePath,
    [string] $FullPath
  )

  $base = [System.IO.Path]::GetFullPath($BasePath).TrimEnd("\", "/")
  $full = [System.IO.Path]::GetFullPath($FullPath)
  $relative = $full.Substring($base.Length).TrimStart("\", "/")
  return $relative.Replace("\", "/")
}

function Get-SignedExternalAttributes {
  param([uint32] $Value)

  return [System.BitConverter]::ToInt32([System.BitConverter]::GetBytes($Value), 0)
}

$fileAttributes = Get-SignedExternalAttributes ([Convert]::ToUInt32("81A40000", 16)) # 100644
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $priorityFiles = @(
    "package.json",
    "server.js",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "next-env.d.ts"
  )

  $files = Get-ChildItem -LiteralPath $staging -Recurse -File | Sort-Object {
    $entryName = ConvertTo-ZipPath $staging $_.FullName
    $priorityIndex = [Array]::IndexOf($priorityFiles, $entryName)
    if ($priorityIndex -ge 0) { return "{0:D3}-{1}" -f $priorityIndex, $entryName }
    return "999-$entryName"
  }

  foreach ($file in $files) {
    $entryName = ConvertTo-ZipPath $staging $file.FullName
    $entry = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $entry.LastWriteTime = $file.LastWriteTime
    $entry.ExternalAttributes = $fileAttributes

    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    try {
      $fileStream.CopyTo($entryStream)
    } finally {
      $fileStream.Dispose()
      $entryStream.Dispose()
    }
  }
} finally {
  $zip.Dispose()
}

Write-Host "Hostinger ZIP generated:"
Write-Host $zipPath
