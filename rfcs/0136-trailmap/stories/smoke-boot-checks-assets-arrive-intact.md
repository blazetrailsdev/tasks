---
title: "trailmap: the smoke boot accepts a corrupted asset as long as it answers 200"
status: in-progress
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#38
claim: "2026-10-05T20:14:43Z"
assignee: "smoke-boot-checks-assets-arrive-intact"
blocked-by: null
closed-reason: null
---

## Context

`scripts/smoke-boot.sh` fetches every asset `/rfcs` links and checks for a 200. The live site
answered 200 for `application.css` and `fleet-format.js` while serving both corrupted and cut short
(trails story `static-files-with-non-ascii-bytes-are-served-corrupted-and-truncated`), so the smoke
boot passed over a fleet page whose script did not parse. `/rfcs` also links no script, so the
dashboard's two were never fetched at all.

## Acceptance criteria

- [ ] The smoke boot compares each served asset byte for byte with the file under `public/assets`, and fails on a difference.
- [ ] It covers the assets `/dashboard` links as well as `/rfcs`.
- [ ] It fails on current `main` until the trails fix is vendored, or the assets are ASCII; say which in the PR.
