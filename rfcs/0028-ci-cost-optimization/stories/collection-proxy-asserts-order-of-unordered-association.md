---
title: "collection-proxy.test.ts pins row order of an unordered association SELECT"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 6207
claim: "2026-08-07T22:32:42Z"
assignee: "abstract-adapter-role-shard-cast-hides-ruby-nomethoderror"
blocked-by: null
closed-reason: null
---

## Context

Reproduced on PR #6199's PG lane (run 31217723226, shard 2/2, otherwise green
with 6946 passing): `collection-proxy.test.ts` >
"preserves Relation#values (query state) — proxy.values routes to Relation"
failed with

```text
AssertionError: expected [ 'c', 'a', 'b' ] to deeply equal [ 'a', 'b', 'c' ]
  packages/activerecord/src/associations/collection-proxy.test.ts:157
```

This is a latent test bug, not a pure environment collision. The helper
`authorWithPosts` (`collection-proxy.test.ts:42-50`) creates three posts and
loads the association:

```ts
async function authorWithPosts(): Promise<Author> {
  const author = await Author.create({ name: "Dev" });
  for (const title of ["a", "b", "c"]) {
    await Post.create({ title, body: title, author_id: author.id as number });
  }
  const proxy = association<Post>(author, "posts");
  await proxy.load();
  return author;
}
```

`Author.posts` carries no `-> { order(...) }` scope, so the association's SELECT
has no ORDER BY and PostgreSQL may return the rows in any order — heap order
happens to be insertion order almost always, which is why this passes nearly
every run. The helper's own comment only claims the _set_ is deterministic ("a
fresh author owns only the posts we create here"), never the order, yet several
assertions in the file compare against the ordered literal `["a", "b", "c"]`:
`:130` (`proxy.target.map`), `:157` (`[...proxy].map`), and any sibling doing the
same.

Rails' `has_many :posts` on `Author`
(`vendor/rails/activerecord/test/models/author.rb`) likewise declares no default
order, and Rails' own collection tests that assert membership use
`assert_equal [...].sort` or compare sets rather than pinning row order for an
unordered relation.

## Converged shape

Make the assertions order-insensitive rather than adding an ORDER BY the Rails
association does not have — the point of these tests is CollectionProxy's
array-likeness and Relation delegation, not row order. Sort before comparing
(or compare as sets) at every site in `collection-proxy.test.ts` that maps to
`["a", "b", "c"]`. Do not add an `order` scope to the canonical `Author`/`Post`
models: that would diverge from `test/models/author.rb` and silently change
every other test that reads the association.

Test names must not change (`parity:test` matches on them).

## Acceptance criteria

- [ ] No assertion in `collection-proxy.test.ts` depends on the row order of an
      unordered association SELECT.
- [ ] `Author`/`Post` canonical models are unchanged — no invented `order` scope.
- [ ] Test names unchanged; `pnpm parity:test` delta non-negative.
- [ ] Green on sqlite, `sqlite3_mem`, PG and MariaDB.
