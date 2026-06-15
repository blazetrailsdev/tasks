---
title: "columnshash-empty-after-aliased-hash-select"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
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

Surfaced by RFC 0030 story `b3-relation-select-joins` (PR #3416) while
un-skipping `relation/select.test.ts` _select with hash and table alias_.

Resolving an aliased-table hash select — e.g.
`Post.select({ commentsWithExtend: { body: :x } }).toSql()` (a hash key that is an
association whose table differs from / aliases another join's table) — corrupts a
_same-table_ model's lazy column load: a subsequent first call to
`PostWithDefaultSelect.columnsHash()` (table `posts`) returns **0 columns**, even
though the connection's schema cache still reports the 12 `posts` columns
correctly. The model then falls through to the synthesized-attribute branch and
emits an **unqualified** projection (`SELECT title` instead of
`SELECT "posts"."title"`).

Reproduced with the PR's source changes reverted, so this is pre-existing and
independent of the per-join aliasing work — the new test merely exercises it.
Current mitigation in `select.test.ts` is a `beforeAll` warm-up
(`PostWithDefaultSelect.columnsHash()`); a model whose `columnsHash()` returns
empty after an aliased hash select is a correctness bug that would also surface
outside tests on any lazy first-load that happens post-alias.

trails: `packages/activerecord/src/model-schema.ts` `columnsHash`/`loadSchema`
(the `getCachedColumnsHash(table)` lookup returns undefined → synthesized
fallback), `packages/activerecord/src/table-metadata.ts` `associatedTable`
(invoked while resolving the aliased hash key), and the predicate-builder
`resolveArelAttribute` path.

## Acceptance criteria

- [ ] After resolving an aliased-table hash select, a fresh
      `columnsHash()`/`loadSchema()` on a same-table model returns the table's real
      columns (qualified projection), not an empty hash.
- [ ] Remove the `PostWithDefaultSelect.columnsHash()` warm-up in
      `select.test.ts` `beforeAll`; _reselect with default scope select_ still
      passes in full-file order against canonical SQLite (and PG/MySQL per gate).
- [ ] Add a focused regression test reproducing the corruption (aliased hash
      select followed by a same-table model's first `columnsHash()` load).
