---
title: "Synthesized __mixin members report zero params to the arity check"
status: draft
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while resolving the synthesized `__mixin` constructor in PR #5468.

Every member the mixin walker emits is pushed with a hard-coded `params: []`:
the property loop at `scripts/api-compare/extract-ts-api.ts:686-696` and the
constructor block at `:720-733` both do it. The walker reaches those members
through `instanceType.getProperties()` / the construct signature rather than
through the syntax tree, so no `extractParameters` call ever runs on them — the
top-level class walker (`:1771`) and the file-function walker (`:604`) both do
call it.

Consequence: for the repo's 22 synthesized `__mixin` modules, every member and
constructor reports zero parameters to the advisory arity check
(`scripts/api-compare/arity.ts`, summary line in `compare.ts:23-27`). A mixin
member whose Ruby counterpart takes arguments cannot be reported as an arity
mismatch, and one that genuinely diverges cannot be caught. The same blind spot
covers `optionKeys`, which the class walker extracts via `extractOptionKeys`
and the mixin walker likewise omits.

PR #5468 deliberately left this alone — it was scoped to declaration-derived
JSDoc metadata (`internal` / `noRailsEquivalent` / `declaredIn` / `line`), and
populating `params` moves arity numbers, which needs its own baseline.

## Acceptance criteria

- Synthesized `__mixin` members carry real parameters, extracted from the
  member's own declaration via `extractParameters` (the declaration is already
  in hand as `decl` / `ctorDecl`).
- Decide explicitly whether a FOREIGN member's params are extracted too; match
  whatever the visibility/`declaredIn` split established in #5468 implies.
- Re-baseline the arity summary in the same PR and state the before/after
  counts in the PR body — `Overall: ... arity: N/M` must be explained, not
  silently moved.
- If `optionKeys` is in reach on the same declarations, cover it too; if it
  turns out to need the checker in a way the mixin path cannot supply, say so
  and leave it.
