---
title: "bump-thor-to-1-4-0"
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
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves thor at 1.4.0; the pin in
`vendor/sources.ts` is `v1.3.2`. Target tag `v1.4.0`, commit `518ae0f49bb1c3dc2226607c07da74b591759ed0`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source thor --ref v1.4.0`, report
`scripts/parity/bump-ledger/reports/thor-v1.3.2-v1.4.0.2026-11-22.json`): 5 lib files +48/-16; tests 863→881 (+18); 0 ledger rows.

Fits one PR (18 new tests to port); no ledger.

## Acceptance criteria

- [ ] Retake thor's pin floor against `v1.3.2` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin thor at `v1.4.0` (`518ae0f49bb1c3dc2226607c07da74b591759ed0`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
