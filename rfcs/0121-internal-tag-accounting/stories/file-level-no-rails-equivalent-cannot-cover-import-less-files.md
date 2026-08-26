---
title: "File-level @noRailsEquivalent is unreachable for a file with no imports, blocking the arel @internal burndown"
status: draft
updated: 2026-08-26
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`enroll-arel-in-unbacked-internal-receipt-lint` is `tasks block`-ed on this.
Surfaced by PR #7084.

`arel` is gated at `novel 0 / total 62` by `pnpm parity:api:extra:gate` (RFC
0117), only-shrink on BOTH dimensions. Burning down the two `@internal` tags in
`packages/arel/src/temporal-tag.ts` raises `total` whichever remedy the RFC 0121
lint allows:

- Give them `@noRailsEquivalent` receipts: both functions re-enter the measured
  surface as `Allowed`, which makes `extract-ts-api.ts` fabricate a module entry
  from the filename (`extract-ts-api.ts:1057-1075`, gated on `hasPublicFn`). The
  fabricated name `TemporalTag` has no Rails counterpart and scores NOVEL —
  measured: `arel novel: mark 0 -> current 1`.
- Remove the `@internal` instead: same fabrication, plus the two function names.

The escape hatch that exists for precisely this — a whole file with no Rails
counterpart — is the FILE-level `@noRailsEquivalent` (RFC 0072),
`fileLevelNoRailsEquivalentReason` in `scripts/api-compare/extract-ts-api.ts:1853`.
It reads the reason only from a block above the **imports**:

```ts
const first = sourceFile.statements[0];
if (first === undefined || !ts.isImportDeclaration(first)) return undefined;
```

Its docblock states the restriction deliberately — a block above a DECLARATION
is that declaration's own doc, and treating it as file-level would silently
widen every such tag into a blanket — and closes "So a file with no imports has
no file-level form." `temporal-tag.ts` has zero runtime imports by design, so it
cannot carry one. `visitors/ruby-class.ts`, its only sibling of the same kind,
only qualifies because it happens to import from `temporal-tag.ts`.

Do NOT resolve this by raising the mark, by an `--exclude-glob` (an exclusion
disarms the STALE gate — see `extra-surface.ts` `main()`), or by adding a no-op
`import type {}` to anchor the tag.

A second, independent blocker rides the same story and needs its own diagnosis:
un-`@internal`-ing `SqlLiteral#plus` and `SelectManager#taken` — both genuinely
PUBLIC in Rails (`activerecord/lib/arel/nodes/sql_literal.rb`'s `def +(other)`;
`activerecord/lib/arel/select_manager.rb:22`'s `alias :taken :limit`) — moves
`total` 62 -> 64 because both score as **moved**, i.e. the comparer attributes
the Ruby name to a different `.rb` than the TS file maps onto. `taken` is
declared in `select_manager.rb`, the very file `select-manager.ts` maps to, so
the `moved` verdict there looks like a real mapping bug rather than a misplaced
port. (Re-measured after #7079 named operator symbols in the Ruby extractor:
arel still `0/62`, so #7079 did not resolve the `plus` half.)

## Converged shape

Give a file with no imports a way to carry a file-level receipt, without
widening a declaration's doc block into a blanket. The obvious candidate is a
DETACHED leading comment — a `/** ... */` at position 0 separated from the first
statement by a blank line, which TypeScript does not bind to that statement — so
the "a block above a declaration is that declaration's own doc" invariant the
current docblock protects is preserved exactly. Read it via
`ts.getLeadingCommentRanges` and keep the existing empty-reason and
truncated-prose hard errors.

Then, separately, diagnose the `moved` verdict on `taken` / `plus` and fix the
mapping (or the port's location) rather than tagging around it.

## Acceptance criteria

- [ ] A file with no import declarations can carry a file-level
      `@noRailsEquivalent`, and a block that IS a declaration's doc is still not
      read as file-level (add a unit test for both arms).
- [ ] Empty-reason and `@tag`-in-prose truncation still hard-error on the new path.
- [ ] `packages/arel/src/temporal-tag.ts` carries the file-level receipt, its two
      `@internal` tags are resolved, and `pnpm parity:api:extra:gate` stays green
      with arel's marks moving DOWN or not at all.
- [ ] Root cause named for `SqlLiteral#plus` and `SelectManager#taken` scoring
      `moved`, and fixed at the mapping.
- [ ] `pnpm exec tsx scripts/api-compare/extra-surface.ts` exits 0.
- [ ] `enroll-arel-in-unbacked-internal-receipt-lint` is unblocked.
