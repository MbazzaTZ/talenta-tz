# ============================================================================
# TALENTA-TZ - AUTOMATIC GIT SYNC SCRIPT (POWERSHELL FOR WINDOWS)
# Pulls latest changes from GitHub and pushes local changes automatically
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║              🔄 TALENTA-TZ - GIT AUTO SYNC STARTING...                      ║" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Get current directory
$ProjectDir = Get-Location
Write-Host "📁 Working Directory: $ProjectDir" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: CHECK GIT STATUS
# ============================================================================
Write-Host "Step 1: Checking Git Status..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git status
Write-Host ""

# ============================================================================
# STEP 2: PULL LATEST CHANGES FROM GITHUB
# ============================================================================
Write-Host "Step 2: Pulling Latest Changes from GitHub..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

try {
    git pull origin main 2>&1 | Out-Null
    Write-Host "✅ Successfully pulled latest changes from GitHub" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not pull (might already be up to date or no internet)" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# STEP 3: CHECK FOR LOCAL CHANGES
# ============================================================================
Write-Host "Step 3: Checking for Local Changes..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$ChangedFiles = git diff --name-only
$UntrackedFiles = git ls-files --others --exclude-standard

if ($null -eq $ChangedFiles -or $ChangedFiles.Length -eq 0) {
    if ($null -eq $UntrackedFiles -or $UntrackedFiles.Length -eq 0) {
        Write-Host "✅ No local changes to commit" -ForegroundColor Green
        $ChangesExist = $false
    } else {
        Write-Host "📝 Found untracked files:" -ForegroundColor Yellow
        $UntrackedFiles | ForEach-Object { Write-Host "  - $_" }
        $ChangesExist = $true
    }
} else {
    Write-Host "📝 Found local changes:" -ForegroundColor Yellow
    Write-Host "Modified files:" -ForegroundColor Yellow
    $ChangedFiles | ForEach-Object { Write-Host "  - $_" }
    if ($null -ne $UntrackedFiles -and $UntrackedFiles.Length -gt 0) {
        Write-Host "Untracked files:" -ForegroundColor Yellow
        $UntrackedFiles | ForEach-Object { Write-Host "  - $_" }
    }
    $ChangesExist = $true
}
Write-Host ""

# ============================================================================
# STEP 4: PUSH LOCAL CHANGES TO GITHUB
# ============================================================================
Write-Host "Step 4: Pushing Local Changes to GitHub..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ($ChangesExist) {
    # Add all changes
    git add .
    
    # Get current timestamp and hostname
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $ComputerName = $env:COMPUTERNAME
    
    # Commit changes
    try {
        git commit -m "sync: auto-sync from $ComputerName - $Timestamp" 2>&1 | Out-Null
        Write-Host "✅ Committed changes locally" -ForegroundColor Green
        
        # Push to GitHub
        try {
            git push origin main 2>&1 | Out-Null
            Write-Host "✅ Successfully pushed changes to GitHub" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
            Write-Host "   Try: git push origin main"
        }
    } catch {
        Write-Host "⚠️  No new changes to commit" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ No changes to push" -ForegroundColor Green
}
Write-Host ""

# ============================================================================
# STEP 5: SHOW SYNC STATUS
# ============================================================================
Write-Host "Step 5: Final Git Status" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -3
Write-Host ""

# ============================================================================
# DONE
# ============================================================================
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║                   ✅ GIT SYNC COMPLETE! ✅                                   ║" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "║         Your local and GitHub repositories are now in sync! 🚀              ║" -ForegroundColor Green
Write-Host "║                                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Sync Summary:" -ForegroundColor Cyan
Write-Host "   ✓ Pulled latest changes from GitHub"
Write-Host "   ✓ Committed local changes"
Write-Host "   ✓ Pushed to GitHub"
Write-Host "   ✓ Ready to work!"
Write-Host ""
