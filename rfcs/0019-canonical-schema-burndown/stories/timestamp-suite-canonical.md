---
title: "timestamp.test.ts → canonical models + timestamp_test.rb"
status: claimed
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 300
priority: 4
pr: null
claim: "2026-06-28T17:46:36Z"
assignee: "timestamp-suite-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization):** Exempt from the 500-LOC PR
> ceiling per the RFC 0019 per-file convention. At ~743 LOC this likely fits in
> one PR; if not, split per-describe across sibling PRs off `main` (NOT
> stacked). The file leaves the exclude list only when FULLY converted.

## Context

`packages/activerecord/src/timestamp.test.ts` (~743 LOC) is in the RFC 0019
canonical-schema exclude list with **no live story**. It has **0 `defineSchema`
calls** (so it looks converged at a glance) but is still bespoke: the canonical
fixture block (top of file) already uses `setupHandlerSuite()` +
`useHandlerFixtures(["developers","owners","pets","toys","cars","tasks"])`, yet
**18 inline `class X extends Base` partial-declaration models** remain —
`DevWithAfterTouch`, `MutatingSaveKlass`, `MutatingUpdateKlass`,
`NonMutatingUpdateKlass`, the touch family (`PetTouchHappyAt`,
`PetCounterCacheTouch`, `ToyTouchPet*`, `WheelPolymorphicTouch*`, `ToyAnon*`),
the timestamp-in-callback family (`PersonWithTimestampInCreate/Update/Save`),
and `TimestampAttributePost` (which declares `created_at`/`updated_at` as
`{ virtual: true }`). They are registered ad-hoc via `registerModel(...)`.

This is the same partial-declaration anti-pattern RFC 0030's schema-cache
warming exposes (see memory `schema_cache_warming_converges_partial_decl`):
faked/virtual timestamp columns on bespoke classes stop round-tripping once the
shared cache is warmed to the real DB columns. Convergence is the durable fix.

- trails: `timestamp.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/timestamp_test.rb` (drives
  canonical `Developer`/`Owner`/`Pet`/`Toy`/`Car`/`Task` + the touch/polymorphic
  models, all backed by tables that genuinely have `created_at`/`updated_at`).

## Acceptance criteria

- [ ] **Converged setup, not bespoke classes:** ride `setupHandlerSuite()` +
      `useHandlerFixtures([...])`; rows via `name(:label)`. A fully converged
      file declares no inline `class X extends Base` and no ad-hoc
      `registerModel`; it reuses the official models in
      `test-helpers/models/`.
- [ ] Open `timestamp_test.rb` FIRST; port each body word-for-word. **Test names
      UNCHANGED** (`test:compare` matches on names).
- [ ] Replace the 18 bespoke classes with canonical models whose tables
      genuinely have the needed timestamp columns. **Never** declare
      `created_at`/`updated_at` as `{ virtual: true }` to dodge a missing column
      — add the column to the canonical table in `test-helpers/test-schema.ts`
      only when Rails `schema.rb` has it; otherwise use the canonical model that
      already has it.
- [ ] Tests hitting a genuine impl gap (e.g. counter-cache touch + alias) are
      `it.skip` with a comment referencing the gap story (register under
      `0005-activerecord-gaps` first).
- [ ] File removed from `eslint/require-canonical-schema-exclude.json`;
      `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/timestamp.test.ts` passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story. Faking columns (virtual timestamps) to dodge the
schema-cache merge is NOT done.
