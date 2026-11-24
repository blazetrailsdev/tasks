---
title: "Record spike: a model layer on SQLite with no ruby-compat, benched against ActiveRecord and the bare driver"
status: draft
updated: 2026-11-24
rfc: "0000-ruby-compat-free-record"
cluster: spike
packages: []
deps: []
deps-rfc: []
est-loc: 1500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The spike in the RFC README's "Rollout", as one PR. It is written by hand in
`scripts/bench/record-spike/` in trails and imports no `@blazetrails/*`
package, directly or transitively. That includes activesupport, so a spike
model names its table, foreign key and associated class, and nothing is
inflected. Its test may import `@blazetrails/activerecord` to compare
against; its own modules may not. It sits on `better-sqlite3` (Open
question 1, option b).

It is one story because the pieces are only meaningful together: the bench
needs the read and write paths, and the ratios need the bare-driver column
beside them. The README's `max-est-loc` covers its size.

`scripts/bench/activerecord-load-records.mts` (trails) loads 12,000 rows of
24 columns through ActiveRecord and reports nothing for the same rows read
through the driver alone.

## Acceptance criteria

Bench:

- [ ] The load-records bench has three columns: `better-sqlite3` directly,
      the spike, and `@blazetrails/activerecord`, each on its own in-memory
      database holding the same rows.
- [ ] It reports, per row and with ratios to the driver: load of 12,000
      rows; load followed by a read of every column; a primary-key `find`
      run 12,000 times; an unloaded `belongsTo` read; a load with the
      `belongsTo` preloaded; insert and update of 12,000 rows.
- [ ] Run with `--expose-gc`, it reports heap bytes retained per loaded row
      for each side.

Read path:

- [ ] A `Base` class with `establishConnection({ adapter: "sqlite3", database })`
      and `tableName`, and a schema load that reads a table's columns from
      the live database (`PRAGMA table_info`).
- [ ] One accessor pair per column is defined on the model's prototype, once
      per class. A record holds its values in an array indexed by column
      position and casts on first read. Integer, text and datetime columns
      are cast. Datetime answers a native `Temporal.Instant`.
- [ ] `find`, `findBy`, `where` with an object of equalities, `order` with an
      object, `limit`, `first`, `toArray`, `count` and `toSql`, on an
      immutable relation, with the names and signatures of
      `@blazetrails/activerecord`.
- [ ] A relation compiles to a SQL string and a bind list with no
      intermediate AST, and the prepared statement is cached by the
      relation's shape.

Write path:

- [ ] `new Model(attributes)`, `save`, `create`, `createBang`, `update`,
      `destroy`, `isPersisted`, `isNewRecord`.
- [ ] Assignment by attribute name goes through a per-model table built at
      schema load, not through a string-keyed send.
- [ ] `changes` and `isChanged`; `update` writes only changed columns.
- [ ] `static { this.belongsTo("author", { className: "Author", foreignKey: "author_id" }) }`
      defines the reader and writer at declaration time. The reader's return
      type is ActiveRecord's (`Author | null | Promise<Author | null>`), and
      `includes("author")` loads it in one extra query.

Correctness:

- [ ] One test body runs against ActiveRecord models and against spike
      models. For each query the spike supports it asserts the same
      `toSql()`, and for each read and write the same statements and binds,
      read through a `sql.active_record` subscriber on the faithful side.
- [ ] `scripts/boot-graph/measure.mts --entry` on the spike's entry file
      reports 0 ruby-compat modules.
- [ ] The spike's README lists every difference from ActiveRecord the test
      had to allow for.

## Definition of done

A figure taken under vitest does not close this story: the bench runs under
plain `node` or `tsx`. Neither does importing a helper from ruby-compat by
subpath, a model that lists its columns in source, or a `belongsTo` reader
that always returns a promise.

## Verification

    pnpm vitest run scripts/bench/record-spike
    node --expose-gc --import tsx scripts/bench/activerecord-load-records.mts

## Notes

Validations, callbacks and transactions are not part of the spike.
`trails-tsc` typing of the spike's models is checked by
`record-spike-report-and-decide`. `better-sqlite3` is a root devDependency of
trails, so a script under `scripts/` resolves it with no new dependency.
The work is in trails#10723.
