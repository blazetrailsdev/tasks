---
title: "arel-enroll-unbacked-internal-receipt"
status: claimed
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-28T01:46:55Z"
assignee: "arel-crud-interface-holds-no-bodies"
blocked-by: null
closed-reason: null
---

## Context

`arel` was left OUT of `blazetrails/unbacked-internal-needs-receipt` when the
other two rules in `arel-enroll-three-lint-rules` landed (PR #7131). The
story's premise — "a dry run on `packages/arel/src` reports 0" — was measured
against an EMPTY `eslint/rails-private-methods.json`, under which the rule
passes every file. With the real manifest built (`pnpm parity:api`), arel has
**9 violations**:

- `arel.ts` — `arelNode` (`Arel.arel_node?`, arel.rb:64), `fetchAttribute`
  (`Arel.fetch_attribute`, arel.rb:68)
- `clone-support.ts` — `objectClone`, `cloneSlot`
- `nodes/sql-literal.ts` — `plus` (`SqlLiteral#+`, sql_literal.rb:25)
- `select-manager.ts` — `taken` (`alias :taken :limit`, select_manager.rb:22)
- `visitors/{to-sql,dot,postgresql}.ts` — `registerDispatch`

Neither remedy is mechanical, and both collide with the RFC 0117 extra-surface
ratchet (`pnpm parity:api:extra:gate`, arel novel 0/0, total 40/40, only-shrink):

1. `arelNode` / `fetchAttribute` / `plus` / `taken` all HAVE public Rails
   counterparts, so `@internal` is unearned and should simply be deleted — but
   deleting it re-enters them in the measured surface and takes arel's total
   40 → 44. Worse, `arel.rb` is absent from `scripts/api-compare/output/rails-api.json`
   entirely (the extractor does not reach the top-level `arel.rb` module), so
   `arel.ts` scores as "[no Rails counterpart]" and `arelNode` lands as **novel**,
   reddening the gate. The `@internal` tag is currently hiding an EXTRACTION
   gap, not a fidelity one.
2. `objectClone` / `cloneSlot` / `registerDispatch` have no Rails counterpart
   and take a `@noRailsEquivalent PERMANENT` receipt — but tagging
   `clone-support.ts`'s two functions pulls the file into scoring and surfaces
   `CloneSupport` as a second novel name.

## Acceptance criteria

- `scripts/api-compare` extracts `vendor/rails/activerecord/lib/arel.rb`, so
  `arel.ts`'s members score against `Arel.arel_node?` / `Arel.fetch_attribute`
  instead of as novel (or the reason it cannot is written down here).
- The 9 declarations above each end with a deleted `@internal` (where a Rails
  counterpart exists) or a reviewed `@noRailsEquivalent PERMANENT|CONVERGEABLE`
  receipt. No new baseline row.
- `packages/arel/src/**/*.ts` is in the `unbacked-internal-needs-receipt` `files`
  list in BOTH `eslint.config.mjs` and `eslint/rails-private-jsdoc.config.mjs`.
- `pnpm parity:api:extra:gate` stays green; `parity:api:extra:tighten` is used if
  the marks end up above the measurement, never a mark raise.
