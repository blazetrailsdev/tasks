---
title: "excluding-always-spawns-no-empty-short-circuit"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6672
claim: "2026-08-17T22:06:05Z"
assignee: "converge-lock-value-stores-locks-not-clause-string"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review on #6618 (`inline-relation-where-family-private-helpers`), where
inlining `_excludingArgs` duplicated the divergence from one body into two.

`packages/activerecord/src/relation.ts` — `excluding` and `without` both short-circuit:

```ts
if (combined.length === 0) return this;
return this._clone().excludingBang(combined);
```

Rails has no such guard (`query_methods.rb:1574-1584`):

```ruby
spawn.excluding!(records + relations.flat_map(&:ids))
```

`spawn` always answers a NEW relation, and `excluding!` (`query_methods.rb:1587-1591`)
always appends `predicate_builder[primary_key, records].invert` — with an empty
`records` array that is a vacuously-true predicate, but the relation is still a distinct
object carrying a distinct `where_clause`.

trails returns the RECEIVER instead, so `Post.excluding()` is `Post.all`-identical
rather than a spawned copy, and the WHERE predicate Rails adds is missing. The
divergence is observable through object identity (a caller mutating the result mutates
the receiver's scope) and through `where_clause`/`to_sql` on the empty-argument path.
Predates #6618; `excluding_test.rb:96-102` only asserts the result set, which is
unchanged either way, so no test currently pins it.

## Acceptance criteria

- [ ] `excluding` and `without` always spawn, per `query_methods.rb:1580` — no
      `combined.length === 0` early return.
- [ ] The empty-argument path appends the same inverted predicate Rails does, so
      `Post.excluding().toSql()` matches Rails.
- [ ] `excluding.test.ts` keeps its Rails test names and passes; add coverage for the
      spawn identity on the empty-argument path.
- [ ] `pnpm parity:api:calls` / `:args` green.
