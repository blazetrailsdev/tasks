---
title: "activemodel: a cast attribute read still builds a closure and a block wrapper on a cache hit"
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `attribute-reads-allocate-a-block-on-every-cache-hit` (trails PR 8540). That PR took the
cost of `block()` out of every attribute read: `block()` no longer redefines `length` per call, and
`fetch` answers a plain-hash hit before dispatching (`packages/ruby-compat/src/hash.ts`). It left
`LazyAttributeSet#fetchValue` (`packages/activemodel/src/attribute-set/builder.ts:85-117`) exactly as
Rails writes it, `@casted_values.fetch(name) { ... }`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:41-58`).

Measured in plain node against the built `dist`, 100,000 `fetchValue("id")` calls on already-cast
`LazyAttributeSet`s, best of 20:

|                                                  | before PR 8540 | after PR 8540 |
| ------------------------------------------------ | -------------- | ------------- |
| cast attribute (lazy hit path)                   | 80.2 ms        | 14.5 ms       |
| materialized attribute (`@attributes[name]` hit) | 10.7 ms        | 9.4 ms        |

The parent story asked for a cast read at or under the `9e17ddc98d` figure. `fetchValue` and
`block()` are identical at `9e17ddc98d`, so that figure is taken to be the materialized path, about
10.7 ms here. The lazy hit path is still about 1.35x that.

What remains is what JS builds before `fetch` is called: the outer closure (about 30 ns) and the
`block()` wrapper (about 30 ns). MRI allocates neither on a hit. Variants measured and rejected in
PR 8540: marking the function in place instead of wrapping (11.3 ms, and it changes what
`rbBlockGivenP` answers for a function reused as a positional value), dropping `fetch`'s rest
parameter (no gain), a plain-object path in `hashAref` (speeds the materialized path, not this one).
A key test in `fetchValue` ahead of the `fetch` call measured 8.0 ms, and is an arm Rails does not have.

The benchmark is `packages/activemodel/src/attribute-set/builder.bench.ts`.

## Acceptance criteria

- [ ] `100,000 reads of a cast attribute` in `builder.bench.ts` is at or under
      `100,000 reads of a materialized attribute`, or the story is blocked with the measured floor.
- [ ] `fetchValue` keeps Rails' control flow, or any added arm carries its receipt and the decision
      that allows it is recorded.
- [ ] `Story.all()` load time and the read loop are re-measured on trailmap against `9e17ddc98d`.
