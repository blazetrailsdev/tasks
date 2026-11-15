---
title: "fleet/transcript downloads every session archive to find one PR's"
status: draft
updated: 2026-11-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Found while working on trailmap#141. `GET fleet/transcript` (`SessionsController#steps`) calls `SessionArchive.forPr` (`app/models/session-archive.ts:231`). That calls `this.all()`, which downloads ringo's entire `/api/sessions` list and filters it in memory. On 2026-11-15 that list was 4,789 archives. ringo ignores `?owner=&repo=&pr=`: `curl "$RINGO_BASE/api/sessions?owner=blazetrailsdev&repo=trails&pr=10137"` returns all 4,789. The Rails twin's `SessionArchive.for_pr` does the same.

Expected: one PR's archives cost one PR's bytes. Either ringo honours the filter (`ForPR` already exists in Go), or trailmap caches `all()` for a short TTL.

Acceptance:

- `fleet/transcript` for one PR does not transfer every archive (fixture test against a stand-in ringo that counts bytes or requests).
- Both apps change together.
