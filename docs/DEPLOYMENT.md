# Deployment Guide

> **SyncTag Pro** is a zero-build single-file static application (`index.html`). It requires **no server runtime, no database, no environment variables, and no build step**.

---

## 1. GitHub Pages (Included Workflow — Recommended)

This repository ships with a ready-to-run workflow at [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) that verifies inline syntax + automated binary tests, stages a minimal `_site/` bundle (`index.html` + `.nojekyll`), and deploys to GitHub Pages whenever `index.html` changes on `main`.

### One-Time Repository Activation

1. Open **Settings → Pages** in `zazieproductions/SyncTag-Pro`.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Deploy to GitHub Pages → Run workflow** (or push to `main`).
4. Your live app publishes at:
   ```text
   https://zazieproductions.github.io/SyncTag-Pro/
   ```
5. *(Optional)* Configure a custom subdomain such as `synctag.zazieproductions.com` under **Settings → Pages → Custom domain** with a DNS `CNAME` pointing to `zazieproductions.github.io` and check **Enforce HTTPS**.

---

## 2. Cloudflare Pages / Netlify / Vercel

Because there is no compilation step, all major edge hosts deploy straight from Git:

| Platform | Build Command | Publish / Output Directory | Notes |
|---|---|---|---|
| **Cloudflare Pages** | *(leave blank)* | `/` | Add a `_headers` file to apply `connect-src 'none'` CSP (see [`ACCESSIBILITY_AND_SECURITY.md`](ACCESSIBILITY_AND_SECURITY.md)) |
| **Netlify** | *(leave blank)* | `.` | Supports drag-and-drop deploy or Git integration + custom TLS |
| **Vercel** | *(leave blank)* | `.` | Framework Preset: **Other** |
| **AWS S3 + CloudFront** | None | Upload `index.html` only | Set `Cache-Control: public, max-age=300` on `index.html` |

---

## 3. Local Studio Workstation & LAN Hosting

Running over `http://127.0.0.1` ensures consistent Web Worker loading for PDF.js across all browsers (including strict `file://` origin policies in Safari and Chromium):

```bash
# Option A — npm script (Python 3 stdlib HTTP server on 127.0.0.1:8080)
npm run serve

# Option B — Python 3 directly on a custom port
python3 -m http.server 4173 --bind 127.0.0.1

# Option C — Share across a trusted studio LAN (e.g., scoring room <-> mix room)
python3 -m http.server 8080 --bind 0.0.0.0
```

> **Direct `file://` Opening:** Double-clicking `index.html` works for audio auditioning, CSV catalog matching, Vault switching, and MP3/WAV binary export, provided the workstation has internet access to load the four CDN scripts on initial boot.

---

## 4. Self-Hosted Nginx Container / Reverse Proxy

Minimal hardened Nginx configuration with browser-enforced zero-egress CSP:

```nginx
server {
    listen 443 ssl http2;
    server_name synctag.zazieproductions.com;

    root /var/www/synctag-pro;
    index index.html;

    add_header Content-Security-Policy "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://unpkg.com; worker-src blob: https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; media-src blob:; img-src 'self' data: blob:; connect-src 'none'; form-action 'none'; frame-ancestors 'none';" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Air-Gapped / Offline Scoring Rig Deployment

Film and trailer scoring studios often operate offline mix rigs with no internet connectivity. To convert SyncTag Pro into a 100% offline studio utility:

1. **Compile Tailwind CSS statically** once on an online machine:
   ```bash
   npx tailwindcss -i input.css -o vendor/tailwind.min.css --content index.html --minify
   ```
2. **Vendor the three helper libraries** into `vendor/`:
   - `vendor/pdf.min.js` & `vendor/pdf.worker.min.js` (`pdfjs-dist@3.11.174`)
   - `vendor/papaparse.min.js` (`papaparse@5.4.1`)
   - `vendor/lucide.min.js` (`lucide@0.460.0`)
3. **Point `<head>` tags and `pdfjsLib.GlobalWorkerOptions.workerSrc`** to `./vendor/...` and tighten CSP to `script-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'none'`.

With local vendor assets, the entire studio workstation operates with zero external DNS or HTTPS requests even at boot time.
