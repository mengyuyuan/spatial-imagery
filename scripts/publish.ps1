# Publish only this repository after a human has authenticated GitHub CLI.
# No credential is stored here. Existing repositories are never overwritten.
$ErrorActionPreference = 'Stop'
$siRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
Push-Location $siRoot
try {
  $siLogin = gh api user --jq .login
  if ($LASTEXITCODE -ne 0) { throw 'Run gh auth login first.' }
  if ($siLogin.Trim() -ne 'mengyuyuan') { throw 'Expected GitHub account mengyuyuan; refusing to publish to another account.' }
  $siDirty = git status --porcelain
  if ($siDirty) { throw 'Review and commit all intended files first.' }
  if (-not (Test-Path -LiteralPath 'media/spatial-imagery-launch.mp4')) { throw 'Launch film missing.' }
  gh repo view mengyuyuan/spatial-imagery --json name 2>$null
  if ($LASTEXITCODE -eq 0) { throw 'Repository already exists. Inspect it before publishing; this script never overwrites it.' }
  gh repo create mengyuyuan/spatial-imagery --public --description '空间意象 · Spatial Imagery — subject-led spatial storytelling, camera choreography and sound continuity SDK' --source . --remote origin
  if ($LASTEXITCODE -ne 0) { throw 'Repository creation failed.' }
  git push -u origin main
  if ($LASTEXITCODE -ne 0) { throw 'Main push failed. Inspect state before retrying.' }
  git push -u origin feat/sdk-and-launch-film
  if ($LASTEXITCODE -ne 0) { throw 'Feature push failed. Inspect state before retrying.' }
  gh pr create --repo mengyuyuan/spatial-imagery --base main --head feat/sdk-and-launch-film --title 'feat: 空间意象 SDK / Spatial Imagery SDK and bilingual launch film' --body-file .github/launch-pr.md
  if ($LASTEXITCODE -ne 0) { throw 'PR creation failed. Inspect the repository before retrying.' }
} finally { Pop-Location }
