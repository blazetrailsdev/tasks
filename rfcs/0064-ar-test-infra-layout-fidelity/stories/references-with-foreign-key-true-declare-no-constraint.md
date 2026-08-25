---
title: "t.references foreign_key: true builds no FK constraint in either canonical source"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6198
claim: "2026-08-07T20:08:49Z"
assignee: "polymorphic-reference-type-column-comes-first"
blocked-by: null
closed-reason: null
---

## Context

`t.references :x, foreign_key: true` builds a real FK constraint, not just the
column and index: `ReferenceDefinition#add_to` calls
`table.foreign_key(foreign_table_name, **foreign_key_options)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:242-244`),
with `foreign_key_options` = `as_options(foreign_key).merge(column: column_name)`
(`:276-278`) and `foreign_table_name` pluralizing the reference name
(`:296-300`).

Six such calls exist in `schema.rb`, all in the parrot/pirate/treasure block:

- `parrots_pirates` — `t.references :parrot, foreign_key: true` /
  `:pirate` (schema.rb:915-916)
- `parrots_treasures` — `:parrot` / `:treasure` (schema.rb:921-922)
- `parrot_treasures` — `:parrot` / `:treasure` (schema.rb:927-928)

Neither canonical source declares any of them. PR #6191 swept the _column
width_ and the _default index_ for every `t.references`, and deliberately left
the `foreign_key: true` arm out of scope — so all six FK constraints are still
missing on both sides:

```ts
// packages/activerecord/src/support/canonical-schema.ts
await define("parrots_pirates", { id: false }, (t) => {
  t.bigInteger("parrot_id");
  t.index("parrot_id");
  t.bigInteger("pirate_id");
  t.index("pirate_id");
});
```

`parity:schema` does not catch it: the drift check compares the two
transcriptions' `foreignKeys` against _each other_, and both declare none.

## Converged shape

Each of the six calls also emits its FK — `t.foreignKey("parrots", { column:
"parrot_id" })` in `canonical-schema.ts` and the matching `foreignKeys:` entry
in `test-schema.ts` — pluralized to the Rails target table (`parrot` →
`parrots`, `pirate` → `pirates`, `treasure` → `treasures`).

Note the fixture-ordering consequence: real FKs on the HABTM join tables mean
`parrots`/`pirates`/`treasures` rows must exist before the join rows, which
`wire-check-all-foreign-keys-valid-into-fixture-load` (done) already exercises.
Verify on the MariaDB lane, which is strictest about FK targets.

## Acceptance criteria

- [ ] All six `foreign_key: true` references declare their FK in both canonical
      sources, targeting the pluralized table with the Rails column.
- [ ] `pnpm parity:schema` clean; SQLite, PostgreSQL and MySQL/MariaDB lanes
      green.
