---
title: "bump-pg-to-1-6-2"
status: draft
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
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "Dependent sources"; owner ruling 2026-11-22: dependent gems
stop at the Rails `v8.0.5.2` lock's version (dev-Gemfile-only gems included).
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves pg at 1.6.2; the pin in
`vendor/sources.ts` is `v1.5.9`. Target tag `v1.6.2`, commit `c75ed8da19c356b52d83da2627295760780d3d36`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source pg --ref v1.6.2`, report
`scripts/parity/bump-ledger/reports/pg-v1.5.9-v1.6.2.2026-11-22.json`): 6 lib files +322/-139; tests 741→799 (+66/-8, 3 changed, 16 moved); 1 unattributed call-arg row (connection.ts cancel).

Largest; needs a ledger or a split by test file.

## Acceptance criteria

- [ ] Retake pg's pin floor against `v1.5.9` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin pg at `v1.6.2` (`c75ed8da19c356b52d83da2627295760780d3d36`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
