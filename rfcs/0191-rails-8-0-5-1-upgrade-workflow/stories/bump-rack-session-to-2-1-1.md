---
title: "bump-rack-session-to-2-1-1"
status: draft
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "Dependent sources"; owner ruling 2026-11-22: dependent gems
stop at the Rails `v8.0.5.2` lock's version (dev-Gemfile-only gems included).
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves rack-session at 2.1.1; the pin in
`vendor/sources.ts` is `v2.1.0`. Target tag `v2.1.1`, commit `96663ece1596a3462704c30f98b85cd7e0337d6e`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source rack-session --ref v2.1.1`, report
`scripts/parity/bump-ledger/reports/rack-session-v2.1.0-v2.1.1.2026-11-22.json`): 2 changed files, lib +8/-2; tests 124→125 (+1); 2 drift pair rows (call-mismatches).

Fits one PR; ledger not needed (2 drift rows converge in the flip PR).

## Acceptance criteria

- [ ] Retake rack-session's pin floor against `v2.1.0` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin rack-session at `v2.1.1` (`96663ece1596a3462704c30f98b85cd7e0337d6e`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
