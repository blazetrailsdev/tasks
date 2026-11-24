---
title: "Record spike: live reflection, runtime accessors and a read path with no ruby-compat"
status: draft
updated: 2026-11-24
rfc: "0000-ruby-compat-free-record"
cluster: spike
packages: []
deps: ["raw-driver-baseline-in-load-records-bench"]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The first half of the spike in the RFC README's "Rollout". It is written by
hand in `scripts/bench/record-spike/` in trails and imports nothing from
`@blazetrails/ruby-compat`, `activerecord`, `activemodel` or `arel`, directly
or transitively. Its tests may import `@blazetrails/activerecord` to compare
against; its own modules may not. It sits on `better-sqlite3` (Open question 1, option b).

It exercises three design sections of the README: "Live reflection stays the
source of columns", "Queries compile straight to SQL", and "Drop-in for the
common surface".

## Acceptance criteria

- [ ] A `Base` class with `establishConnection({ adapter: "sqlite3", database })`
      and `tableName`, and an awaited schema load that reads a table's
      columns from the live database (`PRAGMA table_info`).
- [ ] After the load, one accessor pair per column is defined on the model's
      prototype, once per class. A record holds its values in an array
      indexed by column position and casts on first read. Integer, text and
      datetime columns are cast; datetime answers the same Temporal type
      ActiveRecord answers.
- [ ] `find`, `findBy`, `where` with an object of equalities, `order` with an
      object, `limit`, `first`, `toArray`, `count` and `toSql`, on an
      immutable relation, with the same names and signatures as
      `@blazetrails/activerecord`.
- [ ] A relation compiles to a SQL string and a bind list with no
      intermediate AST, and the prepared statement is cached by the
      relation's shape.
- [ ] For each query the spike supports, a test asserts `toSql()` equals what
      `@blazetrails/activerecord` emits for the same call on the same table.
- [ ] `scripts/boot-graph/measure.mts --entry` on the spike's entry file
      reports 0 ruby-compat modules.
- [ ] The load-records bench gains a third column for the spike: load and
      `find`, with their ratios to the bare driver.

## Definition of done

Importing a helper from ruby-compat by subpath does not close this story.
Neither does a model that lists its columns in source: columns come from the
database.

## Notes

`trails-tsc` typing of the spike's models is out of scope here; the report
story checks it.
