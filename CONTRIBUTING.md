# Contributing to SyncTag Pro

Thank you for your interest in contributing to **SyncTag Pro** — Zazie Productions LLC's zero-backend sync licensing audio metadata engine and rights vault.

---

## Core Design Principles

Every contribution should preserve the four invariants that make SyncTag Pro reliable for composers, sync agents, and music supervisors:

1. **Zero-Egress Privacy** — Audio masters, PRO registration PDFs, and ISRC spreadsheets must never leave the user's browser. Never introduce telemetry, analytics beacons, or server uploads.
2. **Bit-Exact Audio Integrity** — Metadata injection must never transcode, truncate, or alter raw MPEG audio frames or uncompressed WAV PCM sample chunks.
3. **Zero-Build Portability** — `index.html` must work out of the box from any static host or `localhost` HTTP server without requiring a bundler step.
4. **Music Supervisor Clarity** — Every embedded field and clearance memo line should be immediately readable in industry tools (DISCO, iTunes/Apple Music, Pro Tools, Logic Pro, Reaper, Adobe Premiere, `ffprobe`, and `exiftool`).

---

## Development Setup

### Prerequisites

- **Node.js ≥ 20** (used exclusively for running the zero-dependency verification suite — no `npm install` required)
- **Python 3** (or any static HTTP server for local browser preview)
- A modern evergreen browser (Chrome/Edge 110+, Firefox 115+, or Safari 16.4+)

### Local Workflow

```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/SyncTag-Pro.git
cd SyncTag-Pro

# 2. Start a local preview server
npm run serve
# Open http://127.0.0.1:8080

# 3. Run inline JS syntax validation + automated test suite
npm run verify
```

---

## Making Changes

1. Create a descriptive feature or fix branch (`feat/bwf-bext-chunk`, `fix/a11y-modal-focus`, `docs/daw-matrix`).
2. Keep `index.html` formatted cleanly (4-space indentation; see `.editorconfig`).
3. If modifying binary tag encoders (`embedMp3ID3Metadata` or `embedWavMetadata`):
   - Add byte-level regression tests in `tests/synctag.test.mjs`.
   - Update wire-format documentation in `docs/BINARY_FORMAT_SPEC.md`.
   - Verify exported `.mp3` and `.wav` files in at least one external inspector (`ffprobe`, `exiftool`, or a DAW).
4. If adding or modifying UI controls, Vault profiles, or taxonomy tags:
   - Use safe DOM APIs (`textContent`, `createElement`) rather than unescaped `innerHTML` for untrusted file/user input.
   - Maintain WCAG 2.1 AA contrast (≥ 4.5:1 for normal text) and full keyboard operability.
   - Update the corresponding control or preset table in `README.md`.
5. Run `npm run verify` and confirm 0 failures before opening a pull request.

---

## Commit & Pull Request Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use Case |
|---|---|
| `feat:` | New metadata frame/chunk support, ingestion parser, or UI capability |
| `fix:` | Bug fix in binary encoding, readiness scoring, parsing, or UI |
| `a11y:` | Accessibility improvements (ARIA, focus traps, contrast, keyboard) |
| `sec:` | Security hardening (CSP, SRI, DOM sanitization) |
| `perf:` | Memory or streaming optimizations (e.g., zero-copy `Blob` composition) |
| `docs:` | README, technical specifications, diagrams, or workflow guides |
| `test:` | Automated tests and binary verification fixtures |
| `ci:` | GitHub Actions workflows and repository automation |

Update `CHANGELOG.md` under an `[Unreleased]` section for user-visible changes and complete the checklist in `.github/PULL_REQUEST_TEMPLATE.md`.

---

## Security & Code of Conduct

- Please report security vulnerabilities privately per [SECURITY.md](SECURITY.md) — do not open public issues for exploitable bugs.
- Participation in this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).
- By submitting a contribution, you agree that your work will be licensed under the project's [MIT License](LICENSE).
