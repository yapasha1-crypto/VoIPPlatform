$baseUrl = "http://localhost:5004"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

Write-Host "1. Structure Verification" -ForegroundColor Cyan
$files = @("admin.html", "admin-profile.html")
foreach ($file in $files) {
    try {
        $content = (Invoke-WebRequest -Uri "$baseUrl/$file" -UseBasicParsing).Content

        # Check for Layout classes
        if ($content -match 'class=".*main-content.*"') {
            Write-Host "  [PASS] $file has main-content class." -ForegroundColor Green
        }
        else {
            Write-Host "  [FAIL] $file missing main-content class!" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  [FAIL] Could not fetch $file" -ForegroundColor Red
    }
}
write-host "Done."
