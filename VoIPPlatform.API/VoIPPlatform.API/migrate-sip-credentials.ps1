# migrate-sip-credentials.ps1
# Copies credentials from VoIPProvider to SipSettings.Credentials in appsettings.json

$configPath = "c:\Users\mejer\Desktop\VoIPPlatform\VoIPPlatform.API\VoIPPlatform.API\appsettings.json"

Write-Host "=== SIP Credential Migration Script ===" -ForegroundColor Cyan
Write-Host "Source: VoIPProvider.ApiUsername / ApiPassword"
Write-Host "Target: SipSettings.Credentials.Username / Password"
Write-Host ""

# Read the JSON file
$json = Get-Content -Path $configPath -Raw | ConvertFrom-Json

# Extract credentials from VoIPProvider
$sourceUsername = $json.VoIPProvider.ApiUsername
$sourcePassword = $json.VoIPProvider.ApiPassword

Write-Host "Found Source Credentials:"
Write-Host "  Username: $sourceUsername"
Write-Host "  Password: $('*' * $sourcePassword.Length) (hidden)"
Write-Host ""

# Update SipSettings.Credentials
$json.SipSettings.Credentials.Username = $sourceUsername
$json.SipSettings.Credentials.Password = $sourcePassword

# Convert back to JSON with proper formatting
$jsonOutput = $json | ConvertTo-Json -Depth 10

# Write back to file
Set-Content -Path $configPath -Value $jsonOutput -Encoding UTF8

Write-Host "✅ Credentials migrated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Updated SipSettings.Credentials:"
Write-Host "  Username: $($json.SipSettings.Credentials.Username)"
Write-Host "  Password: $('*' * $json.SipSettings.Credentials.Password.Length) (hidden)"
Write-Host ""
Write-Host "IMPORTANT: Restart the .NET backend to apply changes." -ForegroundColor Yellow
