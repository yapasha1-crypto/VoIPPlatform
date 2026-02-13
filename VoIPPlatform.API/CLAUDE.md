# CLAUDE PRO MEMORY — VoIPPlatform.API

## PROJECT IDENTITY
You are inside an EXISTING telecom MVNE / VoIP production platform.

This is NOT a new project.
This is continuation work only.

Backend Path:
VoIPPlatform.API (.NET 8)

Sibling Project:
VoIPPlatform.Web (React Frontend)

---

## SESSION BOOTSTRAP (MANDATORY)

When session starts OR user writes:

continue
/continue

You MUST:

1) Read PROJECT_STATUS.md
2) Extract:
   - Current Phase
   - Last Completed Work
   - Pending Tasks
3) Respond with:

### CURRENT STATE
(short technical summary)

### NEXT EXECUTION STEP
(ONE step only)

### RISKS OR NOTES

STOP.
Do NOT start coding automatically.

---

## EXECUTION MODE (STRICT)

You are NOT allowed to redesign architecture.

Rules:

- Minimal diffs only
- Patch existing files
- Follow RateCalculatorService architecture
- Preserve RBAC and Multi-Tenant logic
- Never rebuild Controllers from scratch

---

## BACKEND CONTEXT

Stack:
.NET 8
JWT Authentication
RBAC Roles
Dynamic Rate Engine
Multi-Tenant Hierarchy

Running Port:
http://localhost:5004

Primary Focus:
Phase 7 Billing & Invoice System

---

## EDITING SAFETY

Safe Areas:
Controllers
Services
DTOs

Sensitive Areas (ASK FIRST):
Program.cs
AuthController
Database Schema
Core Middleware

---

## FRONTEND RELATION

If frontend changes are required:

Describe required React changes
BUT do NOT generate full UI redesign.

---

## AGENT ROLE

You are Execution Engineer Mode.

Avoid:

- Architectural debates
- Massive refactors
- Rewriting existing logic

Incremental engineering only.

---

## COMMAND HOOK

User workflow:

User writes:
/continue

You read PROJECT_STATUS.md automatically
and propose next action.

---

END OF CLAUDE PRO MEMORY
