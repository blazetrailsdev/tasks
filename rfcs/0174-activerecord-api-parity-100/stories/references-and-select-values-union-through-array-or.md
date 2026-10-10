---
title: "references-and-select-values-union-through-array-or"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

trails#8309 converged every plain Ruby `Array#|` / `Array#uniq` site in
`packages/activerecord/src/relation/query-methods.ts`, `merger.ts` and
`associations/association-scope.ts` onto ruby-compat's `union` / `uniq`, which
dedup by `rbHash` / `rbEql` (Ruby's `hash` / `eql?`). Two families still dedup
through hand-rolled bodies with their own equality:

- `references_values |=` — `query_methods.rb:361` (`references!`), `:722`,
  `:1152`, `:1188`, `:1641`, `:1979`, `:2090`. trails routes all of them through
  `unionReferences` (`query-methods.ts`), which keys on a reference's name
  (`SqlLiteral#value` or the string) and skips an empty name — an arm Rails does
  not have.
- `select_values |=` — `query_methods.rb:429` (`_select!`) and
  `merger.rb:88,90` (`merge_select_values`). trails' `_selectBang` keeps three
  seen-sets (strings, Arel nodes by `rbHash`/`rbEqual`, thunks by identity) and
  appends one value at a time.

`SqlLiteral` answers `String#eql?` / `String#hash` (`sql-literal.ts`,
`stringSuperclass`), so `"posts"` and `Arel.sql("posts")` are `eql?` in trails as
in Ruby; `union` should subsume the name key.

## Acceptance criteria

- [ ] Every `references_values |=` site above is `union(this.referencesValues, …)`, and `unionReferences` is deleted.
- [ ] `_selectBang` and Merger's `merge_select_values` are `this.selectValues = union(this.selectValues, fields)` after Rails' own normalization, with the seen-set bookkeeping deleted.
- [ ] `pnpm parity:api:calls` / `:args` green; relation suites green on SQLite, PG and MySQL/MariaDB.
