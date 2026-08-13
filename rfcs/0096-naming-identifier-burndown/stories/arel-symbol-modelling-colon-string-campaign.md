---
title: "arel-symbol-modelling-colon-string-campaign"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6478
claim: "2026-08-13T17:05:42Z"
assignee: "arel-symbol-modelling-colon-string-campaign"
blocked-by: null
closed-reason: null
---

## Context

`arel-column-with-table-symbol-arm` (RFC 0096 wave 3) assumed the
`typeof x === "symbol"` arms in `arelColumn` / `arelColumns` /
`arelColumnWithTable` (`packages/activerecord/src/relation/query-methods.ts`)
were dead modelling that could simply be deleted. They are not: they are
behaviorally load-bearing, and deleting them reds four SQLite tests in
`packages/activerecord/src/relation/select.test.ts`.

Rails discriminates on the Ruby type at two live sites:

- `query_methods.rb:2003` —
  `Arel.sql(is_symbol ? model.adapter_class.quote_table_name(field) : field)`.
  `Post.select("1", "foo()", :bar)` emits `SELECT 1, foo(), "bar"`
  (`vendor/rails/activerecord/test/cases/relation/select_test.rb:16-19`): the
  Symbol names a column and is quoted, the Strings are raw SQL and are not.
- `query_methods.rb:1980` — `column_name.is_a?(Symbol) || !column_name.match?(/\W/)`,
  exercised by `select_test.rb:71-78` (`Post.select(posts: [:bar, :id])`).

So PR #6475 shipped the `colStr` -> `columnName` rename and justified the
retained arms at both call sites, per the story's stated escape hatch. The
JS-`Symbol` modelling itself remains, and it is the CLAUDE.md violation ("a
Ruby Symbol is a JS string, never a JS `Symbol`").

The settled trails idiom for a method whose control flow turns on
`Symbol === x` is the leading-colon string: `:bar` is `":bar"`, with
`.slice(1)` for the name. Applying it here is a campaign, not a rename — it
changes the `select` / `order` / `group` / `where` public argument surface and
touches all 15 `symbolToName` call sites in `query-methods.ts` plus
`select.test.ts`'s `sym()` helper (`:20`), which currently manufactures real
JS `Symbol`s.

## Acceptance criteria

- [ ] `select.test.ts`'s `sym()` helper is gone; Rails' `:bar` is spelled
      `":bar"` at the call sites, matching `select_test.rb` verbatim.
- [ ] `arelColumn` / `arelColumns` / `arelColumnWithTable` /
      `arelColumnsFromHash` / `arelColumnAliasesFromHash` discriminate on the
      leading colon rather than `typeof x === "symbol"`, preserving the
      quoting behavior of `query_methods.rb:1980` and `:2003`.
- [ ] No JS `Symbol` remains as a Ruby-Symbol stand-in in `query-methods.ts`.
- [ ] `relation/select.test.ts`, `relations.test.ts` and `calculations.test.ts`
      pass on all three adapters.
