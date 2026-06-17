---
title: "with_recursive routes through check_if_method_has_arguments! (parity with #with)"
status: claimed
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 50
pr: null
claim: "2026-06-17T18:39:44Z"
assignee: "with-recursive-check-if-method-has-arguments-parity"
blocked-by: null
---

## Context

`Relation#withRecursive` (`packages/activerecord/src/relation.ts:5031`) does not
route through `checkIfMethodHasArgumentsBang`, unlike its sibling `with` (fixed
in PR #3435). Rails `with_recursive` (query_methods.rb:518-521) calls
`check_if_method_has_arguments!(__callee__, args)` before `spawn.with_recursive!`,
so it raises `ArgumentError "The method .with_recursive() must contain arguments."`
on empty varargs and applies `flatten!` (arrays only) + `compact_blank!`.

trails' `withRecursive` instead calls `withRecursiveBang(...ctes)` directly with
no empty-args guard, no block guard, and no flatten/compact, so
`withRecursive()`, `withRecursive(null)`, and `withRecursive([{ cte: rel }])`
all diverge from Rails.

Now that the shared helper flattens arrays only (PR #3435), `withRecursive` can
route through it exactly as `with` does.

## Acceptance criteria

- [ ] `withRecursive` routes through `this.checkIfMethodHasArgumentsBang("with_recursive", ctes)`
      (block guard + must-contain-arguments + flatten! + compact_blank!) before
      `withRecursiveBang`, mirroring `with`.
- [ ] `withRecursive()` raises ArgumentError with the Rails message.
- [ ] `withRecursive([{ cte: rel }])` flattens like Rails; `withRecursive(null)` no-ops.
- [ ] No regressions in existing with_recursive tests.

trails: `packages/activerecord/src/relation.ts` (`withRecursive`)
Rails: `activerecord/lib/active_record/relation/query_methods.rb:518-521`
