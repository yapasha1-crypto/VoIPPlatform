$baseUrl = "http://localhost:5004"
$adminUser = "MasterAdmin"
$adminPass = "MasterPass123!"

# Disable SSL check
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

Write-Host "Checking server status..." -ForegroundColor Cyan
try {
    $status = Invoke-WebRequest -Uri "$baseUrl/swagger/index.html" -UseBasicParsing -ErrorAction Stop
    Write-Host "Server is UP!" -ForegroundColor Green
}
catch {
    Write-Host "Server is DOWN! aborting." -ForegroundColor Red
    exit 1
}

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

Write-Host "`n1. Purging Database..." 
$purge = Test-Endpoint -Method POST -Uri "/api/Auth/purge-and-reset"
if ($purge.success) { Write-Host "Purge OK" -ForegroundColor Green } else { Write-Host "Purge Failed" -ForegroundColor Red; exit }

Write-Host "`n2. Logging in as MasterAdmin..."
$login = Test-Endpoint -Method POST -Uri "/api/Auth/login" -Body @{ username = $adminUser; password = $adminPass }

# Handle nested data structure
$token = $null
if ($login.data) { $token = $login.data.token } elseif ($login.token) { $token = $login.token }

if ($login.success -or $token) {
    if (!$token) { 
        Write-Host "Login Success but Token Missing in Response!" -ForegroundColor Red 
        Write-Host "Response: $($login | ConvertTo-Json -Depth 5)" -ForegroundColor Yellow
        exit 
    }
    
    Write-Host "MasterAdmin Token Received: $($token.Substring(0, 10))..." -ForegroundColor Green
    $headers = @{ Authorization = "Bearer $token" }

    Write-Host "`n3. Getting User Info..."
    $me = Test-Endpoint -Method GET -Uri "/api/Auth/me" -Headers $headers
    $userId = $null
    if ($me.data) { $userId = $me.data.id } elseif ($me.id) { $userId = $me.id }
    
    if ($userId) { Write-Host "User ID: $userId" -ForegroundColor Green } else { Write-Host "Failed to get ID" -ForegroundColor Red; exit }

    Write-Host "`n4. Verifying Account Balance..."
    try {
        $balance = Test-Endpoint -Method GET -Uri "/api/Accounts/$userId/balance" -Headers $headers
        # Balance might be nested too? Check AuthController.
        # AuthController: return Ok(new { success = true, data = { balance = ... } }) ? No, assume direct or data object.
        # But apiService.js handles it. Let's see response.
        if ($balance.data) { $bal = $balance.data.balance } else { $bal = $balance.balance }
        
        if ($bal -ne $null) {
            Write-Host "Balance: $bal (SUCCESS)" -ForegroundColor Green
        }
        else {
            Write-Host "Balance request returned null/empty (FAILURE)" -ForegroundColor Red
            Write-Host "Raw Response: $($balance | ConvertTo-Json -Depth 5)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Balance Check Failed (Likely 404)" -ForegroundColor Red
    }
}
else {
    Write-Host "Login Failed for MasterAdmin" -ForegroundColor Red
    # Write-Host "Msg: $($login.messageEn)" -ForegroundColor Yellow
}

Write-Host "`n4b. Testing New User Registration & Login (Isolation Test)..."
$rand = Get-Random
$newUser = "testuser$rand"
$newPass = "TestPass123!"
$regBody = @{ 
    username = $newUser
    password = $newPass
    email = "$newUser@test.com"
    firstName = "Test"; lastName = "User"; phoneNumber = "1234567890"; countryCode = "+1"
}
$reg = Test-Endpoint -Method POST -Uri "/api/Auth/register" -Body $regBody

if ($reg.success -or $reg.message -match "successful" -or $reg.userId) {
    Write-Host "Registration OK for $newUser" -ForegroundColor Green
    $loginUser = Test-Endpoint -Method POST -Uri "/api/Auth/login" -Body @{ username = $newUser; password = $newPass }
    if ($loginUser.success) {
        Write-Host "Login OK for New User (Hashing Works Globally)" -ForegroundColor Green
    }
    else {
        Write-Host "Login Failed for New User (Global Hashing/Login Issue!)" -ForegroundColor Red
        # Write-Host "Message: $($loginUser.messageEn)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Registration Failed: $($reg | ConvertTo-Json)" -ForegroundColor Red
}

Write-Host "`n5. Checking admin.html content..."
try {
    $html = Invoke-WebRequest -Uri "$baseUrl/admin.html" -UseBasicParsing
    if ($html.Content -match 'dashboard-layout') {
        Write-Host "WARNING: 'dashboard-layout' wrapper still found in admin.html!" -ForegroundColor Red
    }
    else {
        Write-Host "SUCCESS: 'dashboard-layout' wrapper removed." -ForegroundColor Green
    }
}
catch {
    Write-Host "Failed to fetch admin.html" -ForegroundColor Red
}
