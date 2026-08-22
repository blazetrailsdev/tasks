---
title: "pnpm lint is red on main: redundant type assertion in postgresql-adapter.exec-query.test.ts"
status: done
updated: 2026-08-22
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 6844
claim: "2026-08-22T01:20:38Z"
assignee: "lint-red-on-main-unnecessary-type-assertion-pg-exec-query"
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #6847. `pnpm lint` is red on `main` with one error that no open
PR introduced:

```text
packages/activerecord/src/connection-adapters/postgresql-adapter.exec-query.test.ts
  390:7  error  This assertion is unnecessary since it does not change the type
                of the expression  @typescript-eslint/no-unnecessary-type-assertion
```

The site is the `as Promise<Result>` on the `insert` arrow at
`packages/activerecord/src/connection-adapters/postgresql-adapter.exec-query.test.ts:389-396`
— `execInsert` already returns that type, so the assertion is a no-op.

The file last changed in #6663 (`refactor(activerecord): converge
compute_cache_version and PG lookup_cast_type_from_column`); the assertion most
likely became redundant when `execInsert`'s declared return type was narrowed
there, and nothing has re-linted the file since. Reproduced on a tree with the
PR's own changes reverted, so it is not attributable to #6847.

CI is green, so whatever lint step CI runs is not covering this file the way the
local `pnpm lint` does — worth checking whether the CI lint scope has a hole,
since a locally-red `pnpm lint` on `main` costs every agent a false positive on
their pre-PR checklist.

## Converged shape

Drop the redundant `as Promise<Result>` at
`postgresql-adapter.exec-query.test.ts:396`. Then confirm whether CI's lint job
should have caught it, and close the scope gap if it exists.

## Acceptance criteria

- `pnpm lint` is clean on `main`.
- If CI's lint step does not cover this file, the gap is identified and either
  fixed or filed with the specific cause.
