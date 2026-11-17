# Accessibility (a11y) & Security / Privacy Reference

> **Scope:** WCAG 2.1 Level AA audit, color-contrast measurements, keyboard/assistive-technology status, zero-egress privacy architecture, threat model, and production HTTP security header guidelines.

---

## Part I — Accessibility (WCAG 2.1 AA)

### 1. Studio Color Palette Contrast Matrix

SyncTag Pro uses a fixed high-contrast dark-studio theme (`class="dark"`) calibrated to reduce eye fatigue during long studio bouncing and cataloging sessions:

| UI Element | Foreground | Surface Background | Contrast Ratio | WCAG 2.1 Result |
|---|---|---|---|---|
| Primary headings & input values | `#FFFFFF` / `#F1F5F9` (`slate-100`) | `#111319` (`studio-900`) | **17.4 : 1 – 18.6 : 1** | **AAA** (≥ 7:1) |
| Section labels (`text-slate-300`) | `#CBD5E1` | `#171A23` (`studio-850`) | **11.5 : 1** | **AAA** (≥ 7:1) |
| Helper copy (`text-slate-400`) | `#94A3B8` | `#171A23` (`studio-850`) | **6.1 : 1** | **AA** (≥ 4.5:1) |
| Emerald ISRC & Ready badge (`emerald-400`) | `#4ADE80` | `#111319` (`studio-900`) | **10.6 : 1** | **AAA** (≥ 7:1) |
| Clearance/Email text (`emerald-300`) | `#6EE7B7` | `#111319` (`studio-900`) | **12.4 : 1** | **AAA** (≥ 7:1) |
| IPI & Active Profile (`indigo-300`) | `#A5B4FC` | `#111319` (`studio-900`) | **9.3 : 1** | **AAA** (≥ 7:1) |
| Incomplete readiness pill (`amber-400`) | `#FBBF24` | `#171A23` (`studio-850`) | **10.3 : 1** | **AAA** (≥ 7:1) |
| Muted micro-hints (`text-slate-500`) | `#64748B` | `#111319` (`studio-900`) | **3.5 : 1** | Large/decorative only (upgrade to `slate-400` for AA small text) |

### 2. Current Accessibility Strengths

- **Document Language & Responsive Scaling:** Declares `<html lang="en">` and `<meta name="viewport" content="width=device-width, initial-scale=1.0">` without restricting user pinch-to-zoom (`maximum-scale` / `user-scalable` unrestricted); 12-column grid reflows cleanly to a single column below `1024px` (`lg:`) and `768px` (`md:`).
- **Native Interactive Controls:** Metadata inputs, selects, textarea, genre/mood pill toggles (`<button type="button">`), Vault pills (`<button>`), and PDF/CSV upload labels (`<label>` wrapping `<input type="file">`) use native focusable HTML elements.
- **Non-Color Status Redundancy:** Sync Readiness badges always pair color (Emerald / Indigo / Amber) with explicit numeric percentages and descriptive text (`100% Sync Ready`, `65% Adequate`, `45% Missing Key Data`).
- **Low Motion Footprint:** Zero auto-playing animations or flashing elements; CSS transitions are limited to subtle 200–300 ms hover/toast transitions and a spinner icon during export.

### 3. Known a11y Gaps & WCAG 2.1 AA Remediation Roadmap

In the spirit of transparent engineering documentation, these items are tracked for upcoming accessibility hardening commits:

| Priority | WCAG Criterion | Current Behavior | Planned Fix |
|---|---|---|---|
| **P1** | `2.4.7 Focus Visible` | Custom CSS sets `outline: none; border-color: #6366f1` on inputs; buttons rely on browser/Tailwind defaults | Add high-visibility `:focus-visible` ring (`2px solid #818cf8`, `outline-offset: 2px`) across all buttons, dropzones, and pills |
| **P1** | `1.3.1 Info & Relationships` / `4.1.2 Name, Role, Value` | Visual `<label>` elements sit adjacent to inputs without explicit `for="..."` bindings; icon-only transport/delete buttons lack `aria-label`; genre/mood toggle buttons lack `aria-pressed` | Bind every `<label for="meta...">`, add `aria-label` to Play/Stop/Delete/Close buttons, and maintain `aria-pressed="true\|false"` on taxonomy pills |
| **P1** | `2.1.1 Keyboard` | `#audioDropzone` and CSV match cards are `<div>` elements bound via `click` handlers | Add `role="button"`, `tabindex="0"`, and `Enter`/`Space` keydown handlers (or convert to `<button>`) |
| **P2** | `2.4.3 Focus Order` | `#profileModal` toggles visibility cleanly but lacks `role="dialog"`, `aria-modal="true"`, focus trap, and `Escape` dismissal | Implement modal focus trapping, `Escape` handler, and trigger focus restoration |
| **P2** | `4.1.3 Status Messages` | `#toastNotification`, `#parseStatusBox`, and `#syncScoreBadge` update visually without live-region announcements | Add `role="status"` and `aria-live="polite"` (`aria-atomic="true"` on badge/toast) |
| **P3** | `2.3.3 Animation from Interactions` | Toast slide and tag pill transitions run unconditionally | Respect `@media (prefers-reduced-motion: reduce)` |

---

## Part II — Security & Privacy Architecture

### 1. Data Privacy Boundary

SyncTag Pro implements a **strict local-only data flow**:

| Asset Type | Read Mechanism | Network Egress | Persistence | Disposal |
|---|---|---|---|---|
| **Master Audio (`.wav`, `.mp3`)** | `FileReader.readAsArrayBuffer()` + `URL.createObjectURL()` | **None (0 bytes)** | Tab RAM only | Export Blob URL revoked immediately via `URL.revokeObjectURL()`; source buffer freed on reload/tab close |
| **PRO Registration PDF** | `file.arrayBuffer()` → PDF.js in-browser worker | **None (0 bytes)** | Tab RAM only | Garbage-collected immediately after `parseProRegistrationText()` completes |
| **ISRC Catalog CSV/TSV** | `Papa.parse(file)` (`FileReader`) | **None (0 bytes)** | `parsedSpreadsheetCatalog` in Tab RAM | Cleared on reload/tab close |
| **Custom Vault Profiles** | `saveCurrentAsProfile()` | **None (0 bytes)** | `syncProfiles[]` in Tab RAM | Cleared on reload/tab close (nothing written to `localStorage`, `IndexedDB`, or cookies) |
| **Analytics / Telemetry** | None | **None** | None | Zero tracking scripts, pixels, or error-reporting SDKs |

### 2. Threat Model & Surface Analysis

| Vector | Risk Level | Current Posture | Hardening Guidance |
|---|---|---|---|
| **Unreleased Audio Leakage** | Mitigated | Zero `fetch()`, `XMLHttpRequest`, `WebSocket`, or `<form action>` calls exist in the codebase | Verify anytime in browser DevTools → Network tab (0 outbound requests after page load) |
| **Third-Party CDN Supply Chain** | Medium | Loads Tailwind Play CDN, PDF.js `3.11.174` (pinned), PapaParse `5.4.1` (pinned), and Lucide `@latest` (unpinned) over HTTPS | Pin Lucide to an exact semver version, attach `integrity="sha384-..."` + `crossorigin="anonymous"` SRI hashes, or vendor all 4 assets locally for air-gapped studio deployments (see [`DEPLOYMENT.md`](DEPLOYMENT.md)) |
| **Untrusted CSV / Vault Self-XSS** | Low–Medium | `logStatus()`, `showToast()`, and `#metaComments` safely use `.textContent` / `.value`; `displayCatalogMatches()`, `addWriterRow()`, and `openProfileModal()` interpolate row/profile strings into `innerHTML` | Only import CSV catalogs from trusted sources (your own studio, distributor, or DISCO exports); replace string template `innerHTML` with `textContent` / `createElement` when hardening for multi-tenant use |
| **Binary Container Corruption** | Low | MP3 strips old ID3 via syncsafe math; WAV verifies `"RIFF"` magic before mutating and never modifies PCM sample bytes; source file on disk is never overwritten (exports a new `(Sync Ready)` copy) | Always keep original master bounces archived; inspect final deliverables with `ffprobe` for files approaching the 4 GiB RIFF 32-bit ceiling |
| **Filename Path Traversal** | Mitigated | Output filename runs `.replace(/[/\\?%*:|"<>]/g, '_')` and passes through browser `<a download>` sandboxing | Browser enforces download directory isolation automatically |
| **Public Preset Contact Exposure** | Informational | Built-in `Zazie Productions (BMI)` preset contains public sync-licensing contact & BMI IPI records intended for placement clearance memos | When forking SyncTag Pro for your own catalog, replace `syncProfiles` entries with your designated business licensing inbox/line rather than private personal details |

### 3. Recommended Production HTTP Security Headers

When serving `index.html` behind Cloudflare Pages, Netlify, Vercel, Nginx, or Caddy, apply these baseline response headers:

```http
Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://unpkg.com; worker-src blob: https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; media-src blob:; img-src 'self' data: blob:; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
```

Notice `connect-src 'none'` and `form-action 'none'`: the browser kernel itself cryptographically enforces that SyncTag Pro **cannot** make outbound `fetch`/`XHR`/`WebSocket` requests or submit form data anywhere once loaded.

---

## Reporting Security Issues

See [`SECURITY.md`](../SECURITY.md) for responsible disclosure channels and response SLAs.
