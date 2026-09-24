---
title: "Call touchAttributesWithTime on the class in CounterCache#resetCounters"
status: ready
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: 43
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CounterCache::ClassMethods#reset_counters` touches with
`touch_updates = touch_attributes_with_time(*names, **options)`
(`vendor/rails/activerecord/lib/active_record/counter_cache.rb:65`). That is a bare self-call on the model class. `touch_attributes_with_time` is `Timestamp::ClassMethods`, which reaches the class through the concern's `extend`.

trails' `resetCounters` (`packages/activerecord/src/counter-cache.ts:107`) still calls it as a free function:

```ts
const touchUpdates = touchAttributesWithTime.call(this, ...(names as string[]), touchOptions.time);
```

Until trails#8011 there was nothing else to call. `Base` did not carry `touchAttributesWithTime`, so `.call(this)` was the only way to reach it. trails#8011 added `extend(Base, { touchAttributesWithTime: Timestamp.touchAttributesWithTime })` plus `declare static touchAttributesWithTime` (`base.ts`), and converged the two relation.ts sites (`Relation#touchAll`, `relation.rb:969`, and the `update_counters` touch) onto `this.model.touchAttributesWithTime(...)`. The `counter-cache.ts` site is the one left.

Converged shape: `const touchUpdates = this.touchAttributesWithTime(...(names as string[]), touchOptions.time);`. Then drop the `touchAttributesWithTime` import from `./timestamp.js` if nothing else in the file uses it.

## Acceptance criteria

- [ ] `counter-cache.ts` reaches `touchAttributesWithTime` through `this` (the class), matching `counter_cache.rb:65`, not through `.call(this)`.
- [ ] The call-args report no longer has the `ref:call` row for this site. `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` stay green.
- [ ] `reset_counters` with `touch:` tests pass (`counter-cache.test.ts`).
