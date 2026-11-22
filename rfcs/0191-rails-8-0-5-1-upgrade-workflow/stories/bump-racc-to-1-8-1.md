---
title: "bump-racc-to-1-8-1"
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
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves racc at 1.8.1; the pin in
`vendor/sources.ts` is `v1.8.0`. Target tag `v1.8.1`, commit `5229883dca5b451c8bfd322272ccd2ca6d526695`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source racc --ref v1.8.1`, report
`scripts/parity/bump-ledger/reports/racc-v1.8.0-v1.8.1.2026-11-22.json`): 8 files +27/-27; tests 63→67 (+4); 0 ledger rows.

Fits one PR; no ledger.

## Acceptance criteria

- [ ] Retake racc's pin floor against `v1.8.0` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin racc at `v1.8.1` (`5229883dca5b451c8bfd322272ccd2ca6d526695`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
