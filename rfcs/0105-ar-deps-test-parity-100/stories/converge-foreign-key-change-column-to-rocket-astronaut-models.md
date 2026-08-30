---
title: "Drive ForeignKeyChangeColumnTest through Rocket/Astronaut models instead of raw SQL"
status: draft
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`migration/foreign_key_test.rb`'s `ForeignKeyChangeColumnTest` and its two
subclasses drive every assertion through two model classes Rails defines inline
in the test file
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:26-33`):

```ruby
class Rocket < ActiveRecord::Base
  has_many :astronauts
end

class Astronaut < ActiveRecord::Base
  belongs_to :rocket
end
```

Every one of the six bodies (lines 65-143) opens with

```ruby
rocket = Rocket.create!(name: "myrocket")
rocket.astronauts << Astronaut.create!
```

and then reads `Rocket.table_name` / `Astronaut.table_name` for the table it
operates on, and `Rocket.first.name` for the round-trip assertion.

The trails counterpart
(`packages/activerecord/src/migration/foreign-key.test.ts`, the
`changeColumnTables` factory) has no models. It substitutes:

- `createRocketWithAstronaut(conn)` — hand-written `INSERT INTO … VALUES
('myrocket')` plus a `SELECT id` and a second `INSERT`, in place of
  `Rocket.create!` + the `has_many` collection append.
- `rocketName(conn)` — a raw `SELECT name … ORDER BY id`, in place of
  `Rocket.first.name`.
- `const rockets = \`${prefix}rockets${suffix}\``— string interpolation, in
place of`Rocket.table_name`.

The third substitution is the one that costs coverage. `ForeignKeyChangeColumnWithPrefixTest`
and `…WithSuffixTest` (lines 145-163) exist precisely to check that the model
layer's `table_name` derivation picks up `ActiveRecord::Base.table_name_prefix`
/ `table_name_suffix` — which is also why Rails' setup/teardown call
`Rocket.reset_table_name` / `reset_column_information` four times over
(lines 47-63). Because trails computes the table name itself, the two subclass
describes assert nothing about the model layer; they only re-run the same DDL
against a different literal string, and `resetTableName`
(`packages/activerecord/src/model-schema.ts:342`) / `resetColumnInformation`
(`:503`) — which exist and are the direct analogues — are never exercised here.

Related: Rails uses `def setup` / `def teardown` (lines 46-63) where trails
wraps each body in a per-test `withChangeColumnTables` closure. Converging the
bodies to models makes the hook shape the natural place to put the migrate
up/down and the four reset calls, so the two changes belong in one pass.

Found while closing the file's wrong-describe residue in
`port-migration-foreign-key-residue-and-mysql2-rake-skips` (#7252), which
inlined the three describes but deliberately left the bodies alone — the model
work needs association writes and the `resetTableName` /
`resetColumnInformation` lifecycle verified on all three adapter lanes, which is
larger than that story's remit.

## Acceptance criteria

- `Rocket` and `Astronaut` are defined in `foreign-key.test.ts` with
  `hasMany("astronauts")` / `belongsTo("rocket")`, mirroring
  `foreign_key_test.rb:26-33`.
- The six `ForeignKeyChangeColumnTest` bodies read through the models —
  `Rocket.create(…)`, the `astronauts` collection append, `Rocket.first`,
  and `Rocket.tableName` / `Astronaut.tableName` for the operated-on table —
  rather than raw SQL and interpolated table-name strings.
- Setup/teardown mirror `foreign_key_test.rb:46-63`: migrate up / down plus
  `resetTableName` and `resetColumnInformation` on both models, replacing the
  per-test `withChangeColumnTables` wrapper.
- `changeColumnTables`' `createRocketWithAstronaut` and `rocketName` helpers are
  deleted, not kept alongside the models.
- Green on all three adapter lanes; `pnpm parity:test -- --package activerecord`
  delta non-negative.
