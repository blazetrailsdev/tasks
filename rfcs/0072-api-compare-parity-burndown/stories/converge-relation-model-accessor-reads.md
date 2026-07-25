---
title: "converge-relation-model-accessor-reads"
status: in-progress
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5322
claim: "2026-07-25T21:18:52Z"
assignee: "converge-relation-model-accessor-reads"
blocked-by: null
closed-reason: null
---

## Context

PR #5315 fixed two instances of the same infidelity in `relation.ts`, both
found the hard way — the first by CI's wide call-mismatch ratchet, the second
by review. Rails' `Relation` private methods read the model through the
`model` **accessor**; trails reaches past it to the `_modelClass` field, so
the ported body omits a call Rails makes.

Fixed in #5315 (both in `packages/activerecord/src/relation.ts`):

- `isAlreadyInScope` (:7035) — `relation.rb:1337-1339`,
  `@delegate_to_model && registry.current_scope(model, true)`
- `isGlobalScope` (:7039) — `relation.rb:1341-1343`,
  `registry.global_current_scope(model, true)`

The wide ratchet only catches these once the TS method is public/listed —
`isGlobalScope` is `private` and went unflagged, which is why it survived the
first fix. So the ratchet is **not** a reliable backstop here and the
remaining cases need a deliberate sweep.

Known remaining cases in the same private section of `relation.ts`, each with
a Rails body that reads `model`:

- `currentScopeRestoringBlock` (:7043) — `relation.rb:1345-1351`
  (`model.current_scope(true)`, `model.current_scope = current_scope`)
- `_new` (:7052) — `relation.rb:1353-1355` (`model.new(attributes, &block)`)
- `_create` — `relation.rb:1357-1359` (`model.create(attributes, &block)`)

Wider population to audit: `this._modelClass` appears 102× in `relation.ts`
plus `relation/query-methods.ts` (11), `relation/calculations.ts` (20),
`relation/finder-methods.ts` (10), `relation/spawn-methods.ts` (2),
`relation/delegation.ts` (2).

**Not every occurrence is an infidelity** — some sit in trails-invented
helpers with no Rails counterpart, and some correspond to Rails bodies that
genuinely read `@model`/`klass` rather than `model`. Each one must be checked
against its Rails body before being rewritten; a blanket
`this._modelClass` → `this.model` sed would be wrong and would churn ~150
lines for no fidelity gain.

`model` is a plain accessor (`relation.ts:6242`, `return this._modelClass`),
so every correct rewrite is value-identical and behavior-preserving — the win
is call-graph fidelity and keeping the wide ratchet honest as methods become
public.

## Acceptance criteria

- Each `this._modelClass` read in `relation.ts` and `relation/*.ts` is checked
  against its Rails counterpart body; those whose Rails body reads the `model`
  accessor are routed through `this.model`, and the rest are left alone.
- `currentScopeRestoringBlock`, `_new`, and `_create` are converged (the three
  already-identified cases).
- Occurrences with no Rails counterpart, or whose Rails body reads `@model` /
  `klass` directly, are left as-is — note them in the PR body so the next
  audit does not re-derive the same conclusions.
- `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` stays green
  and the baseline does not grow.
- Behavior-preserving: no test changes expected beyond what already exists.
- Respect the 500 LOC ceiling; split by file if needed.
