---
title: "rbCallSuper stops being a hot cost in the init_internals chain"
status: draft
updated: 2026-10-31
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On the `/feed` benchmark of `examples/twelve-dollar-server` (profile taken 2026-10-30, after trails#9482), `rbCallSuper` (`packages/ruby-compat/src/include.ts:1663`) is 3.3% of self time, and 1.4% on `/posts/250000`. About 80% of those samples are `initInternals`, run per record built: `persistence`, `timestamp`, `autosave-association`, `attribute-methods/dirty`, activemodel `dirty`, `transactions`, `associations` and `touch-later`. Rails has the same chain of `init_internals` defs (for example `activerecord/lib/active_record/core.rb:834`, `persistence.rb:814`, `activemodel/lib/active_model/dirty.rb:372`), but Ruby's `super` is an inline-cached call. Each `rbCallSuper` here does a `WeakMap`-style `superSlots.get`, a `Reflect.get` and a `.apply` with rest args.

`Base`'s includers are the closed framework set for these modules except where CLAUDE.md § "A module included by an open set of classes binds `super` at include time" applies (`ActiveModel::Dirty`, `Validations`), so check per module which rule governs before changing it.

## Acceptance criteria

- `rbCallSuper`'s per-call cost falls, by a faster dispatch in ruby-compat, by inlining `init_internals` on `Base` where the module's includers are closed (§ "A module method's `super` is inlined the same way"), or both, with no behaviour change to `super` order.
- `rbCallSuper` is at most 1% of `/feed` self time on the same profile.
- `/feed` CPU per request does not regress; a perf-only shape carries a `@perf` tag with the measurement.
- `init_internals` runs each Rails body once, in Rails' ancestor order, covered by a test.
