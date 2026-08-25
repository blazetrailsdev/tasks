---
title: "Migration.copy constructs neither NullSchemaMigration nor NullInternalMetadata"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6272
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while emptying `NullInternalMetadata`
(`null-internal-metadata-is-an-empty-class`, RFC 0051, done): auditing who
constructs the null objects showed that trails' `Migration.copy` constructs
neither, where Rails constructs both.

Rails (`activerecord/lib/active_record/migration.rb:1061-1069`):

```ruby
def copy(destination, sources, options = {})
  copied = []

  FileUtils.mkdir_p(destination) unless File.exist?(destination)
  schema_migration = SchemaMigration::NullSchemaMigration.new
  internal_metadata = InternalMetadata::NullInternalMetadata.new

  destination_migrations = ActiveRecord::MigrationContext.new(destination, schema_migration, internal_metadata).migrations
  last = destination_migrations.last
```

and it threads the _same two instances_ into the per-source context on
`migration.rb:1072`:

```ruby
source_migrations = ActiveRecord::MigrationContext.new(path, schema_migration, internal_metadata).migrations
```

trails (`packages/activerecord/src/migration.ts:1518`) drops both collaborators:

```ts
const destinationMigrations = new MigrationContext([destination]).migrations;
```

This is the deviation `Migration.copy`'s Ruby `new` shows up as in the
call-parity artifact — `new:NullInternalMetadata` appears on the Ruby side of
`copy`'s call skeleton with nothing crediting it on the TS side (a `new Foo()`
IS credited as `constructor`, so a flagging Ruby `new` means the port constructs
nothing).

Why it matters beyond the call set: `copy` only ever reads migration _files_ off
disk, and the null collaborators are precisely how Rails guarantees it never
touches `schema_migrations` / `ar_internal_metadata` while doing so. trails'
`MigrationContext` instead falls back to whatever its no-arg path supplies, so
the guarantee is implicit rather than expressed — and it is the reason Rails'
two null classes exist at all.

## Converged shape

`copy` builds both null objects up front and passes them to every
`MigrationContext` it constructs, exactly as `migration.rb:1061-1072` does —
one `NullSchemaMigration` and one `NullInternalMetadata`, shared across the
destination context and every per-source context, not re-instantiated per
iteration.

Depends on `MigrationContext`'s constructor accepting the pair; check its
current signature (`migration.ts`) before starting, and sequence after
`null-schema-migration-is-an-empty-class` so the two null classes are already
the empty shapes Rails passes.

## Acceptance criteria

- [ ] `Migration.copy` constructs `NullSchemaMigration` and
      `NullInternalMetadata` and threads both into every `MigrationContext` it
      builds (`migration.rb:1061-1072`).
- [ ] Both instances are created once and shared, as in Ruby — not rebuilt per
      source.
- [ ] `pnpm parity:api:calls` clean; the `copy` / `new` rows converge by deletion
      rather than by a new baseline row.
