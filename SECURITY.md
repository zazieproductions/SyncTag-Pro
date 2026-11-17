# Security Policy

## Security Model Overview

**SyncTag Pro** is a zero-backend, client-side browser application. There is no application server, database, authentication layer, or cloud file storage:

- Audio masters (`.wav`, `.mp3`, `.aiff`, `.m4a`), PRO registration PDFs (`.pdf`), and ISRC catalog spreadsheets (`.csv`, `.tsv`, `.txt`) are processed strictly in browser memory via Web File/Blob/TypedArray APIs.
- No telemetry, crash reporting, or third-party tracking scripts are loaded.
- Custom Rights Vault profiles saved during a session live only in JavaScript memory and are cleared when the browser tab closes or reloads.

For the full threat model, CDN dependency audit, DOM sanitization notes, and recommended Content-Security-Policy (CSP) headers, see [`docs/ACCESSIBILITY_AND_SECURITY.md`](docs/ACCESSIBILITY_AND_SECURITY.md).

---

## Supported Versions

| Version | Supported | Notes |
|---|---|---|
| `1.1.x` (`main`) | Yes | Active branch receiving security and hardening fixes |
| `< 1.1.0` | No | Upgrade to latest `main` |

---

## Reporting a Vulnerability

Please **do not** report security vulnerabilities (such as client-side XSS via crafted CSV/PDF files, malformed binary container handling, or supply-chain issues) through public GitHub issues.

Report vulnerabilities privately using either channel:

1. **GitHub Private Vulnerability Reporting** (preferred): open a private advisory at `https://github.com/zazieproductions/SyncTag-Pro/security/advisories/new`.
2. **Direct Email**: contact Zazie Productions LLC at `zaziediya@gmail.com` with the subject line `[SECURITY] SyncTag-Pro: <short summary>`.

### What to Include

- A concise description of the vulnerability and its potential impact
- Minimal reproduction steps or a benign proof-of-concept fixture (e.g., a crafted `.csv`, `.pdf`, `.mp3`, or `.wav` header)
- Affected browser version(s) and commit SHA
- Any suggested remediation (optional)

### Response Timeline

| Milestone | Target SLA |
|---|---|
| Initial acknowledgment | Within **72 hours** |
| Triage & severity assessment | Within **7 days** |
| Patch & coordinated disclosure | Within **14–30 days** (sooner for critical XSS/supply-chain issues) |

---

## Scope Notes

### In Scope

- Self-XSS or DOM-based XSS triggered via malicious CSV spreadsheets, PDF text streams, audio filenames, or saved profile names
- Binary corruption, integer overflow, or out-of-bounds typed-array writes in `embedMp3ID3Metadata()` or `embedWavMetadata()`
- Third-party CDN supply-chain exposure (unpinned URLs, missing Subresource Integrity)
- GitHub Actions workflow injection or privilege escalation

### Out of Scope

- Public sync licensing contact information intentionally bundled in the `Zazie Productions (BMI)` preset profile (these fields represent public rights-clearance contact metadata embedded into pitching masters by design)
- Vulnerabilities requiring physical access to an unlocked workstation or compromised browser extensions
