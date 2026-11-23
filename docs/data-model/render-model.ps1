param([string]$BrowserPath = 'C:\Program Files\Google\Chrome\Application\chrome.exe')
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $BrowserPath)) { throw 'Specify an installed Chrome or Chromium executable using -BrowserPath.' }
$configPath = Join-Path ([System.IO.Path]::GetTempPath()) ('playverified-mermaid-' + [guid]::NewGuid().ToString() + '.json')
$oldSkip = $env:PUPPETEER_SKIP_DOWNLOAD
try {
    @{ executablePath=$BrowserPath } | ConvertTo-Json | Set-Content -LiteralPath $configPath
    $env:PUPPETEER_SKIP_DOWNLOAD = 'true'
    & node (Join-Path $PSScriptRoot 'build-model.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Model generation failed.' }
    Get-ChildItem (Join-Path $PSScriptRoot 'current'),(Join-Path $PSScriptRoot 'proposed') -Filter '*.mmd' | ForEach-Object {
        & npx --yes --package '@mermaid-js/mermaid-cli@11.12.0' mmdc -i $_.FullName -o ([System.IO.Path]::ChangeExtension($_.FullName, '.svg')) -p $configPath -c (Join-Path $PSScriptRoot 'mermaid-config.json') -b white
        if ($LASTEXITCODE -ne 0) { throw "Rendering failed: $($_.Name)" }
    }
    & node (Join-Path $PSScriptRoot 'build-model.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Viewer generation failed.' }
} finally {
    $env:PUPPETEER_SKIP_DOWNLOAD = $oldSkip
    Remove-Item -LiteralPath $configPath -ErrorAction SilentlyContinue
}
