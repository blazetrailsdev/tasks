---
title: "converge-activerecord-remainder-moved-relocations"
status: closed
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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
closed-reason: "all 17 names converged in trails#7730 during review; no receipt cites this story"
---

## Context

`receipt-moved-activerecord-remainder` (trails, RFC 0130) burnt the remainder area's
moved extras to 0. Most names resolved by deletion, relocation, an extractor credit
(`OPERATOR_SPELLING_BY_FQN`), or a ratified `PERMANENT` receipt. This story holds the
residue: names whose Rails home is a DIFFERENT `.rb`, where the relocation is a real
move with call-site churn that did not fit that PR's 700-LOC ceiling. Each carries a
`@noRailsEquivalent CONVERGEABLE converge-activerecord-remainder-moved-relocations`
receipt at its declaration today; converging one means moving it and DELETING the
receipt.

Per name, with the Rails `file:line` that owns it:

- `packages/activerecord/src/timestamp.ts` `touch` — Rails defines `touch` at
  `activerecord/lib/active_record/persistence.rb:793`, not in `timestamp.rb`
  (`ActiveRecord::Timestamp` has no `touch`). Move to `persistence.ts`; the
  `no_touching.rb:61` / `callbacks.rb:431` / `transactions.rb:368` / `touch_later.rb:38`
  overrides already sit in their own files.
- `packages/activerecord/src/timestamp.ts` `touchAll` — Rails' `touch_all` is
  `relation.rb:969`, reaching `Base` through `querying.rb:5-23`'s `QUERYING_METHODS`
  delegate list. Move to `relation.ts` and delegate.
- `packages/activerecord/src/persistence.ts` `clone` — Ruby's copy hook is
  `initialize_copy`, defined at `core.rb:452`, not in `persistence.rb`. Move to
  `core.ts`.
- `packages/activerecord/src/scoping.ts` `scopeFor` — `scoping.rb` declares no
  `scope_for`; `MacroReflection#scope_for` is `reflection.rb:326`. Fold the call site
  onto `ScopeRegistry.currentScope` and delete the wrapper.
- `packages/activerecord/src/validations.ts` `readAttributeForValidation` — Rails
  aliases it to `send` at `activemodel/lib/active_model/validations.rb:437` and
  ActiveRecord does not override it. The trails override exists to return a loaded
  collection proxy's target; decide whether that belongs in `activemodel`'s alias or
  can be dropped once collection reads go through the reader.
- `packages/activerecord/src/query-logs.ts` `updateContext` — `query_logs.rb` has no
  `update_context`; Rails writes the context through
  `ActiveSupport::ExecutionContext.set` (`activesupport/lib/active_support/execution_context.rb`).
  Route the call site there. `clearContext` is the same `_context` seat and is owned by
  `converge-receipted-activerecord-root-and-adapter-names`, so converge the two together
  or that story's name is left pointing at a field this one deleted.
- `packages/activerecord/src/runtime-registry.ts` `stats` — `runtime_registry.rb:9-66`
  exposes four counters (`sql_runtime`, `async_sql_runtime`, `queries_count`,
  `cached_queries_count`) and their writers, backed by `IsolatedExecutionState`; there is
  no holder object and no `stats`. Replacing it means dismantling the `Stats` class,
  which `converge-receipted-activerecord-root-and-adapter-names` owns — so that story
  goes first, or the two land together.

## Acceptance criteria

- Each name above is either moved to the TS file mirroring the Rails `.rb` that owns
  it, or deleted, and its `@noRailsEquivalent CONVERGEABLE
converge-activerecord-remainder-moved-relocations` receipt is deleted with it.
- `pnpm parity:api:extra --package activerecord` reports no row for any of them and no
  STALE tag; `pnpm parity:api:extra:tighten` writes activerecord's `total` DOWN in the
  same PR.
- `pnpm parity:api:extra:gate` and `pnpm parity:api:calls` stay green.
- Split across PRs if the whole set exceeds the LOC ceiling — file the remainder as a
  sibling story rather than stacking.
