<#
.SYNOPSIS
  Build and deploy static site to remote server via SSH.
.DESCRIPTION
  Reads config from .env, runs npm run build:prod and
  syncs dist/ to remote server via tar over SSH.
.PARAMETER DryRun
  Show commands without executing.
.PARAMETER SkipBuild
  Skip build step, deploy only.
.EXAMPLE
  .\deploy.ps1
  .\deploy.ps1 -DryRun
  .\deploy.ps1 -SkipBuild
#>

param(
  [switch]$DryRun,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

# ─── 1. Load .env ───
$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+?)\s*=\s*(.+?)\s*$') {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
  }
}

$sshHost  = [Environment]::GetEnvironmentVariable('DEPLOY_SSH_HOST')
$sshPort  = [Environment]::GetEnvironmentVariable('DEPLOY_SSH_PORT')
if (-not $sshPort) { $sshPort = '22' }
$sshUser  = [Environment]::GetEnvironmentVariable('DEPLOY_SSH_USER')
$remotePath = [Environment]::GetEnvironmentVariable('DEPLOY_REMOTE_PATH')
if ($remotePath) { $remotePath = $remotePath.TrimEnd('/') }

if (-not $sshHost -or -not $sshUser -or -not $remotePath) {
  Write-Host "ERROR: Set DEPLOY_SSH_HOST, DEPLOY_SSH_USER and DEPLOY_REMOTE_PATH in .env" -ForegroundColor Red
  exit 1
}

$identityFile = [Environment]::GetEnvironmentVariable('DEPLOY_SSH_KEY')
if ($identityFile -and (Test-Path $identityFile)) {
  $identityFile = (Resolve-Path $identityFile).Path
}
$identityArg = if ($identityFile) { "-i `"$identityFile`"" } else { '' }

$remote = "${sshUser}@${sshHost}"
$portArg = if ($sshPort -ne '22') { "-P $sshPort" } else { '' }

# ─── Fix SSH key permissions (Windows OpenSSH requires restrictive ACLs) ───
if ($identityFile -and (Test-Path $identityFile)) {
  $identityFullPath = (Resolve-Path $identityFile).Path
  icacls $identityFullPath /reset 2>$null
  icacls $identityFullPath /inheritance:r 2>$null
  icacls $identityFullPath /grant "${env:USERNAME}:(R)" 2>$null
}

# ─── 2. Build ───
if (-not $SkipBuild) {
  Write-Host "`n==> Building project..." -ForegroundColor Cyan
  if ($DryRun) {
    Write-Host "  [DryRun] npm run build:prod" -ForegroundColor Yellow
  } else {
    Push-Location $PSScriptRoot
    npm run build:prod
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Build failed" -ForegroundColor Red
      exit 1
    }
    Pop-Location
  }
}

# ─── 3. Deploy via tar + ssh ───
$distPath = Join-Path $PSScriptRoot 'dist'
$dataPath = Join-Path $PSScriptRoot 'data'
if (-not (Test-Path $distPath)) {
  Write-Host "ERROR: dist/ not found. Run build first." -ForegroundColor Red
  exit 1
}

$sshArgStr = ""
if ($sshPort -ne '22') { $sshArgStr += "-P $sshPort " }
if ($identityFile) { $sshArgStr += "-i `"$identityFile`" " }
# Сохраняем data/ на сервере перед очисткой, восстанавливаем после распаковки
$sshArgStr += "$remote `"cp -r ${remotePath}/data /tmp/.deploy-data 2>/dev/null; rm -rf ${remotePath}/* ${remotePath}/.[!.]* 2>/dev/null; mkdir -p ${remotePath}/data 2>/dev/null; cp -r /tmp/.deploy-data/* ${remotePath}/data/ 2>/dev/null; rm -rf /tmp/.deploy-data; tar -xzf - -C $remotePath; chown -R www-data:www-data ${remotePath}/data 2>/dev/null; chmod -R 775 ${remotePath}/data 2>/dev/null`""

Write-Host "`n==> Deploying to ${remote}:${remotePath} ..." -ForegroundColor Cyan

if ($DryRun) {
  Write-Host "  [DryRun] tar -czf - -C `"$distPath`" --exclude __pycache__ . | ssh $sshArgStr" -ForegroundColor Yellow
} else {
  Write-Host "  Archiving and transferring..." -ForegroundColor Gray

  $targz = Join-Path $env:TEMP "deploy-$(Get-Random).tar.gz"
  $scriptsDir = Join-Path $PSScriptRoot 'scripts'
  try {
    # Создаём временную папку, объединяем dist + scripts
    $tmpDir = Join-Path $env:TEMP "deploy-tmp-$(Get-Random)"
    New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
    Copy-Item -Recurse -Path "$distPath\*" -Destination $tmpDir
    if (Test-Path $scriptsDir) {
      Copy-Item -Recurse -Path $scriptsDir -Destination $tmpDir
    }

    & tar -czf $targz -C $tmpDir --exclude __pycache__ .
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  Archive creation failed" -ForegroundColor Red
      exit 1
    }

    $bytes = [System.IO.File]::ReadAllBytes($targz)

    $psi = New-Object System.Diagnostics.ProcessStartInfo('ssh', $sshArgStr)
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $proc = [System.Diagnostics.Process]::Start($psi)

    try {
      $proc.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
      $proc.StandardInput.Close()
    } catch [System.IO.IOException] {
      $stderr = $proc.StandardError.ReadToEnd()
      $proc.WaitForExit()
      Write-Host "  Deploy failed: $($_.Exception.Message)" -ForegroundColor Red
      if ($stderr) { Write-Host "  SSH: $stderr" -ForegroundColor Red }
      exit 1
    }

    $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
    $stderrTask = $proc.StandardError.ReadToEndAsync()
    $proc.WaitForExit()
    $stdout = $stdoutTask.Result
    $stderr = $stderrTask.Result

    if ($proc.ExitCode -ne 0) {
      Write-Host "  Deploy failed (exit code: $($proc.ExitCode))" -ForegroundColor Red
      if ($stdout) { Write-Host "  SSH stdout: $stdout" -ForegroundColor Red }
      if ($stderr) { Write-Host "  SSH stderr: $stderr" -ForegroundColor Red }
      exit 1
    }
  } finally {
    Remove-Item $targz -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Path $tmpDir -ErrorAction SilentlyContinue
  }

  Write-Host "  Done." -ForegroundColor Green
}

# ─── 4. Deploy nginx config ───
$nginxSite = 'python.nayanovaacademy.ru'
$nginxLocal = Join-Path $PSScriptRoot $nginxSite
$nginxRemote = '/etc/nginx/sites-available/' + $nginxSite

if ($DryRun) {
  Write-Host "  [DryRun] Deploy nginx config: $nginxSite" -ForegroundColor Yellow
} elseif (Test-Path $nginxLocal) {
  Write-Host "`n==> Deploying nginx config ($nginxSite) ..." -ForegroundColor Cyan
  $scpCmd = "scp $portArg $identityArg `"$nginxLocal`" ${remote}:/tmp/nginx-$nginxSite"
  $sshNginxCmd = "ssh $portArg $identityArg $remote `"cp /tmp/nginx-$nginxSite $nginxRemote && nginx -t && systemctl reload nginx && rm -f /tmp/nginx-$nginxSite`""
  cmd /c $scpCmd
  if ($LASTEXITCODE -ne 0) { Write-Host "  Nginx config scp failed" -ForegroundColor Red; exit 1 }
  cmd /c $sshNginxCmd
  if ($LASTEXITCODE -ne 0) { Write-Host "  Nginx config install/reload failed" -ForegroundColor Red; exit 1 }
  Write-Host "  Done." -ForegroundColor Green
}

Write-Host "`n==> Deploy complete" -ForegroundColor Green
