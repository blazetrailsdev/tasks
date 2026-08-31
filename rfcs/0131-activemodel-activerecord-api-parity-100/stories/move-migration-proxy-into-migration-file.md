---
title: "Move MigrationProxy out of deprecator.ts into migration.ts, the file Rails defines it in"
status: draft
updated: 2026-08-31
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps:
  - "port-gem-version-files"
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`migration.rb` sits at 97/103; all six misses are `MigrationProxy` —
`filename`, `filename=`, `scope`, `scope=`, `basename`, `load_migration`.

Rails defines it inline in `migration.rb`:
`vendor/rails/activerecord/lib/active_record/migration.rb:1177` is
`MigrationProxy = Struct.new(:name, :version, :filename, :scope) do … end`,
with `basename` at `:1183`, the `delegate` at `:1187` and the private
`load_migration` at `:1194`. The Struct members are what produce the
`filename` / `filename=` / `scope` / `scope=` readers and writers.

trails has the class — `packages/activerecord/src/deprecator.ts:25` — and a
bodyless `interface MigrationProxy` in the file that mirrors Rails
(`packages/activerecord/src/migration.ts:1401`), which is why all six score
declaration-only. `deprecator.ts` mirrors
`active_record/deprecator.rb`, which defines a deprecator and nothing else, so
the class is in a file whose Rails counterpart does not contain it.

The same file also holds `gemVersion`, moved out by `port-gem-version-files`;
these two stories touch `deprecator.ts` from opposite ends, so take
`port-gem-version-files` first.

Bucket B, a move: the behavior ships and is tested.

## Acceptance criteria

- `class MigrationProxy` moves from `deprecator.ts` into `migration.ts`, at the
  position Rails puts it in (`rails-file-structure-method-order` is not yet
  enforced for activerecord, but the order is still the target), and the
  bodyless interface at `:1401` is deleted rather than kept alongside.
- `filename`, `scope`, `basename` and `loadMigration` are real members of that
  class; `loadMigration` is private in Rails and carries `@internal`.
- activerecord `migration.rb` reaches **103/103**; package total rises by 6.
- Every existing importer of `MigrationProxy` still resolves, and the migrator
  tests pass unchanged.
- `pnpm parity:api:calls`, `:calls:args`, `:params` clean; no new baseline row.

## Definition of done

Keeping the class in `deprecator.ts` and re-exporting it from `migration.ts` does not close this story — the extractor attributes a member to where it is declared.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm vitest run packages/activerecord/src/migrator.trails.test.ts
```

Every importer of `MigrationProxy` must still resolve; `pnpm typecheck` is the
cheap check for that.
