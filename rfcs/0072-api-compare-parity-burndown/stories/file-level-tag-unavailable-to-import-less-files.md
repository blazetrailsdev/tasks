---
title: "File-level @noRailsEquivalent is unavailable to files with no imports"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps:
  - extra-surface-resolve-remaining-whole-file-cases
deps-rfc: []
est-loc: 60
priority: null
pr: 6143
claim: "2026-08-05T20:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

The file-level `@noRailsEquivalent` form added in PR #5950 is read only when the
file's FIRST statement is an `ImportDeclaration`
(`fileLevelNoRailsEquivalentReason`, extract-ts-api.ts):

```ts
const first = sourceFile.statements[0];
if (first === undefined || !ts.isImportDeclaration(first)) return undefined;
return noRailsEquivalentReason(first);
```

That restriction is deliberate and should not simply be dropped. TypeScript
binds a file's leading JSDoc block to the first statement, so on an import-less
file the top block IS the first declaration's own doc block — which
`noRailsEquivalentReason` already reads as a DECLARATION tag. Treating it as
file-level as well would silently widen every such tag into a blanket over the
whole file, which is exactly the failure mode `fileTagVerdict` exists to prevent.

The gap: an import-less file with several novel names has no file-level form at
all and must repeat a per-declaration reason, which is the repetition RFC 0072
set out to remove. No such file is known to need it today — the six converted
adapters and all three candidates in
`extra-surface-resolve-remaining-whole-file-cases` have imports — so this is a
completeness item, not a live blocker. It is worth solving only if a real file
turns up in that position; the story should start by checking whether one has.

## Acceptance criteria

- Establish first whether any TS file with no imports actually carries (or
  needs) more than one `@noRailsEquivalent`. If none does, close the story with
  that finding recorded — do NOT add machinery for a hypothetical.
- If one does: give the file-level form a spelling that cannot be confused with
  a declaration's own doc block on an import-less file. Options to weigh — a
  distinct tag name, or requiring the block to be separated from the first
  statement by a blank line and verifying TypeScript's binding, or an explicit
  `@fileoverview`-style marker.
- Whatever the spelling, an import-less file's leading block must still reach
  `ClassInfo.noRailsEquivalent` as a declaration tag when that is what it is —
  the existing "leaves the leading block of an import-less file as its
  declaration's tag" test must keep passing.
- `pnpm vitest run scripts/api-compare/extract-ts-api.test.ts` and
  `extra-surface.test.ts` pass.

## Finding (2026-08-05) — no machinery added

Swept every TS file carrying `@noRailsEquivalent` for one whose first statement
is not an import. Exactly one carries more than a single tag:
`packages/i18n/src/throw-catch.ts` (3 tags: `ThrownException`,
`throwException`, `catchException`).

It still cannot use a file-level form, for a reason independent of the
import-less restriction: `fileTagVerdict` refuses a blanket over a file with
`moved` names, and `extra-surface` scores two of throw-catch.ts's names —
`value` and `constructor` — as moved (they exist in Rails, elsewhere). A
file-level tag there is rejected with
`2 moved name(s): value, constructor`, so no spelling of the tag would help.

A `@fileoverview`-marked spelling was prototyped (it works, and keeps an
import-less leading block as its declaration's tag when the marker is absent)
and then reverted: with the sole candidate refused on other grounds, it would be
machinery for a hypothetical, which this story explicitly forbids. Reopen with
this finding if a file turns up that is import-less, multi-tagged, AND
novel-only.
