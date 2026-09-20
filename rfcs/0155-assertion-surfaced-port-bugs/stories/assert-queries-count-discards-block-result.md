---
title: "assert-queries-count-discards-block-result"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the abstract_mysql_adapter assertion tail
(trails#7905), which fixed the same divergence in the sibling helper.

`assertQueriesCount` (`packages/activerecord/src/testing/query-assertions.ts:44`)
awaits its block for side effects only and returns `Promise<void>`:

```ts
export async function assertQueriesCount(
  count: number | undefined,
  includeSchema = false,
  fn: () => void | Promise<void>,
): Promise<void> {
  const counter = new SQLCounter();
  await Notifications.subscribed(counter, "sql.active_record", async () => {
    await fn();
    ...
  });
}
```

Rails binds the block's value BEFORE asserting and returns it after
(`activerecord/lib/active_record/testing/query_assertions.rb:20-31`):

```ruby
result = _assert_nothing_raised_or_warn("assert_queries_count", &block)
queries = include_schema ? counter.log_all : counter.log
if count
  assert_equal count, queries.size, "..."
else
  assert_operator queries.size, :>=, 1, "..."
end
result
```

So `assert_queries_count(1) { Post.first }` evaluates to the post in Rails
and to `undefined` in trails.

trails#7905 already fixed the identical divergence in `assertQueriesMatch` /
`assertNoQueriesMatch` (`query_assertions.rb:59-88`), so the shape to copy
is in the same file: make the helper generic over `fn: () => T | Promise<T>`,
bind `const result = await fn()` first, and `return result` after the
assertions. `Notifications.subscribed<T>`
(`packages/activesupport/src/notifications.ts:86-104`) already returns the
block's value, so no plumbing is needed.

`assertNoQueries` (`query-assertions.ts:68`) must propagate it too, as Rails'
`assert_no_queries` does by falling through to `assert_queries_count`
(`query_assertions.rb:42-44`).

Left out of trails#7905 deliberately: that PR's story scope was the
abstract_mysql_adapter assertion tail, and `assertQueriesCount` is not
reached by any test it touched.

## Acceptance criteria

- [ ] `assertQueriesCount` is generic over its block's return type, binds the
      result before asserting, and returns it after — mirroring
      `query_assertions.rb:20-31`.
- [ ] `assertNoQueries` propagates that value (`query_assertions.rb:42-44`).
- [ ] Existing callers (which ignore the result) still compile and pass; the
      change is a return-type widening, as it was for `assertQueriesMatch`.
