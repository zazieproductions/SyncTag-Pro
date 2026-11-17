# Changelog

All notable changes to **SyncTag Pro** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-11-16

### Added

- **Portfolio-Grade Documentation Suite**:
  - Complete color-coded `README.md` with Shields.io badges, structured table of contents, system architecture, full UI controls and preset/taxonomy tables, and dedicated sections for performance, accessibility (a11y), security/privacy, deployment, testing, and licensing.
  - `docs/ARCHITECTURE.md` — client-side runtime topology, reactive DOM-state model, readiness scoring formula, and subsystem boundaries.
  - `docs/BINARY_FORMAT_SPEC.md` — byte-level wire format documentation for MP3 ID3v2.3 frames (`TIT2`..`TXXX`, `COMM`) and WAV RIFF `LIST`/`INFO` chunks (`INAM`..`ICMT`), syncsafe integer math, and DAW/player compatibility notes.
  - `docs/SYNC_WORKFLOW_GUIDE.md` — music supervisor delivery playbook, BMI/ASCAP PDF regex specifications, CSV column alias mapping, and rights vault guide.
  - `docs/ACCESSIBILITY_AND_SECURITY.md` — WCAG 2.1 AA contrast and keyboard audit, zero-egress privacy boundary, CDN supply-chain assessment, and Content-Security-Policy hardening recipes.
  - `docs/DEPLOYMENT.md` — zero-build deployment guides for GitHub Pages, Cloudflare Pages, Netlify, Vercel, studio LAN, and air-gapped offline bundles.
  - Custom SVG visual assets in `docs/diagrams/` (`hero-overview.svg`, `architecture.svg`, `binary-layout.svg`, `ingestion-readiness.svg`).
  - Ready-to-import `docs/samples/sample-isrc-catalog.csv` sample catalog fixture.
- **Automated Verification & Zero-Dependency Test Suite**:
  - `tests/synctag.test.mjs` running on Node.js built-in `node:test` covering binary ID3v2.3 injection & tag stripping, WAV RIFF `LIST`/`INFO` word-aligned encoding & PCM preservation, PRO registration PDF parsing, readiness scoring, clearance memo synthesis, tap tempo detection, vault presets, SVG validity, and Markdown link integrity.
  - `scripts/check-inline-js.mjs` inline `<script>` syntax verifier and `package.json` verification scripts (`npm test`, `npm run lint:syntax`, `npm run verify`).
- **GitHub Repository & CI/CD Scaffolding**:
  - `.github/workflows/ci.yml` — automated syntax, binary encoder, and documentation integrity checks on push and pull request.
  - `.github/workflows/pages.yml` — automated zero-build GitHub Pages deployment workflow.
  - `.github/ISSUE_TEMPLATE/` (`bug_report.yml`, `feature_request.yml`, `config.yml`), `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, and `.github/dependabot.yml`.
  - Community health & project standards: `LICENSE` (MIT), `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.gitignore`, `.editorconfig`, and `.nojekyll`.

---

## [1.0.1] - 2026-11-02

### Added

- **Zazie Productions (BMI) Vault Profile** (`profile_zazie`) pre-configured with writer/publisher BMI affiliations, IPI numbers (`01280391067` / `01372389230`), 100%/100% splits, record label, website, and direct sync licensing contact ([PR #1](https://github.com/zazieproductions/SyncTag-Pro/pull/1)).
- **Record Label** (`#metaRecordLabel`) and **Website / Portfolio** (`#metaWebsite`) inputs persisted in saved Vault profiles and conditionally rendered in the generated Sync Clearance Memo.

---

## [1.0.0] - 2026-11-02

### Added

- Initial release of **SyncTag Pro** single-file browser application (`index.html`):
  - Client-side binary **ID3v2.3** tag injector for `.mp3` files (`TIT2`, `TPE1`, `TALB`, `TYER`, `TCON`, `TBPM`, `TKEY`, `TSRC`, `TPUB`, `COMM`, and `TXXX` frames for `SYNC_CONTACT`, `MOOD`, and `CLEARANCE`).
  - Client-side binary **RIFF `LIST`/`INFO`** metadata chunk injector for `.wav` files (`INAM`, `IART`, `IPRD`, `IGNR`, `ICRD`, `ICOP`, `ICMT`).
  - Drag-and-drop audio deck with HTML5 playback transport and `<canvas>` progress waveform.
  - Smart document ingestion for **BMI/ASCAP registration PDFs** (via PDF.js) and **ISRC catalog spreadsheets** (via PapaParse).
  - Pre-set **Publisher / Writer Vault** with quick-switch pills, modal selector, and custom session profile saving.
  - Dynamic writer/publisher PRO, IPI/CAE, and percentage split matrix, 5-tap BPM detector, 12 sync genre tags, 12 sync mood tags, live 100-point Sync Readiness scorer, and auto-compiled Broadcast Sync Clearance Memo.
