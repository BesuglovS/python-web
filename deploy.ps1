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

# --- Deploy marker: writes version.json into the deployed payload ---
# Records commit/branch/tree/dirty/deployedAt/via so the deployed content can be
# compared with the local repository later (see na-web/check-deploy.ps1).
function New-DeployMarker {
  param(
    [Parameter(Mandatory)][string]$ProjectDir,
    [Parameter(Mandatory)][string]$OutFile,
    [string]$Via = 'deploy.ps1'
  )
  $commit = $null; $branch = $null; $tree = $null; $dirty = $null; $changed = $null
  if (Test-Path (Join-Path $ProjectDir '.git')) {
    $prevEap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try {
      $commit  = (& git -C $ProjectDir rev-parse HEAD 2>$null)
      $branch  = (& git -C $ProjectDir rev-parse --abbrev-ref HEAD 2>$null)
      $tracked   = @(& git -C $ProjectDir diff HEAD --numstat 2>$null)
      $untracked = @(& git -C $ProjectDir ls-files -o --exclude-standard 2>$null)
      $changed   = $tracked.Count + $untracked.Count
      $dirty     = ($changed -gt 0)
      if ($dirty) {
        $stash = (& git -C $ProjectDir stash create 2>$null)
        if ($stash) { $tree = (& git -C $ProjectDir rev-parse "$($stash.Trim())^{tree}" 2>$null) }
      } else {
        $tree = (& git -C $ProjectDir rev-parse 'HEAD^{tree}' 2>$null)
      }
    } finally { $ErrorActionPreference = $prevEap }
  }
  $marker = [ordered]@{
    project    = Split-Path -Leaf $ProjectDir
    commit     = if ($commit) { $commit.Trim() } else { $null }
    branch     = if ($branch) { $branch.Trim() } else { $null }
    tree       = if ($tree)   { $tree.Trim() }   else { $null }
    dirty      = $dirty
    dirtyFiles = $changed
    deployedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    deployedBy = $env:USERNAME
    via        = $Via
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutFile) | Out-Null
  [System.IO.File]::WriteAllText($OutFile, ($marker | ConvertTo-Json -Depth 3),
    (New-Object System.Text.UTF8Encoding($false)))
}

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

# Guard: the deploy wipes remotePath (rm -rf), allow only the project webroot.
$expectedPath = '/var/www/python.nayanovaacademy.ru/public'
if ($remotePath -ne $expectedPath) {
  Write-Host ("ERROR: wrong DEPLOY_REMOTE_PATH=$remotePath, expected=$expectedPath. Deploy aborted.") -ForegroundColor Red
  exit 1
}

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

# --- Deploy marker (version.json goes to webroot) ---
New-DeployMarker -ProjectDir $PSScriptRoot -OutFile (Join-Path $distPath 'version.json')

$sshArgStr = ""
if ($sshPort -ne '22') { $sshArgStr += "-P $sshPort " }
if ($identityFile) { $sshArgStr += "-i `"$identityFile`" " }
# data/ НЕ стирается и НЕ восстанавливается: каталог остаётся под www-data
# (SQLite с персональными данными переживает деплой), webroot стирается
# и распаковывается от deploy-пользователя. Удаление www-data-файлов в
# webroot под силами deploy, т.к. его основная группа — www-data.
# tar-исключения: __pycache__ и .ratelimit — runtime-каталоги, которые
# перезаписали бы боевое состояние rate-limiter на сервере.
$remoteScript = "find \`"$remotePath\`" -mindepth 1 -maxdepth 1 ! -name 'data' -exec rm -rf {} + 2>/dev/null; " +
  "mkdir -p \`"$remotePath/data\`" 2>/dev/null; " +
  "tar -xzf - --skip-old-files -C \`"$remotePath\`"; " +
  "chmod -R g+w \`"$remotePath/sandbox\`" 2>/dev/null || true"
$sshArgStr += "$remote `"$remoteScript`""

Write-Host "`n==> Deploying to ${remote}:${remotePath} ..." -ForegroundColor Cyan

if ($DryRun) {
  Write-Host "  [DryRun] tar -czf - -C `"$distPath`" --exclude __pycache__ --exclude .ratelimit --exclude .repl_sessions . | ssh $sshArgStr" -ForegroundColor Yellow
} else {
  Write-Host "  Archiving and transferring..." -ForegroundColor Gray

  $targz = Join-Path $env:TEMP "deploy-$(Get-Random).tar.gz"
  try {
    & tar -czf $targz -C $distPath --exclude __pycache__ --exclude .ratelimit --exclude .repl_sessions .
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
  }

  Write-Host "  Done." -ForegroundColor Green
}

# ─── 3b. Sandbox isolation + web-root permissions ───
# Изоляция (helper sandbox-python.run, sudoers, права web-root) на сервере
# устанавливается ОДНОРАЗОВО от root:
#   bash scripts/setup-sandbox-isolation.sh /var/www/python.nayanovaacademy.ru/public
# Обычный деплой (deploy-пользователь без root) ничего не трогает:
# webroot при деплое стирается только содержимым тарбола, data/, .repl_sessions
# и .ratelimit остаются под www-data.
# Порядок критичен: конфиг устанавливается ТОЛЬКО после успешного nginx -t.
# При провале предыдущий (рабочий) конфиг восстанавливается хелпером.
# Установка выполняется через root-хелпер /usr/local/sbin/deploy-nginx.sh
# (sudoers deploy-nginx): хелпер сам валидирует nginx -t и откатывает конфиг
# при ошибке.
$nginxSite = 'python.nayanovaacademy.ru'
$nginxLocal = Join-Path $PSScriptRoot $nginxSite

if ($DryRun) {
  Write-Host "  [DryRun] Deploy nginx config: $nginxSite" -ForegroundColor Yellow
} elseif (Test-Path $nginxLocal) {
  Write-Host "`n==> Deploying nginx config ($nginxSite) ..." -ForegroundColor Cyan
  $scpCmd = "scp $portArg $identityArg `"$nginxLocal`" ${remote}:/tmp/nginx-$nginxSite"
  cmd /c $scpCmd
  if ($LASTEXITCODE -ne 0) { Write-Host "  Nginx config scp failed" -ForegroundColor Red; exit 1 }

  $sshNginxCmd = 'ssh ' + $portArg + ' ' + $identityArg + ' ' + $remote + ' "sudo -n /usr/local/sbin/deploy-nginx.sh ' + $nginxSite + '"'
  cmd /c $sshNginxCmd
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  nginx deploy failed (config not applied). Deploy aborted." -ForegroundColor Red
    exit 1
  }
  Write-Host "  Done." -ForegroundColor Green
}

# ─── 5. Smoke check ───
if (-not $DryRun -and -not $SkipBuild) {
  Write-Host "`n==> Smoke check..." -ForegroundColor Cyan
  $siteUrl = 'https://python.nayanovaacademy.ru/'
  try {
    $resp = Invoke-WebRequest -Uri $siteUrl -Method Head -TimeoutSec 30 -UseBasicParsing
    if ($resp.StatusCode -eq 200) {
      Write-Host "  Site responds with HTTP 200." -ForegroundColor Green
    } else {
      Write-Host "  WARNING: site responded with HTTP $($resp.StatusCode)" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "  WARNING: smoke check failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

Write-Host "`n==> Deploy complete" -ForegroundColor Green
