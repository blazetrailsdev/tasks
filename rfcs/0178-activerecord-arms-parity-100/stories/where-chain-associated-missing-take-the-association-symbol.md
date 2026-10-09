---
title: "activerecord: where.associated / where.missing take the association as a Symbol"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: trails#8733
claim: "2026-10-09T22:39:42Z"
assignee: "relation-load-path-and-references-to-s-invented-arms"
blocked-by: null
closed-reason: null
---

## Context

`WhereChain#associated` / `#missing` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:88-104`, `:124-137`) take the association as a Symbol and hand it straight on: `@scope.joins!(association)`, `@scope.left_outer_joins!(association)`, `self.not(association => association_conditions)`, `@scope.where!(association => association_conditions)`.

trails' ports (`packages/activerecord/src/relation/query-methods.ts`, `WhereChain#associated` / `#missing`) accept a bare String (`where().associated("author")`) and re-spell it as a Symbol at each of those sites with an `isRubySymbol(association)` ternary that prefixes the colon. Those three ternaries are the two invented `if` arms the arms report files per method, and they carry `@inventedArm if — CONVERGEABLE` receipts pointing at this story.

A Ruby Symbol value is a colon-prefixed string in trails (`":author"`), so the converged signature takes `":author"` and the body passes `association` through unchanged. Trying it surfaced two things:

- `Model._reflectOnAssociation(":author")` answers `undefined`; Rails' is `_reflections[association.to_sym]` (`activerecord/lib/active_record/reflection.rb:126-128`), so the lookup must take either spelling.
- 45 call sites pass a bare name: `relation/where-chain.test.ts`, `relation/where-chain.trails.test.ts`, `relation/where-symbol-key-stringification.trails.test.ts`. Rails' tests pass Symbols (`activerecord/test/cases/relation/where_chain_test.rb`).

The error message at `scopeAssociationReflection` interpolates `:#{association}`, so it needs `toS(association)` once the argument carries its colon.

## Acceptance criteria

- [ ] `associated` / `missing` pass `association` straight to `joinsBang` / `leftOuterJoinsBang` / `not` / `whereBang`, with Rails' `unless a || b` guard and `Array(reflection.association_primary_key).index_with(nil)`.
- [ ] `_reflectOnAssociation` resolves a colon-spelled Symbol as `_reflections[association.to_sym]` does.
- [ ] Every caller passes the Symbol spelling (`where().associated(":author")`).
- [ ] Both `@inventedArm if` receipts are deleted and `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no row for either method.
