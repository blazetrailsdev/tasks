---
title: "Report a TS-private mirroring a Rails-public method as a visibility mismatch"
status: ready
updated: 2026-11-04
rfc: "0218-api-privates-extra-surface"
cluster: api-compare
packages: []
deps: [privates-surface-report]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's Design, "Matching": a TS internal name whose only Ruby match in the
mirrored `.rb` is PUBLIC is neither credited nor novel. The public lane
allows the inverse case on purpose (`scripts/api-compare/extra-surface.ts:1709-1712`).
Ruby visibility per method is in `rails-api.json` (`m.visibility`, read at
`extra-surface.ts:1821`).

## Acceptance criteria

- A `visibility` column, disjoint from `credited` / `moved` / `novel`, in the
  text table and the JSON report.
- A TS `protected` mirroring a Ruby `private` (or the reverse) is `credited`
  unless the RFC's open question is ruled otherwise before this lands.
- A name public on one Ruby entity and private on another in the same `.rb`
  is `credited` when the TS declaration's own entity is the private one
  (`entities` keying, as in `scripts/build-rails-privates-manifest.ts`'s RFC
  0121 halves), with a test.
