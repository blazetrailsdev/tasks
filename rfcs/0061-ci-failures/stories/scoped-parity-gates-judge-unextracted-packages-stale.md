---
title: "scoped-parity-gates-judge-unextracted-packages-stale"
status: done
updated: 2026-11-24
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10661
claim: "2026-11-24T02:43:52Z"
assignee: "scoped-parity-gates-judge-unextracted-packages-stale"
blocked-by: null
closed-reason: null
---

## Context

The "Rails API/Test Comparison (scoped)" job runs the parity gates over only the PR's changed
packages, yet its param-name and body-pin gates still judge ledger/pin rows for packages it never
extracted. On trails#10661 (a thor test-only diff; runs 45249507537 job 137955484782 and 45268118907
job 138020844227) it reported:

- `param-name gate: 1 STALE signature ledger row(s)` — `activerecord tasks/database_tasks.rb:schema_up_to_date?`
  (`scripts/parity/bump-ledger/rails.json`). The row is NOT stale: deleting it reds the full
  "Rails API/Test Comparison" job (run 45265420170 job 138011504625: `activerecord tasks/database_tasks.rb: mark 0 → current 1`),
  since Rails `schema_up_to_date?(configuration, _ = nil, file = nil)`
  (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/tasks/database_tasks.rb:398`) still differs
  from `packages/activerecord/lib/tasks/database-tasks.ts:777` `(configuration, format, file)`.
- `body-pins gate: 1 STALE pin(s)` — `thor actions.rb:initialize`, untouched by the PR; the same gate
  passes locally under `pnpm parity:changed` after a fresh build.

Gates: `scripts/api-compare/lint-param-names.ts`, `scripts/api-compare/lint-body-pins.ts`.

## Acceptance criteria

- [ ] Under `--package <pkg>` scoping, the stale arm of both gates judges only rows whose package was extracted.
- [ ] Scoped CI on a thor-only diff reports neither row; the full job keeps both.
