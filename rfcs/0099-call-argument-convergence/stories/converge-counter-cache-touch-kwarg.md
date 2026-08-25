---
title: "Converge CounterCache's class-level touch kwarg into the counters hash"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6409
claim: "2026-08-12T12:26:11Z"
assignee: "call-args-ar-extra-argument-rest-2"
blocked-by: null
closed-reason: null
---

# Converge CounterCache's class-level touch kwarg into the counters hash

## Context

Surfaced while converging `Relation#updateCounters` in PR #6398 (RFC 0099
bucket (a)). That PR removed the invented second `options` parameter from
`Relation#updateCounters` so `:touch` travels inside the counters hash, as it
does in `vendor/rails/activerecord/lib/active_record/relation.rb:926-927`:

```ruby
def update_counters(counters)
  touch = counters.delete(:touch)
```

The CLASS-level surface in `counter-cache.ts` still carries the deviation. It
takes a third `options: { touch }` parameter that Rails does not have:

- `updateCounters(this, id, counters, options?)` — Rails is
  `update_counters(id, counters)` (`counter_cache.rb:115-118`), with `:touch`
  a key of `counters`.
- `incrementCounter(this, counterName, id, by, options?)` and
  `decrementCounter(...)` forward it as a third argument. Rails takes `by:` and
  `touch:` as kwargs and folds `touch` into the hash it builds:
  `update_counters(id, counter_name => by, touch: touch)`
  (`counter_cache.rb:148-149`, and the same shape at `:171-172`).
- `persistence.ts:507` (`increment!`) calls it with the same third argument;
  Rails' `increment!` is
  `self.class.update_counters(id, attribute => change, touch: touch)`
  (`persistence.rb:227-236`).

The reviewer on #6398 confirmed the shape difference and scoped it out of that
PR as pre-existing.

### Converged shape

Drop the third parameter from `updateCounters`, `incrementCounter` and
`decrementCounter`; keep `by`/`touch` as the kwargs Rails declares on
increment/decrement, and have those two build the single hash
`{ [counterName]: by, touch }` the way Rails does. `Relation#updateCounters`
already shifts `touch` back off, so no change is needed below the class level.

Watch the two callers that motivated the #6398 CI failure: an untyped
(`any`) receiver means a stale extra argument is dropped silently rather than
caught by `tsc`. Grep for two-argument `updateCounters(` call sites, not just
the name.

## Acceptance criteria

1. `CounterCache.updateCounters` / `incrementCounter` / `decrementCounter`
   take the arguments Rails takes, verified against `counter_cache.rb:115,148,171`.
2. `persistence.ts`'s `increment!`/`decrement!` build the merged hash as
   `persistence.rb:227-236` does.
3. Every call site is updated — including untyped (`any`) receivers, which
   `tsc` will not flag.
4. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; any
   baseline row this converges is deleted by hand (only-shrink, never
   `--write`).
5. `counter-cache.test.ts`, `persistence.test.ts` and
   `belongs-to-associations.test.ts` pass on all three adapters.
