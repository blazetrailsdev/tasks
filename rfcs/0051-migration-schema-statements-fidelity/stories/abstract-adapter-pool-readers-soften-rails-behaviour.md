---
title: "abstract-adapter-pool-readers-soften-rails-behaviour"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6188
claim: "2026-08-07T17:21:52Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: null
closed-reason: null
---

## Context

`abstract-adapter-pool-is-typed-unknown` typed `AbstractAdapter#pool` as
`ConnectionPool | NullPool` and deleted the casts. Typing it exposed three
readers that soften or invent behaviour Rails does not have; all three were kept
(that story was explicitly no-behaviour-change) with the Rails citation at the
call site:

- `role` / `shard` (`abstract-adapter.ts`): Rails is a bare `@pool.role` /
  `@pool.shard` (`abstract_adapter.rb:288,294`). `NullPool` defines neither
  (`abstract/connection_pool.rb:14-51`), so Rails raises NoMethodError on a
  standalone adapter; trails substitutes `"writing"` / `"default"`.
- `isReplica`: Rails reads only `@config[:replica]`
  (`abstract_adapter.rb:199`); trails checks `pool.dbConfig.replica` first.
- `isPreventingWrites`: Rails is
  `connection_descriptor.current_preventing_writes`
  (`abstract_adapter.rb:227-233`); trails walks `connectedToStack()` itself and
  reads `pool.poolConfig.connectionDescriptor.name`.

Also: `ConnectionPool#remove` resets `conn.pool` (to a `NullPool` since that
story); Rails' `remove` (`abstract/connection_pool.rb:593`) leaves it alone.

## Acceptance criteria

- [ ] Each reader either converges on its Rails body or the deviation is
      registered with a language/runtime reason — no bare softening left
      undecided.
- [ ] The standalone-NullPool path is settled: either trails stops constructing
      adapters that outlive a pool, or the fallback is justified once, in one
      place, rather than per reader.
