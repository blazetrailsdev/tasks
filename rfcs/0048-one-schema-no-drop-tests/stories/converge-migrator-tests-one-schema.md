---
title: "Reset migrator/internal-metadata state per Rails so migrator + migrator.trails pass under one-schema"
status: in-progress
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: 4428
claim: "2026-07-02T18:21:51Z"
assignee: "converge-migrator-tests-one-schema"
blocked-by: null
closed-reason: null
---

## Context

> **⚠️ HOW TO WORK THIS — read before blocking (2026-07-02).** This is live
> one-schema burndown work, executed on branch **`existing-db-schema-rc-9807c5`**
> — check that branch out before doing anything or judging feasibility.
>
> - The one-schema harness (`AR_ONE_SCHEMA`, `eslint/one-schema-exclude.json`,
>   `test-helpers/one-schema.ts`, the `define-schema.ts` no-op/`force` path) is
>   **committed on that branch, NOT on `main`.** Do not conclude "infra absent"
>   from a `main` checkout.
> - **Spike PR #4246 is ABANDONED and will NOT be merged.** Do NOT block on it or
>   wait for it — "re-open once #4246 merges" is wrong. The infra was landed
>   directly on the branch instead. Any prior blocked-by note saying otherwise is
>   superseded.
> - The RFC 0048 README's "one-schema mode is out of scope → RFC 0049" note is
>   **superseded** for this burndown; it is being executed here, on the branch.
> - The named tests **fail under the flag** even though they pass flag-off.
>   Reproduce on the branch: remove this file's path from
>   `eslint/one-schema-exclude.json`, then `AR_ONE_SCHEMA=1 pnpm vitest run <file>`.
>   Fix until green and leave the path removed from the exclude in your PR.

`migrator.test.ts` and `migrator.trails.test.ts` fail under one-schema
(`AR_ONE_SCHEMA=1`) because they depend on migration bookkeeping state
(`schema_migrations`, internal metadata / environment) that the truncate-only
reset and shared canonical schema do not restore the way per-test drop/recreate
did. Verified 2026-07-01 by probing under the flag with an emptied exclude:

- `migrator.test.ts` — `AssertionError: expected [{ status: 'up' }, ...] to
deeply equal [{ status: 'down' }, ...]` (migration up/down state leaks/persists
  across tests under truncate-reset).
- `migrator.trails.test.ts:57-59` — `checkEnvironment` expected to raise
  `NoEnvironmentInSchemaError` but environment row survives the truncate reset.

Port to reset migrator/internal-metadata state per-test the way Rails' migrator
tests do (clear `schema_migrations` / internal metadata in setup), rather than
relying on table drops. Read Rails `activerecord/test/cases/migrator_test.rb` and
the internal-metadata tests first.

## Acceptance criteria

- `migrator.test.ts` and `migrator.trails.test.ts` pass under one-schema and are
  removed from `eslint/one-schema-exclude.json`.
- Migrator/internal-metadata reset mirrors Rails (no reliance on DROP TABLE).
- No test renames.
