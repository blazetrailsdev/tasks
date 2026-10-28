---
title: "Remaining rbObjClassname compares: thor Proc checks and ActiveModel numeric class compare"
status: claimed
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-28T16:49:19Z"
assignee: "enumerable-free-functions-remaining-loop-and-enumerator-sites"
blocked-by: null
closed-reason: null
---

## Context

trails#9400 changed the class-name comparisons listed in `class-name-compares-and-ruby-class-brand-onto-class-objects` into class-object tests. Four sites outside that list still compare names:

- `packages/thor/src/group.ts:89,122,418`: `rbObjClassname(x) === "Proc"`. Thor writes `names.last.is_a?(Proc)` (`vendor/thor/v1.3.2/lib/thor/group.rb`).
- `packages/activemodel/src/type/helpers/numeric.ts:19`: `rbObjClassname(oldValue) === rbObjClassname(newValue)`. Rails compares `old_value.class == new_value.class` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/helpers/numeric.rb`).

## Acceptance criteria

- [ ] The thor sites become `rbObjIsKindOf(x, rbCProc)`. `rbCProc` is module-private in `packages/ruby-compat/src/object.ts`, so export it.
- [ ] numeric.ts becomes `rbObjClass(oldValue) === rbObjClass(newValue)`.
- [ ] A test covers a Proc passed as the last argument of `Group.invoke`.
