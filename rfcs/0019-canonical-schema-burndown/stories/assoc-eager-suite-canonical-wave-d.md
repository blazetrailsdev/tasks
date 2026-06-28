---
title: "assoc-eager-suite-canonical-wave-d"
status: ready
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Continuation of `assoc-eager-suite-canonical-wave-c` (RFC 0019). Wave C PR converted
4 bespoke inline-class tests in `EagerAssociationTest`
(`packages/activerecord/src/associations/eager.test.ts`) to canonical models:

- `eager association loading with explicit join` (EjAuthor/EjPost → Post + joins, Rails eager_test.rb:588)
- `eager with invalid association reference` (EagerWidget → Post)
- `eager with valid association as string not symbol` (EagerNode/EagerEdge → Post)
- `count with include` (EagerCountPost/Comment → authors(:david).postsWithComments)

and removed the `ej_authors`, `ej_posts`, `eager_widgets`, `eager_nodes`, `eager_edges`,
`eager_count_posts`, `eager_count_comments` entries from the file-local `TEST_SCHEMA`.

Roughly 60+ bespoke inline classes still remain in the same file and `TEST_SCHEMA` is
still present. Remaining clusters (all in `EagerAssociationTest`, first describe block):

- `EagerInvParent/EagerInvChild` — "should work inverse of with eager load"
- `EjBtAuthor/EjBtPost`, `EjHoUser/EjHoProfile`, `EjEmAuthor/EjEmPost` — the 3 trails-only
  (non-Rails) explicit-join proxy-loaded tests (~734–831); decide whether to converge onto
  canonical Post/Author/Comment or delete as deviations.
- `ExSugTagging/ExSugPost` — "exceptions have suggestions for fix" (not a Rails test name)
- `EagerHmtOrd*`, `EagerHmtMo*` — has-many-through-with-order tests
- `EagerLeo*`, `EagerLmo*`, `EagerLn*` — limited-eager tests (Rails eager_test.rb:976–1019;
  real Rails versions use Post+author+comments fixtures and UPPER(posts.title) ordering /
  Person number1_fan — converting may surface impl gaps, accept skips + un-skip follow-up)
- `EagerMultiHo*`, `EagerMultiBt*` — multiple-associations-same-table tests
- `EagerPk*`, `EagerEmptyBt*`, `EagerReord*`, `StiShareComment/Post`, etc. — misc tests
- `Sg*` shared classes (lines ~241–345) + `seedSponsors()` — polymorphic guard tests

Final wave must also: remove `defineSchema(TEST_SCHEMA)` from `beforeAll`, delete the
`TEST_SCHEMA` constant, and drop `eager.test.ts` from `eslint/require-canonical-schema-exclude.json`.

Key Rails reference: `vendor/rails/activerecord/test/cases/associations/eager_test.rb`.

## Acceptance criteria

- All remaining bespoke `Eager*`/`Ej*`/`Sg*`/`Ex*` inline classes in `EagerAssociationTest`
  converted to canonical models + fixture data (or deleted, for trails-only deviation tests).
- `defineSchema(TEST_SCHEMA)` removed from `beforeAll`; `TEST_SCHEMA` constant removed.
- `eager.test.ts` removed from `eslint/require-canonical-schema-exclude.json`.
- All tests pass (202 total, same skip count) — or net skip delta documented with un-skip story.
- LOC ≤ 500 per PR; multiple waves allowed.
- Test names match Rails verbatim; camelCase; no node:_/process._; async fs only.
