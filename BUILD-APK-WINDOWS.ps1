# Build with Node.js, Android SDK 35, Java 17, and Gradle 8.9 on Windows.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js/npm is missing. Install Node.js 22 or later.' }
Write-Host 'Building React frontend (local/offline assets)...'
Push-Location web
try {
  npm install --no-audit --no-fund
  $env:ANDROID_BUILD='1'
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Vite frontend build failed.' }
} finally { Pop-Location; Remove-Item Env:ANDROID_BUILD -ErrorAction SilentlyContinue }
$target = Join-Path $PSScriptRoot 'app\src\main\assets\www'
if (Test-Path $target) { Remove-Item -Recurse -Force $target }
Copy-Item -Recurse (Join-Path $PSScriptRoot 'web\dist') $target
Write-Host 'Frontend assets copied into Android project.'
$gradle = Get-Command gradle -ErrorAction SilentlyContinue
if (!$gradle) {
  $found = @(Get-ChildItem "$env:USERPROFILE\.gradle\wrapper\dists" -Filter 'gradle.bat' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1)
  if ($found.Count -gt 0) { $gradle = $found[0].FullName }
}
if (!$gradle) {
  Write-Host 'Open this project in Android Studio; use Build > Build App Bundle(s) / APK(s) > Build APK(s).' -ForegroundColor Yellow
  throw 'Gradle command not found. Open in Android Studio to sync and build.'
}
& $gradle assembleDebug
if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
Write-Host "APK: $PSScriptRoot\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
