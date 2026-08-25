---
title: "test: rewrite faithless 'deleting models with composite keys' + 'sharded deleting models' as canonical Rails ports"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3739
claim: "2026-06-20T19:58:04Z"
assignee: "hm-composite-sharded-delete-tests-faithful-port"
blocked-by: null
---

## Context

While fixing `hm-delete-records-composite-pk-cartesian-product` (PR #3731), two
existing tests in
`packages/activerecord/src/associations/has-many-associations.test.ts` were
found to be faithless stubs whose bodies do NOT match their Rails-derived names:

- `it("deleting models with composite keys")` (~line 3715) — Rails
  `has_many_associations_test.rb:1294 test_deleting_models_with_composite_keys`
  uses `cpk_authors(:cpk_great_author).books.delete(...)` on a composite-PK
  model. The TS stub instead declares bespoke single-column `CompKeyAuthor`/
  `CompKeyPost`, `destroy()`s one row, and asserts `length === 0`. No composite
  key is exercised.
- `it("sharded deleting models")` (~line 3738) — Rails
  `has_many_associations_test.rb:1306 test_sharded_deleting_models` deletes TWO
  composite-PK `sharded_comments` and asserts the generated SQL is an
  OR-of-AND tuple form (`(blog_id = .. AND id = ..) OR (..)`), then reload size.
  The TS stub uses bespoke single-column `ShardAuthor`/`ShardPost`, destroys one
  row, asserts `length === 0`. The SQL-shape assertion and composite key are
  absent.

Both masked the cartesian-product bug PR #3731 fixed. They also use bespoke
inline models (the file is grandfathered in
`eslint/require-canonical-schema-exclude.json`).

## Acceptance criteria

- [ ] Rewrite `deleting models with composite keys` to mirror Rails
      `test_deleting_models_with_composite_keys` using canonical `CpkAuthor`/
      `CpkBook` + cpk fixtures (great_author has 2 books; delete one; reload;
      assert 1 remains).
- [ ] Rewrite `sharded deleting models` to mirror Rails
      `test_sharded_deleting_models` using canonical `Sharded*` models + fixtures,
      including the OR-of-AND tuple SQL-shape assertion (capture SQL) and the
      reload size check.
- [ ] Do not rename the `it(...)` titles (they match Rails verbatim).
- [ ] Keep changes scoped; full canonical conversion of the whole file +
      dropping its exclude entry is RFC 0019 and out of scope here.
