---
title: "method-order report: separate structurally-unenforceable mixin shapes from recoverable drops"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #5231 (method-order: enforce order for Ruby mixin
modules ported as TS classes). That PR eliminated the _recoverable_ module-as-
class drops (`Foo::InstanceMethods`/`Foo::ClassMethods` of a class →
`AcceptsMultiparameterTime`). After it merged, the `RAILS_STRUCTURE_REPORT=1`
surface (`eslint/rails-file-structure-method-order.mjs`, `installReportHook`)
still lists ~20 `functions (no top-level fns)` entries in activemodel + arel
(`conversion.ts`, `naming.ts`, `type/helpers/mutable.ts`, `validations/*.ts`,
`crud.ts`, `expressions.ts`, …).

Those are NOT recoverable drops: they are standalone Rails modules ported as
`this`-typed functions spread across the file (<2 top-level `FunctionDeclaration`s)
or as object literals (`export const MutableModule = { cast(this: Type) … }`).
The method-order rule deliberately only reorders `FunctionDeclaration` and class
`MethodDefinition` (TDZ safety — see the rule's `isOrderableTopLevel` and the
plan §7 note), so these shapes are _structurally_ unenforceable, not silently
dropped enforceable order.

The report currently lumps both categories under one `functions (no top-level
fns)` label, so the "real drops remaining" signal is diluted: a reader cannot
tell a recoverable regression from an inherent shape limitation. This weakens
the report's usefulness as the module-as-class drop detector it was built to be.

## Acceptance criteria

- The `RAILS_STRUCTURE_REPORT` output distinguishes a `functions` bucket that
  matched no container because the TS file has a structurally-unenforceable
  mixin shape (object literal, or <2 top-level `FunctionDeclaration`s) from one
  that is a genuine recoverable drop.
- The distinguished/expected shapes are excluded from (or clearly labelled
  within) the "order not enforced" drop count, so the count reflects only
  recoverable drops.
- Verified: after this change the activemodel + arel report shows no
  `functions (no top-level fns)` entry for a file whose only module port is an
  object literal / this-typed mixin (e.g. `type/helpers/mutable.ts`,
  `conversion.ts`), while any real future drop still surfaces.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
