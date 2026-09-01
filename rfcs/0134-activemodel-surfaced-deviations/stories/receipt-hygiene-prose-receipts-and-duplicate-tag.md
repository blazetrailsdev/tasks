---
title: "activemodel: three free-prose @noRailsEquivalent receipts and one duplicated tag"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: receipt-hygiene
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A receipt has exactly two legal shapes — `PERMANENT`, or
`CONVERGEABLE <story-id>` — and carries no prose (CLAUDE.md). Four activemodel
tags violate that:

1. `packages/activemodel/src/attribute-methods.ts:532-537` —
   `@noRailsEquivalent Peels Ruby's trailing 'parameters:' keyword…` on
   `extractParameters`. The claim is true (TS cannot spell a keyword after a
   rest element) → `PERMANENT`.
2. `packages/activemodel/src/naming.ts:269-271` —
   `@noRailsEquivalent Module-private message helper…` on `builtinClassName`.
   True (MRI `rb_builtin_class_name` has no JS source) → `PERMANENT`.
3. `packages/activemodel/src/serialization.ts:240` —
   `@noRailsEquivalent Serves trails' awaitable serializable_hash (RFC 0022 b2)`
   on `preloadIncludes`. True; the RFC 0022 pointer should become
   `CONVERGEABLE <story-id>` if a converging story exists, else `PERMANENT`.
4. `packages/activemodel/src/attribute-methods.ts:547-548` — two consecutive
   `@noRailsEquivalent PERMANENT` lines on `answersWithAMethod`; delete one.

The surrounding explanatory prose can stay as ordinary JSDoc sentences where
`no-freeform-comments` permits; only the tag line itself must be one of the
two shapes.

## Acceptance criteria

- All four sites carry exactly one legally-shaped tag.
- `pnpm parity:api:extra --package activemodel` totals unchanged (the tags
  were already counted as tags); lint green.
