---
title: "Port ExplainProxy so Relation#explain returns the chainable proxy Rails does"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6603
claim: "2026-08-16T18:12:21Z"
assignee: "wave-2c-grouped-calculation-and-query-method-stores"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Relation#explain` (relation.rb:332-334) is one line:

```ruby
def explain(*options)
  ExplainProxy.new(self, options)
end
```

`ExplainProxy` (relation.rb:6-51) is a `:nodoc:` class holding `@relation` and
`@options`, with nine members that each run one operation under EXPLAIN
collection:

- `inspect` (:12-14) — `exec_explain { @relation.send(:exec_queries) }`
- `average` (:16), `count` (:20), `first` (:24), `last` (:28), `maximum` (:32),
  `minimum` (:36), `pluck` (:40), `sum` (:44) — each
  `exec_explain { @relation.<op>(...) }`
- private `exec_explain(&block)` (:48-50) —
  `@relation.exec_explain(@relation.collecting_queries_for_explain { block.call }, @options)`

trails has **no `ExplainProxy` class at all**. `Relation#explain`
(`packages/activerecord/src/relation.ts`) instead eagerly collects over a
trails-only `_execQueriesForExplain` helper and returns the rendered plan
STRING directly. Two consequences:

1. The chainable per-aggregate surface does not exist. `Post.all.explain.count`
   and `.pluck(:id)` / `.sum` / `.first` / `.last` / `.average` / `.maximum` /
   `.minimum` have no trails equivalent — you cannot EXPLAIN an aggregate, only
   the main SELECT.
2. `_execQueriesForExplain` carries a `_loaded` / `_records` snapshot-and-restore
   dance that Rails needs no equivalent of: Rails' proxy calls `exec_queries`
   directly, bypassing the `@records ||= exec_queries` memo in `#records`, so
   `.explain` is naturally side-effect-free on the load cache. The trails helper
   is a workaround for calling the loading path instead.

`explain.test.ts`'s header comment records the divergence
("Our `explain()` resolves to the rendered query-plan string rather than Rails'
chainable proxy, so the per-aggregate tests assert the plan string"), and
`relation.ts` carries a comment at the `_execQueriesForExplain` definition
citing `ExplainProxy` as the reason the restore is needed. Surfaced while
converging `exec_explain` / `build_explain_clause` into the `Explain` mixin
(PR #6598, `converge-explain-exec-and-build-clause-into-one-mixin`), which put
`exec_explain` and `collecting_queries_for_explain` on a shared receiver — the
two calls `ExplainProxy#exec_explain` needs.

## Converged shape

An `ExplainProxy` class in `relation.ts` (Rails keeps it there, nested under
`ActiveRecord`, above `MULTI_VALUE_METHODS`), constructed with `(relation,
options)`. `Relation#explain(*options)` becomes the one-line
`new ExplainProxy(this, options)`.

Its private `execExplain(block)` is
`this._relation.execExplain(await this._relation.collectingQueriesForExplain(block), this._options)`
— both members now resolve on `Relation` through `include(Relation, Explain)`
as of #6598, so no new plumbing is required.

`inspect` runs `exec_queries`; trails' `_execQueriesForExplain` load-cache
snapshot/restore can then be dropped in favour of calling the non-memoizing
path the way Rails does.

Note trails' `explain()` currently returns `Promise<string>`, and every existing
caller/test awaits it. A proxy object is not a string, so the port needs a
decision on how the terminal render is spelled — Ruby reaches it through
`inspect` in the console; trails will likely need the proxy to be thenable (as
`Relation` already is via `relation/thenable.ts`) so `await rel.explain()`
keeps working while `rel.explain().count()` becomes available.

## Acceptance criteria

- [ ] `ExplainProxy` exists in `relation.ts` with all nine members of
      relation.rb:6-51, at the Rails names and in Rails source order.
- [ ] `Relation#explain` is `new ExplainProxy(this, options)` (relation.rb:333).
- [ ] `ExplainProxy`'s private `execExplain` matches relation.rb:48-50, reaching
      `execExplain` / `collectingQueriesForExplain` through the `Explain` mixin.
- [ ] `_execQueriesForExplain` and its load-cache snapshot/restore are gone.
- [ ] `explain_test.rb`'s per-aggregate tests exercise the proxy members rather
      than asserting the main-SELECT plan string; the divergence note at the top
      of `explain.test.ts` is deleted.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative;
      `pnpm parity:api:calls` / `:args` clean.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
