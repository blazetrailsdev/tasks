---
title: "trailmap: one-time import of the audits directory and ringo's refine reports"
status: ready
updated: 2026-11-20
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: import
packages: []
deps:
  [audits-create-endpoint-on-the-loopback-api, refinement-is-a-base-record-with-an-attached-summary]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap (`scripts/`), run once on the box.

## Context

The sources:

- `~/.btwhooks/data/github/<owner>/<repo>/audits/*.{md,html}`. Today only
  `blazetrailsdev/trails` exists: 88 `.md` files and 2.0 MB. The name shape
  is `<slug>-<YYYYMMDDTHHMMSSZ>.<ext>` (`TS_SUFFIX_RE`, trailmap
  `app/models/audit.ts:11`). Names without a stamp fall back to the mtime.
- `~/.btwhooks/data/refine-history.json`: 93 RFCs and 258 reports, as
  `{when, outcome, summary, stories?}` (btwebooks `webhook/spawnloop.go:209-219`).
- `~/.btwhooks/data/refines.json`: 128 RFCs, latest only. 35 of them are
  absent from the history.

The import drives the two loopback endpoints with the original times, so it
needs no second write path and no mount of ringo's data dir.

## Acceptance criteria

- [ ] `scripts/import-reports.ts` (or similar) POSTs every audit file
      (`repo` from the directory, `slug` / `writtenAt` / `format` from the
      name) and every report in history ∪ refines.json (deduplicated on
      `(rfc, when)`).
- [ ] A re-run creates nothing (the endpoints' idempotency on
      `(repo, slug, writtenAt)` and `(rfc_id, created_at)`). A test runs it
      twice over a fixture directory.
- [ ] The run's counts are recorded in the PR: 88 audits and 293 refinements
      against today's data (RFC Verification).
- [ ] The import is run on production and its output pasted into the PR.
