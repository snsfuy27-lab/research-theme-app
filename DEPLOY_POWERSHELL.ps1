$ZipPath = "C:\Users\SSH2026\Downloads\research-theme-app-new-gas-url-and-suggestions-fixed.zip"
$WorkDir = "C:\Users\SSH2026\Downloads\research-theme-app-new-gas-url-and-suggestions-fixed"
$RepoUrl = "https://github.com/snsfuy27-lab/research-theme-app.git"

git config --global user.name "SSH2026"
git config --global user.email "cxz-ewq@hotmail.co.jp"

Remove-Item $WorkDir -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $ZipPath -DestinationPath $WorkDir -Force
Set-Location $WorkDir

if (-not (Test-Path "package.json")) {
    $child = Get-ChildItem -Directory | Select-Object -First 1
    if ($child) { Set-Location $child.FullName }
}

Remove-Item "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue

git init
git branch -M main
git remote remove origin 2>$null
git remote add origin $RepoUrl

git add .
git commit -m "Fix GAS URL and adjective suggestions"
git push -u origin main --force

Write-Host ""
Write-Host "GitHub Pages デプロイ開始"
Write-Host "https://snsfuy27-lab.github.io/research-theme-app/"
