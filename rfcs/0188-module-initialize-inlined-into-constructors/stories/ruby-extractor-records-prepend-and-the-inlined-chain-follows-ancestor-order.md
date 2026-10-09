---
title: "api-compare: the Ruby extractor records prepend edges and the inlined chain follows the class's ancestor order"
status: draft
updated: 2026-10-09
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8727 builds the Rails chain a constructor answers to in `scripts/api-compare/inlined-bodies.ts` (`inlinedSegments`): tagged `ClassMethods#new`, the class's own `initialize`, same-file modules' `initialize`, then tagged `initialize` bodies in tag order. Two things keep that from being Ruby's real ancestor order:

- `scripts/api-compare/extract-ruby-api.rb` records `include` and `extend` edges but no `prepend` edge at all, so `sameFileInitializeModules` cannot see a prepended module. Ruby runs a prepended module's `initialize` BEFORE the class's own. Vendored Rails has cross-file cases, e.g. `prepend QueryCache::ConnectionPoolConfiguration` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:218`) and `prepend Flash::RequestMethods` (`actionpack/lib/action_dispatch/middleware/flash.rb:316`).
- Same-file segments are always placed before every tagged `initialize`, rather than at the position the module holds among the class's ancestors. The call SET is unaffected; `reorderedCalls` in `compare.ts`, which reads the chain's order, can be.

## Acceptance criteria

- The Ruby extractor records `prepend` edges on a class/module (a `prepends` list beside `includes`), with a test.
- The chain is ordered by the Rails class's ancestors: prepended modules (last `prepend` first), the class's own `initialize`, then included modules (last `include` first), each followed by its own includes. A same-file module joins untagged; a cross-file one joins only where a tag names it.
- A tag naming a module that is not among the class's ancestors still reds (owned by `inlined-from-staleness-gate-both-directions`; do not duplicate it).
- Tests cover: a prepended same-file module ahead of the class's own body; a same-file module between two tagged ones.
- `parity:api:calls` and `parity:api:calls:args` stay green with no baseline edits, or each new row is named.
