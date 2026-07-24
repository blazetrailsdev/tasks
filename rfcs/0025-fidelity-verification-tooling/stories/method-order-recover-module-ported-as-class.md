---
title: "Method-order manifest: enforce order for Ruby modules ported as TS classes"
status: claimed
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: 25
pr: null
claim: "2026-07-24T16:00:03Z"
assignee: "method-order-recover-module-ported-as-class"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #5030 (rails-file-structure-method-order per-class keying).

The method-order manifest keys class member order per TS class name and routes
Ruby MODULE methods to the `functions` bucket (`visitModules` in
`scripts/build-rails-file-structure-manifest.ts`). When a Ruby module is ported
as a TS CLASS (rather than top-level `this`-typed / `include()` mixins), its
order lands in `functions`, which no class body reads, and is dropped.

Concrete: `ActiveModel::Type::Helpers::AcceptsMultiparameterTime` (a Ruby
module) is ported as `export class AcceptsMultiparameterTime`
(`packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts`); its
method order is not enforced.

This PR (#5030) makes this visible but does not recover it: the
`RAILS_STRUCTURE_REPORT=1` surface on the CI lint step lists every bucket that
matched no container, including the module-as-class `functions`-dropped entries.
Recovering the order requires knowing the TS class name for a Ruby module, which
api-compare has no map for (it compares per-file, not per-class).

## Acceptance criteria

- [ ] A Ruby module ported as a TS class has its method order enforced on that
      class (not silently dropped into `functions`).
- [ ] Mechanism does not reintroduce ambiguity/collision risk (reuse the
      per-class 1:1 substring-guarded fallback, or a module→class name map).
- [ ] `type/helpers/accepts-multiparameter-time.ts` no longer appears in the
      `RAILS_STRUCTURE_REPORT` unmatched-bucket output for a real drop.
- [ ] The report's remaining entries are genuinely ambiguous cases only
      (e.g. `value.ts` Value→Type/ValueType, `dot.ts` 3-class file).
