---
title: "converge-ar-model-resolution-onto-constantize"
status: ready
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
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

PR #5471 ported `ActiveSupport::Inflector.constantize` / `safeConstantize`
(`vendor/rails/activesupport/lib/active_support/inflector/methods.rb:289,315`).
That made `constantize` a _ported_ method, so the wide call-mismatch ratchet
now sees every Rails body that calls it whose trails counterpart does not.PR PR #5471 baselined 18 such sites (all with per-site reasons) under
`scripts/api-compare/call-mismatches-wide-exclude/`.

Eleven of the eighteen are Active Record resolving a model constant through
its own registry rather than through the inflector — the same underlying
table, reached by a different name:

- `inheritance.ts` — `computeType` (×2), `polymorphicClassFor`, `stiClassFor`
  (`resolveComputedType` / `modelRegistry`, `inheritance.ts:85`)
- `reflection.ts` — `computeClass`
- `core.ts` — `destroyAssociationAsyncJob`
- `base.ts` + `delegated-type.ts` — `defineDelegatedTypeMethods`
- `associations/association.ts` — `raiseOnTypeMismatchBang`
- `associations/builder/belongs-to.ts` — `addCounterCacheCallbacks`

`resolveModel` (`associations.ts:426`) carries an `@internal` note saying it
exists "because ESM has no constant namespace to walk". That is no longer
true — `constantize` is the constant namespace. Rails spells these
`compute_type`'s `candidate.constantize` / `safe_constantize`
(`activerecord/lib/active_record/inheritance.rb:242-265`).

Not in scope: the seven non-AR sites (actionpack/actiondispatch), which
resolve controllers, helper modules, and actionable errors through registries
that are genuinely separate from the model constant table.

## Acceptance criteria

- AR's model-constant resolution goes through
  `ActiveSupport::Inflector.constantize` / `safeConstantize`, spelled the way
  `inheritance.rb:242-265` and `reflection.rb:434,490` spell it.
- `resolveModel` / `lookupModelWithAutoload` either retire or are reduced to
  the registration side, with their `@internal` "no constant namespace"
  justification updated or deleted.
- The corresponding entries are REMOVED from
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/*.json` —
  they are converged, not permanently baselined.
- `pnpm api:compare && pnpm api:extra` clean; AR suite green.
- Namespaced/STI candidate ordering (`resolveComputedType`'s enclosing-module
  candidate list) is preserved — `constantize` is a flat lookup, so the
  candidate loop stays and only the per-candidate resolution changes.
