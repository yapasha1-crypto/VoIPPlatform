$baseUrl = "http://localhost:5004"
$adminUser = "MasterAdmin"
$adminPass = "MasterPass123!"

# Disable SSL check
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

function Test-Endpoint {
    param($Method, $Uri, $Body, $Headers)
    $params = @{
        Method      = $Method
        Uri         = "$baseUrl$Uri"
        ContentType = "application/json"
        ErrorAction = "Stop"
    }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 5) }
    if ($Headers) { $params.Headers = $Headers }

    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "API Call Failed: $Uri" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Yellow
        }
        return $null
    }
}

Write-Host "1. Testing Layout Files for Hardcoded 'dashboard-layout'..." -ForegroundColor Cyan
$files = @("admin-users.html", "admin-settings.html", "admin-profile.html")
foreach ($file in $files) {
    try {
        $content = (Invoke-WebRequest -Uri "$baseUrl/$file" -UseBasicParsing).Content
        if ($content -match 'class="dashboard-layout"') {
            Write-Host "  [FAIL] $file still has hardcoded layout wrapper!" -ForegroundColor Red
        }
        else {
            Write-Host "  [PASS] $file cleaned." -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  [FAIL] Could not fetch $file" -ForegroundColor Red
    }
}

Write-Host "`n2. Testing Profile Update Logic..." -ForegroundColor Cyan
# Login
$login = Test-Endpoint -Method POST -Uri "/api/Auth/login" -Body @{ username = $adminUser; password = $adminPass }
if ($login.success -or $login.data.token) {
    $token = $login.data.token
    $headers = @{ Authorization = "Bearer $token" }
    
    # Get User ID
    $me = Test-Endpoint -Method GET -Uri "/api/Auth/me" -Headers $headers
    $userId = $me.data.id

    Write-Host "  User ID: $userId" -ForegroundColor Gray

    # Update Profile
    $updateData = @{
        firstName   = "MasterUpdated"
        lastName    = "AdminUpdated"
        phoneNumber = "5555555555"
    }
    
    # Note: Using User Update Endpoint if it exists, likely PUT /api/Users/{id}
    # Check if UsersController accepts this.
    try {
        $update = Test-Endpoint -Method PUT -Uri "/api/Users/$userId" -Headers $headers -Body $updateData
        if ($update -ne $null) {
            Write-Host "  [PASS] Profile Update Successful" -ForegroundColor Green
        }
        else {
            Write-Host "  [FAIL] Profile Update returned null" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  [FAIL] Profile Update Exception" -ForegroundColor Red
    }
    
    # Revert
    $revertData = @{
        firstName   = "Master"
        lastName    = "Admin"
        phoneNumber = "1234567890"
    }
    $revert = Test-Endpoint -Method PUT -Uri "/api/Users/$userId" -Headers $headers -Body $revertData
    if ($revert) { Write-Host "  [INFO] Reverted profile changes." -ForegroundColor Gray }

}
else {
    Write-Host "  [FAIL] Login Failed" -ForegroundColor Red
}
