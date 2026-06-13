---
title: "Arel BindParam#toSql inlines the value instead of emitting a ? bind placeholder"
status: ready
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting the `AdapterTest` bind probes in #3176. Rails'
`Arel::Nodes::BindParam.new(nil).to_sql` emits the bind placeholder `?` (the
default ToSql visitor collects a bind marker). In trails,
`new Nodes.BindParam(null).toSql()` returns `"NULL"` — the default `Node#toSql`
(`packages/arel/src/nodes/node.ts`) inlines the value rather than emitting a
placeholder.

Worked around in the #3176 bind tests by writing a literal `?` in the SQL
string instead of `bindParam.toSql()`. Worth deciding whether trails' Arel
should mirror Rails here or whether inlining is intentional for our bind
strategy.

## Acceptance criteria

- [ ] Decide and document: `BindParam#toSql` emits `?` (Rails parity) vs.
      intentional value-inlining.
- [ ] If parity: `new Nodes.BindParam().toSql()` returns `?`; update the #3176
      adapter bind tests to use `bindParam.toSql()` instead of a literal `?`.
