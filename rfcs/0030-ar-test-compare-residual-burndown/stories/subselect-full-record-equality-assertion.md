---
title: "subselect test: assert full-record equality to match Rails assert_equal (not id-only)"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during PR #3423 (associations-test-canonical-fixtures-convergence).
The converged `subselect` test in
`packages/activerecord/src/associations.test.ts` (describe `AssociationsTest`)
asserts equality by mapping records to ids:

```ts
expect(fav2.map((f: any) => f.id)).toEqual(favs.map((f: any) => f.id));
```

Rails `activerecord/test/cases/associations_test.rb` `test_subselect`
(associations_test.rb:62) compares full records:

```ruby
favs = author.author_favorites
fav2 = author.author_favorites.where(author: Author.where(id: author.id)).to_a
assert_equal favs, fav2
```

The id-only comparison was carried over verbatim from the prior bespoke
`SsAuthor`/`SsAuthorFavorite` test, so the convergence PR did not introduce it,
but it remains a fidelity gap: it would not catch a divergence where the two
relations return the same ids but differently-loaded/attributed records.

## Acceptance criteria

- [ ] `subselect` asserts full-record equality (or AR record `==` semantics)
      matching Rails' `assert_equal favs, fav2`, rather than comparing mapped
      ids — without weakening the existing passing behavior.
- [ ] Test still passes on sqlite, postgres, and mysql lanes.
- [ ] Test name unchanged (`subselect`).
