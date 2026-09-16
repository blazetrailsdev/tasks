---
title: "converge-model-mixin-plumbing-surface"
status: ready
updated: 2026-09-15
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
closed-reason: null
---

## Context

Split out of `fold-receipted-activerecord-root-and-adapter-names-remainder`, whose
PR converged `parseTouchArgs` / `parseTouchAllArgs` / `parseCounterCacheTouch`
(onto `extract_options!` — persistence.rb:793, relation.rb:969, touch_later.rb:38,
counter_cache.rb:61-66), deleted the callerless `savepoint`, and moved
`DisallowedClass` (a `Psych` class, not a Rails one) to `activesupport/src/yaml.ts`.
That story carried ~50 receipts across 29 files; this one owns the subset below.

Each name still carries
`@noRailsEquivalent CONVERGEABLE converge-model-mixin-plumbing-surface`: live trails surface with no
Rails `def` behind it. Each must either fold into the Rails method its callers
stand in for (citing the `vendor/rails` `file:line`) or be renamed to the Rails
spelling.

## Sites

- `packages/activerecord/src/aggregations.ts`
- `packages/activerecord/src/enum.ts`
- `packages/activerecord/src/association-cache.ts`
- `packages/activerecord/src/multiparameter-attribute-assignment.ts`
- `packages/activerecord/src/model-codegen.ts`
- `packages/activerecord/src/encryption-hooks.ts`
- `packages/activerecord/src/disable-joins-association-relation.ts`

Model-side plumbing with no Rails `def`. Most are trails' stand-in for a Ruby
`include`, which CLAUDE.md § "Module mixins" settles as `include()` /
`Included<>` or `this`-typed functions — not a bespoke `includeX(modelClass)`
installer:

- `aggregations.ts` `includeAggregations` — Rails is `include Aggregations`
  (`base.rb:334`); `aggregations.rb` has no such method.
- `enum.ts` `defineEnum` — Rails' `enum` (`enum.rb:171-232`) is the whole entry
  point.
- `association-cache.ts` `AssociationCache` / `AssociationCacheFacet` / `has` —
  Rails' `@association_cache` is a plain Hash
  (`core.rb:507`, `associations.rb:262-284`).
- `multiparameter-attribute-assignment.ts` `extractMultiparameterCallstack` and
  its sibling — Rails' `MultiparameterAssignment` splits at
  `attribute_assignment.rb:30-45`.
- `model-codegen.ts` `unqualify` / `generateModels` — trails-only codegen; check
  whether it belongs in a Rails-mirrored file at all.
- `encryption-hooks.ts` `encryptionHooks` — Rails wires encryption through
  `ActiveRecord::Encryption::EncryptableRecord` on load hooks.
- `disable-joins-association-relation.ts` `deferred` — see CLAUDE.md
  § "`Relation` is evaluated by an async query" before deciding; it may be a
  PERMANENT receipt rather than a convergence.

## Acceptance criteria

- Every receipted name listed above is deleted (callers moved onto the Rails
  method) or renamed to the Rails spelling, with its receipt removed in the same
  change.
- `git grep converge-model-mixin-plumbing-surface` returns nothing.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
