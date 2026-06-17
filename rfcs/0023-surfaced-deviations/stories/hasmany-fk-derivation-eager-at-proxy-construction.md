---
title: "has_many FK derivation raises eagerly at proxy construction, not at load like Rails"
status: ready
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Discovered while porting `test_query_constraints_over_three_without_defining_explicit_foreign_key_query_constraints_raises` in PR #3570 (RFC 0019 wave 5).

In Rails (`associations_test.rb:244`), a `has_many` whose owner has a 3-attribute
query-constraints list (so the FK cannot be derived) raises `ArgumentError`
("The query constraints list on the `...` model has more than 2 attributes...")
only when the association is **loaded** (`blog_post.comments_without_query_constraints.to_a`).

In trails the same error surfaces **eagerly at proxy construction**:
`HasManyReflection.get foreignKey` is called inside `buildHasManyRelation` →
`new CollectionProxy` (collection-proxy.ts:434), which runs the moment the
association accessor is read (`blogPost.commentsWithoutQueryConstraints`),
before any `.to_a`/await. The wave-5 test documents this and asserts the throw
on the accessor itself (`expect(() => blogPost.commentsWithoutQueryConstraints).toThrow(...)`).

Stack at throw: reflection.ts:733 (deriveFkQueryConstraints) ← :706
(computeForeignKey) ← :691 (get foreignKey) ← associations.ts:1631
(computeHasManyWhere) ← :1686 (buildHasManyRelation) ← collection-proxy.ts:434.

trails: `packages/activerecord/src/reflection.ts`,
`packages/activerecord/src/associations/collection-proxy.ts`,
`packages/activerecord/src/associations.ts`
Rails: `vendor/rails/activerecord/test/cases/associations_test.rb:244`

## Acceptance criteria

- [ ] Decide whether to defer `foreignKey` derivation in the has_many path so
      the underivable-FK ConfigurationError raises at load time (`.toArray()` /
      await), matching Rails, rather than at proxy construction.
- [ ] If converged, update the wave-5 test
      (`query constraints over three without defining explicit foreign key query
constraints raises`) to assert the throw on load instead of on the accessor,
      and drop the divergence note in its comment.
- [ ] If ratified as an intentional deviation, document it in the surfaced-
      deviations ledger with the rationale (per deviation policy: prefer converge).
