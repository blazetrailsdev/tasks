---
title: "Audit and dissolve TS_ALWAYS_ALLOWED in extra-surface.ts"
status: done
updated: 2026-07-26
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: ["no-rails-equivalent-tag-extractor-support"]
deps-rfc: []
est-loc: 300
priority: 3
pr: 5370
claim: "2026-07-26T22:22:54Z"
assignee: "ts-always-allowed-audit-dissolution"
blocked-by: null
closed-reason: null
---

# Audit and dissolve TS_ALWAYS_ALLOWED in extra-surface.ts

## Context

`TS_ALWAYS_ALLOWED` (`scripts/api-compare/extra-surface.ts:88-118`) is a
hand-maintained in-file allow-set of ~25 names, blanket-applied across every
file. Per this RFC it dissolves into two buckets:

1. **Rails-faithful mirrors of `conventions.SKIP` methods** (`dup`, `clone`,
   `freeze`, `inspect`, `tap`, `eql`, `initializeDup`, `encodeWith`, …):
   these methods EXIST in Rails (`rubyMethodToTs` returns null for SKIP
   entries, so they never enter `allowed`). Tagging them
   `@noRailsEquivalent` would be false. Fold them into the candidate-name
   mapping instead (e.g. `rubyMethodCandidates` in extra-surface.ts:185, or
   a SKIP-aware arm in conventions), so a TS override is `allowed` only
   where the Ruby file actually defines the method — tighter than today's
   blanket set.
2. **Genuinely JS-only protocol surface** (`catch`, `finally`,
   `[Symbol.iterator]`, `[Symbol.asyncIterator]`,
   `[Symbol.for("nodejs.util.inspect.custom")]`, `then`, `valueOf`,
   `toArray`/`toH`/`toHash`, `klasses`, …): tag each _declaration_
   `@noRailsEquivalent` (a handful of sites — Relation's
   thenable/iteration protocol, inspect hooks) and drop the names from the
   set.

The audit decides bucket membership name-by-name (some are ambiguous —
`klasses`, `equals`) with the RFC's rule: tag only what is truly novel.
Delete the constant when both buckets are handled. If blanket-set removal
surfaces more flagging sites than fit one PR, register follow-up stories
rather than growing this one.

Depends on the extractor-support story.

## Acceptance criteria

- `TS_ALWAYS_ALLOWED` is deleted from `extra-surface.ts`.
- SKIP-mirror names are allowed via file-scoped candidate mapping, not a
  global set; JS-protocol declarations carry `@noRailsEquivalent`.
- `pnpm parity:api && pnpm parity:api:extra` green with no new untagged extras
  and no stale tags; per-package totals explained in the PR if they shift.
- Audit table (name → bucket → action) recorded in the PR description.
