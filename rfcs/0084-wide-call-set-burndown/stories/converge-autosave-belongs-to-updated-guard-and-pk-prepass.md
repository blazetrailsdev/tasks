---
title: "Gate the belongs_to FK block on association.updated? alone and drop the composite-PK pre-pass"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6391
claim: "2026-08-12T00:46:03Z"
assignee: "naming-comparator-to-s-and-reserved-word-residue"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6385 (`converge-autosave-belongs-to-and-insert-helpers`) while
inlining `Array(reflection.foreign_key)` into `saveBelongsToAssociation`. Two
divergences in the same body were out of that PR's scope.

**1. The `updated?` guard is widened.** Rails
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:560`)
gates the whole FK-propagation block on `if association.updated?` alone. trails'
`packages/activerecord/src/autosave-association.ts` gates on
`if (isNewOrChanged || association?.isUpdated?.())`. The comment at the call
site says the extra arm exists so "the `setTarget` test shortcut — which
bypasses the writer and leaves `updated?` false — still propagates the FK": a
test affordance holding open a production branch. Rails' `association.loaded!`
at `:568` sits inside the same block and so fires on a wider set of saves here
too.

**2. A bespoke composite-PK pre-pass runs before `computePrimaryKey`.** Rails
`:561` is one line, `primary_key = Array(compute_primary_key(reflection,
record)).map(&:to_s)`. trails runs ~20 lines first — a `targetQcWouldApply`
probe over `hasQueryConstraints`, an `explicitFk`/`reflFkIsComposite` check,
and a direct read of the target's `primaryKey` — and only falls through to
`computePrimaryKey` when that pre-pass produces nothing. `computePrimaryKey` is
already the port of `compute_primary_key`
(`autosave_association.rb:576-587`), so the pre-pass is a second, divergent
implementation of the same decision sitting in front of it.

## Converged shape

Gate the FK block on `association.isUpdated()` alone, and fix whatever the
`setTarget` shortcut actually needs on the test side (or in the writer) rather
than in the production branch. Replace the pre-pass with the bare
`computePrimaryKey(reflection, record)` call; if a composite case genuinely
regresses, the fix belongs inside `computePrimaryKey`, which is the method
Rails delegates the whole decision to.

## Acceptance criteria

1. The FK-propagation block is gated on `association.isUpdated()` only, as
   Rails does at `autosave_association.rb:560`.
2. `primaryKey` comes from `computePrimaryKey` with no pre-pass; any composite
   correction lives inside `computePrimaryKey`.
3. `autosave-association.test.ts` (201), `.trails.test.ts` (9), and the
   composite-PK association suites stay green.
4. `pnpm parity:api:calls` / `:args` non-regressive; no new baseline rows.
