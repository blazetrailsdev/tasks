---
title: "CollectionProxy#length is an async method, so .length > 0 in a template is silently always false"
status: claimed
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: 18
pr: null
claim: "2026-08-31T21:45:19Z"
assignee: "session-and-flash-lifecycle"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#length` is an async method, mirroring Ruby's `length`. In a
`.tse` template that reads as a truthy function rather than a number, so the
natural guard silently does the wrong thing:

```tse
<% if (tweet.hashtags.length > 0) { %>   <%# always false: function > 0 %>
```

Confirmed against a loaded association in `examples/twitter-app`:

```text
typeof: object | isArray: false
length: [AsyncFunction: length] | map: [ 'computing', 'math' ]
awaited length: 2
```

`map`, `filter`, `forEach`, `some` and friends resolve synchronously off the
loaded targets (`packages/activerecord/src/associations/collection-proxy.ts`,
the array-delegation block), so only `length` — the one name that is also a
JS array property — misbehaves. Rails has no such collision: `length` is a
method there too, and Ruby has no property/method ambiguity
(`activerecord/lib/active_record/associations/collection_proxy.rb`, `#length`
delegating to `load_target.length`).

The example app works around it with `tweet.hashtags.map((t) => t)` and a
comment, in `examples/twitter-app/src/app/views/tweets/_tweet.html.tse`.

This is the Ruby-idiom class CLAUDE.md warns about — "a Ruby predicate returns
a value, not necessarily a boolean" — applied to a property/method collision,
and it is worth an entry in `docs/ruby-ts-conventions.md` even if the runtime
shape stays as it is.

## Converged shape

Either a synchronous `length` getter over the loaded target (with the async
count staying as `size`/`count`, matching Rails' `size` vs `count` split), or
a documented convention plus a lint rule that flags `.length` on a known
CollectionProxy expression.

## Acceptance criteria

- Reading `.length` on a loaded association in a template gives the number of
  loaded records, or fails loudly rather than silently reading as truthy.
- `docs/ruby-ts-conventions.md` records the collision.
- `examples/twitter-app` drops the `map((t) => t)` workaround.
