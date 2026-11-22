---
title: "bump-sqlite3-to-2-7-3"
status: claimed
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps:
  - flip-the-rails-ref-to-v8-0-5-1
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-22T22:54:09Z"
assignee: "bump-mini-magick-to-5-3-1"
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "Dependent sources"; owner ruling 2026-11-22: dependent gems
stop at the Rails `v8.0.5.2` lock's version (dev-Gemfile-only gems included).
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves sqlite3 at 2.7.3; the pin in
`vendor/sources.ts` is `v2.6.0`. Target tag `v2.7.3`, commit `0cfccfc91c93afb11769dc7b830cb5d7ae2addcc`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source sqlite3 --ref v2.7.3`, report
`scripts/parity/bump-ledger/reports/sqlite3-v2.6.0-v2.7.3.2026-11-22.json`): 3 lib files +66/-16; tests 328→331 (+4/-1); 5 drift pair rows.

Fits one PR; 5 drift rows converge in it.

## Acceptance criteria

- [ ] Retake sqlite3's pin floor against `v2.6.0` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin sqlite3 at `v2.7.3` (`0cfccfc91c93afb11769dc7b830cb5d7ae2addcc`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
