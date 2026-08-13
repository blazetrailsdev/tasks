---
title: "arel-column-with-table-symbol-arm"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6475
claim: "2026-08-13T16:35:50Z"
assignee: "arel-column-with-table-symbol-arm"
blocked-by: null
closed-reason: null
---

## Context

Split out of `naming-burndown-3-ar-structural-residue` (RFC 0096 wave 3), item 3.

`packages/activerecord/src/relation/query-methods.ts#arelColumnWithTable`
(`:2125-2155`) cannot rename its `colStr` local to Rails' `column_name`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1978-1988`)
because the parameter is typed `string | symbol` and a later
`typeof columnName === "symbol"` branch (`:2142`) needs the un-narrowed value —
`colStr` is `symbolToName(columnName)`.

Per CLAUDE.md a Ruby Symbol is a JS string in trails, never a JS `Symbol`, so
the `symbol` arm is itself the divergence. Rails' branch is
`column_name.is_a?(Symbol) || !column_name.match?(/\W/)` — with Symbols spelled
as strings, the whole arm collapses to the `\W` test.

The JS-`Symbol` modelling is not local to this method: `arelColumns`
(`query-methods.ts:2116`) and `arelColumn` (`:2108`) carry the same
`typeof field === "symbol"` arms, so this is a small campaign across
`query-methods.ts`, not a one-line rename.

## Acceptance criteria

- [ ] The JS-`Symbol` arms in `arelColumn` / `arelColumns` /
      `arelColumnWithTable` are removed (or the retained arm is justified at the
      call site against `query_methods.rb:1980`).
- [ ] `arelColumnWithTable`'s local is Rails' `columnName` and the `colStr`
      local is gone.
- [ ] Relation/query-methods tests pass on all three adapters.
