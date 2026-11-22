---
title: "bump-solid-cable-to-3-0-12"
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
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves solid_cable at 3.0.12; the pin in
`vendor/sources.ts` is `v3.0.7`. Target tag `v3.0.12`, commit `c6c10aa8aea136e849e9e80fc8af47e5bf39409e`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source solid_cable --ref v3.0.12`, report
`scripts/parity/bump-ledger/reports/solid_cable-v3.0.7-v3.0.12.2026-11-22.json`): 1 lib file +1/-1; tests 21→23 (+2); 0 ledger rows.

Fits one PR; no ledger.

## Acceptance criteria

- [ ] Retake solid_cable's pin floor against `v3.0.7` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin solid_cable at `v3.0.12` (`c6c10aa8aea136e849e9e80fc8af47e5bf39409e`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
