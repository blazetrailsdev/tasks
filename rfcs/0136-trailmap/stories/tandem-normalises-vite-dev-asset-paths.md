---
title: "script/tandem normalises trails' /vite-dev/assets script paths"
status: done
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trailmap#206
claim: "2026-11-27T03:14:41Z"
assignee: "ci-runs-hub-migrations-through-db-migrate"
blocked-by: null
closed-reason: null
---

## Context

`rails/script/tandem` normalises asset URLs through `INTENDED` (rails/script/tandem:57-60),
but only under `/assets/`. A trails server in development serves page scripts from
config/vite.json's `publicOutputDir`, `/vite-dev/assets/<name>-<hash>.js`
(`/vite-test/` under test). Run against `bin/trails server` in development, as
trailmap#194 did, tandem reports DIFF on every page with a page script
(/rfcs, /dashboard, /audits, /deploys, /panes/42, /graphs/parity) with
`<script src="/vite-dev/assets/deploys.js">` vs `<script src="/assets/deploys.js">`
as the whole difference.

## Acceptance criteria

- `INTENDED` maps `/vite-(dev|test)/assets/<name>(-hash)?.<ext>` onto `/assets/<name>.<ext>`,
  as it already does for propshaft's fingerprint.
- tandem against a development trails server and a development Rails server reports
  SAME on those six paths.
