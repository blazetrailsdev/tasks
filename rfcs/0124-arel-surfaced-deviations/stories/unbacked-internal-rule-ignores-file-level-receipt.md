---
title: "lint: unbacked-internal-needs-receipt should honor a file-level @noRailsEquivalent"
status: draft
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two receipt mechanisms disagree about where a `@noRailsEquivalent` may live,
and PR #7155 had to write the SAME receipt twice to satisfy both.

`extra-surface.ts` accepts a **file-level** receipt — a JSDoc block above the
imports, or one separated from the first declaration by a blank line
(`fileLevelNoRailsEquivalentReason`, scripts/api-compare/extract-ts-api.ts:1864).
It covers every otherwise-extra name in the file, INCLUDING the synthesized
container name the extractor mints from the file path (`clone-support.ts` →
`CloneSupport`, `ruby-namespace.ts` → `RubyNamespace`). That container name is
not a declaration, so it cannot be tagged per-declaration — a file-level
receipt is the ONLY thing that covers it.

`blazetrails/unbacked-internal-needs-receipt` (eslint/unbacked-internal-needs-receipt.mjs)
reads only the declaration's own JSDoc, so a file-level receipt does not
satisfy it.

The result in `packages/arel/src/clone-support.ts` today:

    /** @noRailsEquivalent PERMANENT */      <- for extra-surface's CloneSupport

    /**
     * @internal
     * @noRailsEquivalent PERMANENT          <- for the eslint rule
     */
    export function objectClone…

Both are load-bearing: dropping the first reds `pnpm parity:api:extra:gate`
(arel novel 0 → 1), dropping the second reds the lint. Two receipts stating one
fact is exactly the duplication the file-level form exists to remove
(RFC 0072).

## Converged shape

`unbacked-internal-needs-receipt` honors a file-level receipt the same way the
extractor does: reuse `fileLevelNoRailsEquivalentReason`'s rule — a JSDoc block
above the imports, or one a blank line separates from the first declaration —
and treat every `@internal` declaration in that file as receipted. Then
`clone-support.ts` keeps the file-level tag alone.

## Acceptance criteria

- The rule accepts a file-level `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>`
  as the receipt for every `@internal` declaration in that file, matching
  `extract-ts-api.ts:1864`'s two placements exactly (a block bound to the first
  declaration must NOT count, in either tool).
- Rule tests pin both placements and the negative case.
- The duplicate per-declaration receipts come off `packages/arel/src/clone-support.ts`.
- `pnpm parity:api:extra:gate` stays green at arel novel 0/0, and
  `pnpm exec eslint packages/arel/src --max-warnings 0` stays clean.
