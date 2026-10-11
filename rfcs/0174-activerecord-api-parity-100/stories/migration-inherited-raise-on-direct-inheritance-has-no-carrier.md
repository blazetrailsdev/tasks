---
title: "activerecord: a direct `extends Migration` raises, and in-repo migrations extend the versioned class"
status: ready
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
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

`ActiveRecord::Migration.inherited` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:617-626`) raises
`StandardError` when `subclass.superclass == Migration`:

```ruby
raise StandardError, "Directly inheriting from ActiveRecord::Migration is not supported. " \
  "Please specify the Active Record release the migration was written for:\n" \
  "\n" \
  "  class #{subclass} < ActiveRecord::Migration[#{major}.#{minor}]"
```

**Ruling (repo owner, 2026-10-11, on trails#8789): a direct `extends Migration` raises as Rails does.**
The July 2026 ruling that versioned migrations are out of scope (trails#5070) no longer describes
`main`: `packages/activerecord/src/migration/compatibility.ts` ports `V4_2` .. `V8_0`, and
`Migration.get(version)` (`packages/activerecord/src/migration.ts`) is Rails' `Migration[version]`
(`migration.rb:629-631`).

trails has no carrier for the hook. JS has no definition-time hook, so the seat is a deferred one: the
constructor, or `MigrationProxy#load_migration`. `class Current < Migration` (`migration.rb:579`) is
defined before `self.inherited` (`:617`), so Rails does not raise for `Current`, and every
`Compatibility::V*` descends from `Current`. A constructor seat must leave `Current` alone the same way.

Direct subclasses on `main` at `11d3346c83`:

- The generator templates `migration.ts.tt` and `create_table_migration.ts.tt` in
  `packages/trailties/src/generators/active-record/migration/templates/` emit `extends Migration`. Rails'
  templates emit `ActiveRecord::Migration[<%= ActiveRecord::Migration.current_version %>]`.
- 111 `class X extends Migration` declarations in 57 files under `packages/*/src` (47 files in
  activerecord, 4 in activerecord-cli, 4 in trailties, 2 in website), plus anonymous
  `class extends Migration` expressions in tests. Rails' own tests subclass
  `ActiveRecord::Migration::Current` or `ActiveRecord::Migration[x.y]`; follow the Rails test each one
  mirrors.

The rewrite is larger than one PR. Land the subclass rewrites first, split by package if needed, and
seat the raise last so `main` never has a raising base with direct subclasses.

## Acceptance criteria

- [ ] No class under `packages/*/src` extends `Migration` directly, apart from `Current`. Each extends
      `Migration.Current` or `Migration.get(x.y)`, as the Rails test or template it mirrors does.
- [ ] The generator templates emit the versioned class, as Rails' templates do.
- [ ] A direct subclass of `Migration` raises `StandardError` with Rails' message, naming the subclass
      and `Migration[major.minor]`.
- [ ] `Current` and the `Compatibility::V*` classes do not raise.
- [ ] Rails' "Directly inheriting" coverage is ported under its Rails test name
      (`pnpm rails:find "Directly inheriting"`).
- [ ] The `inherited` row for `migration.rb` in `packages/activerecord/CLAUDE.md`'s hook table is updated.
