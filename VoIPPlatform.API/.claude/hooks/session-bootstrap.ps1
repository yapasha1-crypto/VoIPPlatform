# .claude/hooks/session-bootstrap.ps1
# Inject PROJECT_STATUS.md into Claude context at session start (Windows / PowerShell)

$ErrorActionPreference = "SilentlyContinue"

# We are running from VoIPPlatform.API; PROJECT_STATUS.md is one level up
$projectStatusPath = Join-Path (Get-Location) "..\PROJECT_STATUS.md"

if (-not (Test-Path $projectStatusPath)) {
  # If file not found, exit quietly
  exit 0
}

# Read file (limit to avoid huge injections)
$content = Get-Content $projectStatusPath -Raw
$maxChars = 12000
if ($content.Length -gt $maxChars) {
  $content = $content.Substring(0, $maxChars) + "`n...[TRUNCATED]..."
}

# Build additional context
$ctx = @"
[BOOTSTRAP CONTEXT — ALWAYS TRUST THIS]
You are continuing an existing MVNE/VoIP platform.

1) PROJECT_STATUS.md (latest):
$content

2) Required behavior:
- Execution mode, minimal diffs, no redesign.
- Propose ONE next step only; do not code until user confirms.
"@

# Output JSON for Claude Code hook
# (SessionStart supports hookSpecificOutput.additionalContext)
$payload = @{
  hookSpecificOutput = @{
    hookEventName = "SessionStart"
    additionalContext = $ctx
  }
} | ConvertTo-Json -Compress

Write-Output $payload
exit 0
