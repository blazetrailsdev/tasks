---
title: "HashConfig#primary? should read the global configurations registry, not a _primaryChecker global"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `HashConfig#primary?` is one line — it asks the global registry:

```ruby
def primary? # :nodoc:
  Base.configurations.primary?(name)
end
```

(`vendor/rails/activerecord/lib/active_record/database_configurations/hash_config.rb:129-130`,
delegating to `DatabaseConfigurations#primary?` at
`database_configurations.rb:142-147`, which is `name == "primary" ||
name == find_db_config(default_env)&.name`.)

trails cannot reach `Base` from `hash-config.ts` (cycle), so it reimplemented
the lookup as a module-global indirection: `_primaryChecker`, installed at
`database-configurations.ts:496` against a second module global,
`_currentConfigurations` (`database-configurations.ts:13`, mutated as a side
effect of the `DatabaseConfigurations` constructor at `:119` and `:135`).
`HashConfig.isPrimary()` (`hash-config.ts:33-36`) consults that instead of the
registry.

This is now removable. PR #5386 (story
`converge-configurations-storage-onto-a-single-global-registry`) moved
`configurations` onto a single process-global registry in `core.ts` with a
receiver-less accessor, which is exactly the `Base.configurations` that Rails'
`primary?` reads — and importing it from `core.js` does not close a cycle the
way importing `base.js` would (`connection-handling.ts` already does this).

The `_currentConfigurations` global is also test-visible debt: suites save and
restore `(DatabaseConfigurations as any).current` around anything that builds
configs (`connection-handling.test.ts:486`, `:519`, `:722`,
`connection-handlers-sharding-db.test.ts`, `connection-swapping-nested.test.ts`)
purely because the constructor mutates it. Rails has no `current` and no such
dance.

## Acceptance criteria

- `HashConfig#isPrimary` resolves through the global `configurations` registry,
  matching `Base.configurations.primary?(name)`.
- `_primaryChecker` / `_setPrimaryChecker` are deleted.
- `DatabaseConfigurations.current` / `_currentConfigurations` is deleted, or —
  if some other consumer still needs it — the story is reduced to the
  `primary?` half and the remaining consumers are named in a follow-up.
  Rails has no counterpart for either.
- The `(DatabaseConfigurations as any).current` save/restore blocks in the
  suites above are removed along with it.
- No `base.js` import from `database-configurations*` — read the accessor from
  `core.js`, as `connection-handling.ts` does.
- Suites pass: database-configurations, connection-handling, shard-keys,
  test-databases, connection-swapping-nested, connection-handlers-\*,
  schema-dumper (schema_dump / seeds read `primary?`).
