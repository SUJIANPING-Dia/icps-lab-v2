param(
  [string]$ReportsBranch = "automation-reports",
  [string]$Destination = "reports"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$destinationPath = Join-Path $repoRoot $Destination

Push-Location $repoRoot
try {
  git fetch origin $ReportsBranch
  if ($LASTEXITCODE -ne 0) {
    throw "Could not fetch origin/$ReportsBranch. Confirm the workflow has created the branch."
  }

  New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null

  $files = git ls-tree -r --name-only "origin/$ReportsBranch"
  if ($LASTEXITCODE -ne 0 -or -not $files) {
    throw "Could not list report files from origin/$ReportsBranch."
  }

  foreach ($file in $files) {
    $targetPath = Join-Path $destinationPath $file
    $targetDirectory = Split-Path $targetPath -Parent
    New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null

    $content = git show "origin/$ReportsBranch`:$file"
    if ($LASTEXITCODE -ne 0) {
      throw "Could not read $file from origin/$ReportsBranch."
    }

    Set-Content -Path $targetPath -Value $content -Encoding UTF8
  }

  Write-Host "Automation reports synced to: $destinationPath"
  Write-Host "Latest report: $(Join-Path $destinationPath 'achievements-sync\latest.md')"
  Write-Host "Latest run report: $(Join-Path $destinationPath 'achievements-sync\runs\latest-run.md')"
  Write-Host "All run reports: $(Join-Path $destinationPath 'achievements-sync\runs')"
}
finally {
  Pop-Location
}
