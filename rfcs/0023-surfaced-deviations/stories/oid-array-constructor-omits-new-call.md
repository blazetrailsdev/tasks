---
title: "OID::Array constructor omits Rails' new call — reds parity:api:calls on main"
status: draft
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:calls` is **red on `origin/main`** with one new row:

```text
+ activerecord  connection-adapters/postgresql/oid/array.ts  initialize  new
  (activerecord/connection-adapters/postgresql/oid/array.json)
```

`OID::Array#initialize` in Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb`)
makes a `new` call that the trails constructor
(`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`,
`class Array`, `constructor`) omits — the call-set gate reports it as
`new → constructor` missing.

Introduced by **#6633** ("refactor(activerecord): kernelArray in batches,
OID::Array encoder/decoder pair, PG explain pp(result)"), commit `8c38499be`,
which added the encoder/decoder pair. The gate is only-shrink, so this reds
`Rails API/Test Comparison` on **every** open PR until it is converged —
including PRs that touch no activerecord file at all.

Surfaced from PR #6647 (activemodel `validations_test` parity), which touches
zero activerecord files and therefore cannot and should not baseline it.

## Acceptance criteria

- `OID::Array`'s constructor makes the `new` call Rails' `initialize` makes, so
  the row disappears from `call-mismatches.json` without a baseline entry.
- `pnpm parity:api:calls` is green on `main` again.
- No row is added to `call-mismatches-exclude/` for this — the fix is to make the
  call, not to record the omission. If it genuinely cannot be made, the row needs
  a reviewed one-line `reason`, not a seed placeholder.
- If a stale high-water mark results, narrow it with
  `pnpm parity:api:calls:tighten activerecord/connection-adapters/postgresql/oid/array.json`
  — never `--write` / reseed.
