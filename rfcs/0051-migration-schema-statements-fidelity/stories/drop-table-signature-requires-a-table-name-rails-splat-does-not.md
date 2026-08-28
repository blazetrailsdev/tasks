---
title: "drop-table-signature-requires-a-table-name-rails-splat-does-not"
status: ready
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
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

Surfaced while converging `drop-table-raises-argumenterror-rails-has-no-counterpart-for`
(PR #7127), which deleted the invented `ArgumentError` on zero table names from
all three `dropTable` bodies so the call is the no-op Rails' splat makes it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:540-545`).

The runtime is converged; the TYPE is not. All three signatures spell Rails'
`*table_names` as a tuple union whose every arm starts with a required
`string`:

- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:458-469`
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts` (`dropTable`)
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts` (`dropTable`)

```ts
...args:
  | [string, ...string[]]
  | [string, ...string[], { ifExists?: boolean; force?: boolean | "cascade" } | undefined]
  | ...
```

So `dropTable()` and `dropTable({ ifExists: true })` — both no-ops in Ruby,
where kwargs never land in `table_names` — are type errors, and the converged
no-op is reachable only through untyped dispatch (`CommandRecorder#replay`,
`methodMissing`). That is what the regression test in
`connection-adapters/abstract/schema-statements-on-adapter.trails.test.ts`
("dropTable with no table names is a no-op, with or without options") has to
cast for.

Left out of #7127 deliberately: widening the tuple touches all three adapters
plus the `AbstractAdapter` interface, and a `dropTable` parameter change reds
`mixin-declaration-drift`, which compares parameter names and the return type's
written spelling against that interface — a separate diff with its own lanes to
watch.

## Acceptance criteria

- [ ] `dropTable` accepts zero table names at the type level in all three
      bodies, matching `*table_names`; `dropTable()` and
      `dropTable({ ifExists: true })` typecheck.
- [ ] The regression test above drops its `as (...args: unknown[]) => Promise<void>`
      cast and calls `dropTable` directly.
- [ ] `mixin-declaration-drift` and the arity gate stay green; SQLite,
      PostgreSQL and MySQL/MariaDB lanes green.
