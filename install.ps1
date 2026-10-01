$ErrorActionPreference = "Stop"

Write-Host "Listen Together - Instalador" -ForegroundColor Cyan

$customApps = "$env:APPDATA\spicetify\CustomApps"
$source = Join-Path $PSScriptRoot "app"
$target = Join-Path $customApps "listen-together"

if (-not (Test-Path $source)) {
    Write-Host "No se encontro la carpeta app. Ejecuta: npm run build" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $customApps)) {
    New-Item -ItemType Directory -Path $customApps -Force | Out-Null
}

Write-Host "Copiando archivos..." -ForegroundColor Yellow
if (Test-Path $target) {
    Remove-Item -Recurse -Force $target
}
Copy-Item -Recurse -Force $source $target

spicetify config custom_apps listen-together
spicetify apply

Write-Host "Instalado en: $target" -ForegroundColor Green
Write-Host "Reinicia Spotify para ver 'Listen Together' en el menu lateral." -ForegroundColor Cyan
