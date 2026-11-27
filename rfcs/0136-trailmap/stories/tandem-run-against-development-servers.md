---
title: "Run tandem against development trails and Rails servers and clear the remaining DIFFs"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#206 added `/vite-(dev|test)/assets/` to `INTENDED` in `rails/script/tandem`. It was unit-checked with one `gsub` and never run against live servers. The story's second acceptance criterion was never demonstrated: tandem against a development `bin/trails server` and a development `bin/rails server` reports SAME on /rfcs, /dashboard, /audits, /deploys, /panes/42 and /graphs/parity.

## Acceptance criteria

- Run tandem against both development servers over one database, and record the output in the PR.
- Every remaining DIFF is either fixed in the app at fault or added to `INTENDED` with its reason.
