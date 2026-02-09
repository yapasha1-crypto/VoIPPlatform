$baseUrl = "http://localhost:5004"

# Disable SSL check
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

Write-Host "1. Checking File Existence and Content..." -ForegroundColor Cyan
$files = @(
    "admin.html", 
    "admin-users.html", 
    "admin-settings.html", 
    "admin-profile.html",
    "admin-reports.html",
    "admin-system.html",
    "admin-tickets.html"
)

foreach ($file in $files) {
    try {
        $content = (Invoke-WebRequest -Uri "$baseUrl/$file" -UseBasicParsing).Content
        
        # Check for content marker
        if ($content -match 'id="page-content"' -or $content -match 'class="main-content"') {
            Write-Host "  [PASS] $file loaded and has content." -ForegroundColor Green
        }
        else {
            Write-Host "  [FAIL] $file loaded but seems empty (missing #page-content or .main-content)!" -ForegroundColor Red
        }

        # Check for banned legacy wrapper
        if ($content -match '<div class="dashboard-layout">') {
            Write-Host "  [FAIL] $file still has legacy 'dashboard-layout' wrapper!" -ForegroundColor Red
        }
        else {
            Write-Host "  [PASS] $file legacy wrapper removed." -ForegroundColor Green
        }

    }
    catch {
        Write-Host "  [FAIL] Could not fetch $file" -ForegroundColor Red
    }
}

Write-Host "`n2. Checking admin.html specific structure..." -ForegroundColor Cyan
try {
    $adminContent = (Invoke-WebRequest -Uri "$baseUrl/admin.html" -UseBasicParsing).Content
    if ($adminContent -match '<main class="main-content flex-1') {
        Write-Host "  [PASS] admin.html has Unified Layout structure." -ForegroundColor Green
    }
    else {
        Write-Host "  [FAIL] admin.html missing Unified Layout class!" -ForegroundColor Red
    }
}
catch {
    Write-Host "  [FAIL] fetch admin.html" -ForegroundColor Red
}

Write-Host "`nRecovery Verification Complete." -ForegroundColor Cyan
