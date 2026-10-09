---
title: "api-compare: an end-to-end compare test over a constructor carrying @inlinedFrom"
status: draft
updated: 2026-10-09
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8727 unit-tests the pieces of the `@inlinedFrom` call-gate path (`scripts/api-compare/inlined-bodies.test.ts`, `inlined-from-tags.test.ts`, `extract-ts-api.test.ts`) but nothing runs `compare.ts` with a tagged constructor: no constructor in the tree carries a tag yet. The glue is `inlinedSegmentsFor` in `scripts/api-compare/compare.ts`, which resolves the TS owner, reads `tsInlinedFromByFileOwner`, calls `taggedBodies`, and marks `inlinedTagsCompared`; and the post-loop `uncomparedInlinedTags` throw. A wrong owner key or a tag recorded under the wrong file would pass every existing test.

The first real exercise would otherwise be a conversion PR (e.g. `activemodel-inlines-api-attributes-and-serialize-cast-value-initialize`, for `ActiveModel::API#initialize`, `vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:80-84`), where a tooling bug and a porting bug would be indistinguishable.

## Acceptance criteria

- A test drives the comparison over a small Ruby manifest and TS manifest fixture (no vendored tree needed, since the Unit Tests job has none) containing a class whose constructor carries one `@inlinedFrom` tag.
- It asserts: the pair is compared against the union (a call only the module body makes is flagged when the constructor omits it, and not when it makes it); the consumed `super` is not flagged; a stale citation, an unresolvable tag, a same-file tag and a tag on an unpaired constructor each throw their own message.
- If `main()` cannot be driven from a test, the per-pair logic is extracted far enough to be, with no behaviour change and both call gates' output unchanged.
