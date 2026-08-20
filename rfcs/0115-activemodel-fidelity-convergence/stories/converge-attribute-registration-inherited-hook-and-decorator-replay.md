---
title: "converge-attribute-registration-inherited-hook-and-decorator-replay"
status: ready
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
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
closed-reason: null
---

## Context

`registerWithSuperclass` (`packages/activemodel/src/attribute-registration.ts`)
and `replayOwnPendingDecorators` (same file) are the last two novel/extra
helpers left in that file after the
`converge-attribute-registration-pending-modification-helpers` PR, which
converged `collectPendingModifications` onto Rails'
`apply_pending_attribute_modifications` recursion
(`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:79-86`)
and collapsed the three `pushPending*` helpers into the single Rails append
(`attribute_registration.rb:18-19,26`).

Both were left because each has a concrete blocker rather than being a free
deletion:

- `registerWithSuperclass` stands in for Ruby's `inherited` hook. Rails'
  `reset_default_attributes` walks `subclasses`
  (`attribute_registration.rb:88-91`), which Ruby populates automatically;
  trails' `DescendantsTracker` needs an explicit registration, and CLAUDE.md
  ("Module mixins") records that `inherited` is the one Ruby lifecycle hook
  with no TS equivalent. It is exported from
  `packages/activemodel/src/index.ts` and called from
  `packages/activerecord/src/attributes.ts:178`.
- `replayOwnPendingDecorators` exists for ActiveRecord's STI reflection
  rebuild (`packages/activerecord/src/model-schema.ts:1248`), which rebuilds a
  subclass's `_attributeDefinitions` from the base map and drops decorations
  unless they are replayed. Rails has no counterpart because it rebuilds
  `_default_attributes` from `columns_hash` and replays the whole pending chain
  every time.

## Acceptance criteria

- `registerWithSuperclass` either converges onto a single ratified
  `inherited`-substitute (one spelling repo-wide, cited at the call site) or is
  blocked with the specific blocker via `pnpm tasks block`.
- `replayOwnPendingDecorators` is deleted, with AR's STI reflection rebuild
  routed through `applyPendingAttributeModifications`
  (attribute_registration.rb:79-86) as Rails has it.
- Neither name is exported from `packages/activemodel/src/index.ts`.
- `pnpm parity:api:extra --package activemodel` shows `attribute-registration.ts`
  at 0 novel and `index.ts` down two novel rows.
- Parity deltas non-negative for activemodel and activerecord.
