---
title: "Narrow the 20 `as NodeOrValue` operand casts so the union is enforced, not decorative"
status: ready
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 29
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #5028 (`arel-nodeorvalue-scalars-rails-unsupported`), where
`NodeOrValue` was audited arm by arm. The audit method was type-level: remove
an arm, run `pnpm typecheck`, treat the fallout as the caller set. That method
under-detects, and it produced a wrong conclusion that reached review — the PR
initially dropped `boolean` on a clean typecheck, when in fact a bare boolean
renders (`UPDATE "users" SET "admin" = TRUE`) via a live `UpdateManager#set`
path.

The reason typecheck was blind: 20 sites launder values into node slots via
`as NodeOrValue` casts from `unknown`, so the compiler never sees what actually
occupies a slot.

- `packages/arel/src/math.ts` — 9 sites. Every operator is
  `add(this: Node, other: unknown)` → `new Addition(this, other as NodeOrValue)`
  (math.ts:27-52).
- `packages/arel/src/attributes/attribute.ts` — 9 sites, same shape
  (attribute.ts:118-150).
- `packages/arel/src/update-manager.ts:64` — `val as NodeOrValue`, where `val`
  is a user-supplied value from `Object.entries(values)` in
  `activerecord/src/persistence.ts:308`.
- `packages/arel/src/visitors/to-sql.ts` — 1 site.

This is a trails invention, not a Rails shape. Ruby's `Arel::Math#*` is `def
*(other)` — untyped because Ruby has no types, and `NodeOrValue` is precisely
trails' encoding of "what Rails accepts in this slot". Typing the parameter as
`NodeOrValue` is therefore _more_ faithful than `unknown` + cast; the cast makes
the union decorative rather than load-bearing, so it documents an invariant it
does not enforce.

Related but already handled — do NOT redo: `ValuesList` rows are
`unknown[][]` (values-list.ts:10-17) by design, covered by the done story
`arel-valueslist-row-casts-assert-node-on-raw-values`. This story is about the
`math.ts` / `attribute.ts` / `update-manager.ts` operand casts only.

## Acceptance criteria

- [ ] Narrow the `other: unknown` parameters in `math.ts` (9) and
      `attributes/attribute.ts` (9) to `NodeOrValue`, deleting the
      `as NodeOrValue` casts.
- [ ] Narrow `update-manager.ts:64` similarly, or — if AR genuinely hands over
      values typed `unknown` at the package boundary — document at that call
      site why the cast is the boundary and cannot be removed. One boundary
      cast with a reason is acceptable; 20 silent ones are not.
- [ ] Handle the caller fallout in `activerecord` rather than re-widening: a
      caller that cannot produce a `NodeOrValue` is the finding, not the type.
- [ ] Re-evaluate the `undefined` → `NilClass` normalization
      (`ruby-class.ts:32`, and downstream `to-sql.ts` `constructorName` /
      `rubyInspect`). It was kept in #5028 _because_ the casts let an
      `undefined` arrive at dispatch. If narrowing closes that path, the
      branches may become unreachable and should go; if any boundary cast
      survives, they stay and the note at `to-sql.ts:66-78` stays accurate.
      Decide explicitly — do not leave it ambiguous.
- [ ] Verify by re-running the #5028 experiment: deleting an arm from
      `NodeOrValue` must now fail `pnpm typecheck` at a real call site. That is
      the point of the story — the union becomes an enforced invariant.
- [ ] api:compare / test:compare delta non-negative.
