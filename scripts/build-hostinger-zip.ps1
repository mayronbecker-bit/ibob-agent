$ErrorActionPreference = "Stop"

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
  "package.json",
  "package-lock.json",
  "next.config.ts",
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

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force

Write-Host "Hostinger ZIP generated:"
Write-Host $zipPath
