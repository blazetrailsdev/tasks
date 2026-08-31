---
title: "Nullable ForeignKeyDefinition#name is asserted away with ! at three call sites"
status: draft
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #7277 (RFC 0119 `sqlite-foreign-key-name-synthesis-diverges-from-pragma`),
which removed the SQLite FK-name synthesis so `foreignKeys` sets no `:name`,
matching `vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:417-451`.

That made `ForeignKeyDefinition#name` genuinely nullable — Rails' `name` is
`options[:name]` (`abstract/schema_definitions.rb:140-142`), nil when unset —
so the field is now `string | undefined` in
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`.

Three call sites took a `!` non-null assertion rather than handling the nil arm,
because their callees are typed `string`:

- `connection-adapters/abstract/schema-statements.ts` — `at.dropForeignKey(fk.name!)`
  in `removeForeignKey`.
- `connection-adapters/postgresql/schema-statements.ts` — `.name!` in
  `validateForeignKey`.
- `adapters/postgresql/deferred-constraints.test.ts` — `.name!` reading a
  fixture FK.

Each is safe today (every adapter reaching them reads names from the catalog,
and `SQLite3Adapter` overrides `removeForeignKey` itself), but `!` records an
invariant the types do not carry, and Rails' own bodies pass the nil straight
through — `remove_foreign_key` does `at.drop_foreign_key fk.name`
(`abstract/schema_statements.rb`) with no guard.

## Converged shape

Thread the nullable through instead of asserting it away: widen
`AlterTable#dropForeignKey` / `dropForeignKeyBang` and `validateConstraint` to
the type Rails' arguments actually have, so the three `!` disappear. If a call
site genuinely cannot proceed without a name, it should raise the error Rails
raises there rather than assert non-null.

Check `CheckConstraintDefinition#name` (`schema_definitions.rb:180-183`) at the
same time — it has the same `options[:name]` shape and may carry the same
mismatch.

## Acceptance criteria

- [ ] No `fk.name!` / `.name!` non-null assertion remains at the three sites.
- [ ] The nullable name flows through `dropForeignKey` and `validateConstraint`
      with the same control flow Rails has.
- [ ] `pnpm parity:api:calls` / `:calls:args` / `:params` non-regressing.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
