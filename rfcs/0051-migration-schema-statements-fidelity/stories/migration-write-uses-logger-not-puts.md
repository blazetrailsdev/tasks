---
title: "Migration#write routes through Migration.logger; Rails uses puts"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Migration#write` writes with Kernel#puts, not through a logger:

```ruby
# vendor/rails/activerecord/lib/active_record/migration.rb:1001
def write(text = "")
  puts(text) if verbose
end
```

`announce` / `say` / `say_with_time` all funnel through `write`, so every
migration message in Rails goes to `$stdout` via `puts`.

trails routes it through `Migration.logger` instead
(`packages/activerecord/src/migration.ts:1257`, `Migration.logger.info(text)`),
and `_runMigration` bypasses `write` entirely, calling `Migration.logger.info`
directly for the `== <version> <name>: migrating ==` banner
(`migration.ts:2786` and `migration.ts:2817`) rather than going through
`announce`/`write` the way Rails does.

Consequences of the deviation:

- `Migration.verbose` is honored in `write` but the `_runMigration` banners
  check `this.verbose` separately instead of inheriting it from `write`.
- Anything that swaps `Migration.logger` changes migration output in trails but
  has no Rails analogue; Rails only has `$stdout`.
- `suppress_messages` semantics are expressed against a logger rather than
  against `puts`.

PR #5474 (`migration-logger-bypasses-stdout-adapter`) made the default `Logger`
sink route through the activesupport `stdout` shim, so the two paths now land in
the same place at runtime. That fixed the process-adapter bypass but did not
converge the structural deviation: trails still uses a logger where Rails uses
`puts`, and still has two emit sites for migration banners.

## Acceptance criteria

- [ ] `Migration#write` emits via the activesupport `stdout` shim (the trails
      analogue of Ruby's `puts` / `$stdout`) rather than `Migration.logger`,
      matching `migration.rb:1001`.
- [ ] `_runMigration`'s two banner emit sites go through `announce`/`write`
      instead of calling `Migration.logger.info` directly, so the `verbose`
      check lives in exactly one place as in Rails.
- [ ] Existing migration-output tests (including
      `database-tasks.test.ts`'s migration capture helper, which already spies
      on the `stdout` shim) still pass unchanged.
- [ ] Decide and record whether `Migration.logger` keeps a role at all; if it
      has no Rails counterpart on this path, remove it or justify it at the call
      site.
