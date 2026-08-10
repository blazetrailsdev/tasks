---
title: "migration-context-collaborator-readers-cast-away-the-null-object"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6281
claim: "2026-08-09T15:39:33Z"
assignee: "migration-context-collaborator-readers-cast-away-the-null-object"
blocked-by: null
closed-reason: null
---

## Context

Shipped deviation from `migration-context-defaults-collaborators-in-the-constructor`
(PR #6272), signed off by the maintainer there and tracked here so it stays on
the ledger rather than settling.

`MigrationContext`'s readers are declared as the real collaborators
(`packages/activerecord/src/migration.ts`, `readonly schemaMigration:
SchemaMigration` / `readonly internalMetadata: InternalMetadata`) while the
constructor accepts the null objects Rails' `Migration.copy` seats
(`vendor/rails/activerecord/lib/active_record/migration.rb:1065-1066`:
`SchemaMigration::NullSchemaMigration.new` / `InternalMetadata::NullInternalMetadata.new`,
defined empty at `schema_migration.rb:9` and `internal_metadata.rb:13`) and
force-casts that branch with `as`.

Rails' `attr_reader` (`migration.rb:1212`) hands back whatever was seated, so
the union is what the slot really holds; the cast is a narrowing TS cannot
check. It is safe today by reachability, not by proof: a null-object context is
only ever a local temporary of the two functions that build one —
`Migration.copy` and activerecord-cli's `loadMigrations` — each of which reads
`migrations` off it and drops it, so none reaches `up` / `down` /
`currentVersion` (`migration.ts:2058`, `:2121-2122`), where a real
`SchemaMigration` method would be sent to an empty object.

Widening the readers to the union was measured on that PR and rejected: it
produces exactly 19 `TS2339`/`TS2345` errors, every one in a path that only ever
sees a real collaborator, so it relocates the same unchecked narrowing rather
than removing it.

## Converged shape

Make the reachability argument something the compiler checks rather than a
comment. The shape considered and not taken on #6272 was two type parameters
defaulting to the real classes —

```ts
export class MigrationContext<
  S extends SchemaMigration | NullSchemaMigration = SchemaMigration,
  I extends InternalMetadata | NullInternalMetadata = InternalMetadata,
>
```

— with `this: MigrationContext` annotations on the connected methods, so a
discovery-only context is typed as such and calling `up` / `down` /
`currentVersion` on one is a compile error. That costs ~13 `this:` annotations
and adds type machinery Rails has no counterpart for; weigh that against the
cast before committing to it. Whatever shape lands, the reader must stop
claiming a type the field may not hold.

## Acceptance criteria

- [ ] `MigrationContext.schemaMigration` / `.internalMetadata` no longer carry an
      `as` cast that can be false at runtime.
- [ ] A discovery-only context (the `Migration.copy` / `loadMigrations` shape)
      is distinguishable from a connected one without a runtime check.
- [ ] `Migration.copy` still seats the null objects verbatim as
      `migration.rb:1065-1066` does.
- [ ] `pnpm parity:api:extra --package activerecord` clean; no new baseline rows.
