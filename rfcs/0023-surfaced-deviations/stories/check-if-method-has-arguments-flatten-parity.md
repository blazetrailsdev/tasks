---
title: "check_if_method_has_arguments! flatten! parity (arrays-only, not hashes)"
status: done
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3435
claim: "2026-06-16T02:04:52Z"
assignee: "check-if-method-has-arguments-flatten-parity"
blocked-by: null
---

## Context

`checkIfMethodHasArgumentsBang` (`packages/activerecord/src/relation/query-methods.ts:1561`)
mirrors Rails `check_if_method_has_arguments!` (query_methods.rb:2213-2221) but
its flatten step diverges: `flattenedArgs` recursively flattens **plain objects**
into `[key, value, …]`, whereas Rails' `args.flatten!` flattens **arrays only**
(hashes pass through untouched).

Surfaced in PR #3424: `Relation#with` (relation.ts) could not route through the
shared helper — doing so corrupted CTE definition hashes (`with({ cte: rel })`
flattened to `["cte", rel]`), failing 12 `with` tests. `with` instead inlines the
`args.blank? → raise` and `compact_blank!` branches and deliberately skips
`flatten!`. The nested-array edge (`with([{ cte: rel }])`) is therefore also not
flattened, unlike Rails.

## Acceptance criteria

- [ ] `flattenedArgs` / `checkIfMethodHasArgumentsBang` flatten arrays only
      (Rails `flatten!` parity), leaving plain-object args intact — OR the
      object-flattening is moved to the specific callers that actually need it
      (audit `order`/`select`/etc. for reliance on the current behavior first).
- [ ] `Relation#with` routes through the shared helper (block guard +
      must-contain-arguments + flatten! + compact_blank!) instead of inlining,
      with `with([{ cte: rel }])` flattening like Rails.
- [ ] No regressions in existing `with`/`order`/`select`/`group` arg-handling tests.

trails: `packages/activerecord/src/relation/query-methods.ts` (`flattenedArgs`,
`checkIfMethodHasArgumentsBang`), `packages/activerecord/src/relation.ts` (`with`)
Rails: `activerecord/lib/active_record/relation/query_methods.rb:2213-2221`, `:493-496`
