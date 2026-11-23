---
title: "bump-mini-magick-to-5-3-1"
status: in-progress
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps:
  - flip-the-rails-ref-to-v8-0-5-1
deps-rfc: []
est-loc: null
priority: null
pr: trails#10611
claim: "2026-11-22T22:54:09Z"
assignee: "bump-mini-magick-to-5-3-1"
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "Dependent sources"; owner ruling 2026-11-22: dependent gems
stop at the Rails `v8.0.5.2` lock's version (dev-Gemfile-only gems included).
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves mini_magick at 5.3.1; the pin in
`vendor/sources.ts` is `v5.2.0`. Target tag `v5.3.1`, commit `ddcbfe9632667876be10373e1e01252617e74057`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source mini_magick --ref v5.3.1`, report
`scripts/parity/bump-ledger/reports/mini_magick-v5.2.0-v5.3.1.2026-11-22.json`): 3 lib files +9/-9; tests 145→146 (+1, 1 changed); 0 ledger rows.

Fits one PR; no ledger.

## Acceptance criteria

- [ ] Retake mini_magick's pin floor against `v5.2.0` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin mini_magick at `v5.3.1` (`ddcbfe9632667876be10373e1e01252617e74057`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
