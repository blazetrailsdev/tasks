---
title: "association-relation.test.ts → canonical (rewrite off synthetic ar_blogs/ar_posts)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the blocked `associations-scope-cache-cluster`.
`associations/association-relation.test.ts` exercises `AssociationRelation`
chaining/validation/inverse semantics on synthetic `ar_blogs`/`ar_posts`
(+ `ar_validated_*`, `ar_strict_*`, `ar_inv_*`) tables. No dedicated Rails file
(behavior maps to `relations_test.rb` AssociationRelation cases).

Blockers to a real canonical conversion:

- `ar_blogs` has no canonical/Rails counterpart (`blogs` is not in Rails
  `schema.rb`); rewrite the owner->collection relationship onto a canonical pair
  such as `Author has_many :posts`.
- `ar_posts.published` (boolean) does not exist on canonical `posts`; re-express
  the `where({ published: true })` assertions using an existing canonical
  column/predicate, or drop the predicate if the assertion doesn't depend on it.
- `eslint-disable` is not acceptable.

## Acceptance criteria

- [ ] Rides canonical tables + models (e.g. `Author`/`Post`) with no synthetic
      `ar_*` tables and no `eslint-disable`.
- [ ] AssociationRelation behavior assertions preserved; test names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from the exclude JSON.
