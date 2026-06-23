---
title: "has_many :through with source_type: drops the polymorphic source reflection's own scope"
status: ready
updated: 2026-06-23
rfc: "0040-through-association-source-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during review of PR #3866 (through-source-reflection-scope-not-merged).
That fix merges a has_many/has_one :through SOURCE reflection's scope into the
through query (`AssociationScope#addConstraints`, association-scope.ts). It
deliberately SKIPS the merge when `source_type:` is set:

```ts
if (isThrough && !(head ... ).options?.sourceType) {
  const sourceRefl = head.sourceReflection;
  if (sourceRefl) scope = this._mergeReflectionScopeChain(scope, sourceRefl, owner);
}
```

Rails' `add_constraints` does NOT special-case `source_type:` — `chain.reverse_each`
always iterates `chain_head.constraints` (= `source_reflection.constraints << scope`,
reflection.rb:1180-1183). So a scope declared on the polymorphic belongsTo SOURCE of a
`source_type:` through (e.g. `belongs_to :taggable, -> { where(...) }, polymorphic: true`)
would be merged by Rails but is dropped by trails.

Note: the THROUGH/join-model scope on a `source_type:` association IS still applied
(via the `PolymorphicReflection` chain entry, reflection.ts:1916-1918), proven by the
passing `nullTaggedPosts` test — only the polymorphic-belongsTo-source's OWN scope is
dropped. This was already dropped before #3866 (pre-existing gap, not a regression).

Blocker: `_mergeReflectionScopeChain` reads `reflection.klass`, which RAISES for a
polymorphic belongsTo (`computeClass`: "Polymorphic associations do not support
computing the class.", reflection.ts:1198). Converging requires resolving the source
klass per `source_type` (the resolved target class) before evaluating its scope —
mirroring how the rest of the source_type path threads the runtime klass.

## Acceptance criteria

- [ ] A `source_type:` has_many/has_one :through whose polymorphic belongsTo source
      carries a `-> { where(...) }` (or order) scope applies that predicate to the
      through query, matching Rails.
- [ ] No raise from the uncomputable polymorphic `klass` (resolve via source_type).
- [ ] Existing `source_type:` tests (nullTaggedPosts, taggedPosts) still pass.
- [ ] Add a canonical test exercising a scoped polymorphic source (mirror Rails'
      join_model_test / associations fixtures; no bespoke tables).
