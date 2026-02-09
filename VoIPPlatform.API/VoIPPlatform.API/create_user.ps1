$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    username = "TestUser"
    password = "TestPass123!"
    email = "testuser@beroea.com"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5004/api/Auth/register" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "User Created: $($response.message)"
} catch {
    Write-Host "Error: $_"
}
