---
title: "parity: a dynamic import() of a file is Kernel#load, not an omitted call"
status: in-progress
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8430
claim: "2026-10-03T00:31:59Z"
assignee: "call-gate-credits-a-dynamic-import-as-kernel-load"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`MigrationProxy#load_migration` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1194-1199`) evaluates the migration file with
`Kernel#load` (`rb_f_load`, `vendor/ruby/v3.3.11/load.c:903`):

```ruby
def load_migration
  Object.send(:remove_const, name) rescue nil

  load(File.expand_path(filename))
  name.constantize.new(name, version)
end
```

ESM has one way to evaluate a file by path at run time, `await import(url)`, and that is what
`packages/activerecord/src/migration.ts` `loadMigration` writes. `import` is a keyword, not a
callee, so the call-set gate charges the body with an omitted `load` and the port carries
`@missingRailsCall load`. `migration-proxy-load-migration-cannot-reevaluate-a-changed-file` (done)
settled the body; nothing ratifies the receipt.

Two shapes are open. Decide between them here:

1. A ruby-compat `load(path)` (`rb_f_load`) that wraps the `import()` and the cache-busting query
   `loadMigration` builds by hand. The body then calls `load`, as Rails does.
2. The gate credits an `import()` expression as `load`, the way `JS_ENUMERABLE_ALIASES` credits
   `some` for `any?`.

Shape 1 also removes `loadMigration`'s `await import("node:url")`.

The same receipt is `PERMANENT` on other `load` sites in the repo
(`grep -rn "@missingRailsCall load" packages/*/src`); check each against the chosen shape.

## Acceptance criteria

- [ ] `loadMigration` no longer carries `@missingRailsCall load`.
- [ ] Every other `@missingRailsCall load` receipt the chosen shape covers is deleted in the same PR.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:receipts:gate` stay green.
