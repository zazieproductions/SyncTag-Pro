## Summary

<!-- Describe what this PR changes and why. Link any related issue (e.g., Closes #12). -->

## Type of Change

- [ ] `feat` — New metadata frame/chunk, ingestion parser, or workflow capability
- [ ] `fix` — Bug fix in binary tagging, readiness scoring, parser, or UI
- [ ] `a11y` — Accessibility improvement (keyboard, focus, ARIA, contrast)
- [ ] `sec` — Security or privacy hardening (DOM sanitization, SRI, CSP)
- [ ] `perf` — Memory or export throughput optimization
- [ ] `docs` — README, technical specifications, or diagrams
- [ ] `test` / `ci` — Automated tests or GitHub Actions scaffolding

## Verification Checklist

- [ ] `npm run verify` (`lint:syntax` + `node --test`) passes locally with zero failures
- [ ] Zero network egress introduced — audio, PDF, and CSV files remain 100% in browser memory
- [ ] Binary audio integrity preserved (if touching `embedMp3ID3Metadata` or `embedWavMetadata`, verified with `ffprobe` / `exiftool` / DAW)
- [ ] Accessibility checked (keyboard operability, focus visibility, ≥ 4.5:1 contrast)
- [ ] Relevant documentation updated (`README.md`, `docs/`, `CHANGELOG.md`)

## Manual QA Notes

<!-- Optional: list browsers, sample audio formats (.mp3 / .wav), or DAWs/players verified. -->
