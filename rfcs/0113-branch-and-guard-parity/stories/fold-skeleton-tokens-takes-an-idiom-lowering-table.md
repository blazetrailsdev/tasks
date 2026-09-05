---
title: "foldSkeletonTokens reads an idiom-lowering table, not a single derived loop set"
status: draft
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps: ["skeleton-loop-fold-covers-only-each"]
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`foldSkeletonTokens` (`scripts/api-compare/compare.ts:336`) is the one place
the skeleton comparison absorbs a Ruby-to-JS lowering, and it knows exactly one
lowering: a block iterator becomes `loop`. Its name set
(`LOOP_SKELETON_NAMES`, `:307`) is derived from the enumerable alias table;
`skeleton-loop-fold-covers-only-each` (ready) widens WHICH names fold to
`loop`. This story is about the other shape of idiom, which no widening of
that set can cover: Ruby stdlib calls whose faithful JS port is a loop PLUS a
guard, or a guard alone.

From the noise-floor audit's "stdlib idiom" class
(`docs/infrastructure/arm-mismatch-noise-floor.md`, rows 31, 35, 36, 58):

| Ruby reach                  | faithful TS lowering                       | expected tokens   |
| --------------------------- | ------------------------------------------ | ----------------- |
| `filter_map`                | `for … of` + `if (x != null) out.push(x)`  | `loop if`         |
| `uniq`                      | `Set` filter, or `for … of` + `if (!seen)` | `loop if`         |
| `compact` / `compact!`      | `filter((x) => x != null)` or loop + guard | `if` or `loop if` |
| `drop_while` / `take_while` | `for … of` + `if (!p) break`               | `loop if`         |
| `delete_if` / `reject!`     | `for … of` + `if (p) splice`               | `loop if`         |
| `concat`                    | `for … of` + `push`                        | `loop`            |
| `dig`                       | `a?.b?.c` (nothing) or guard chain         | ``or`if`          |

Each row is the same fact the enumerable alias table records for the CALL gate
(`scripts/api-compare/enumerable-idioms.ts`: `any?` is `some`), stated for
the SKELETON: the Ruby reach stands for the listed control tokens. Today those
rows are classified by hand every time the sample is re-drawn.

Fix: replace the single derived set with a table
`SKELETON_IDIOM_LOWERINGS: Map<rubyName, string[]>` in
`enumerable-idioms.ts` (next to the alias table it parallels), where the
existing `each` family maps to `["loop"]` and the rows above map to their
token lists. `foldSkeletonTokens` folds the Ruby side's `ref:<name>` onto the
listed tokens. Where a lowering has two legitimate shapes (`compact` as a
`filter` call or a loop), record BOTH and accept either during the diff —
the same alternation the alias table already expresses with a list.

Because the fold is Ruby-side only and only ever ADDS expected control tokens
to the Ruby stream, it can never hide a missing arm on the TS side: a port
that dropped an `if` still comes up one short. It can only stop a faithful
lowering from reporting an invented one.

Depends on `skeleton-loop-fold-covers-only-each`: land that first, then move
its widened set into the table as the `["loop"]` rows.

## Acceptance criteria

- [ ] `SKELETON_IDIOM_LOWERINGS` exists in `enumerable-idioms.ts` with the
      rows above and the `each` family; `foldSkeletonTokens` reads it and the
      derived `LOOP_SKELETON_NAMES` is deleted.
- [ ] Each row carries the Rails-side citation and the audit row it clears.
- [ ] A unit test pins the table: `filter_map` folds to `loop if`; a name
      whose port keeps its call (`map`, `select`) is NOT in the table and does
      not fold.
- [ ] A unit test proves the fold cannot hide a TS-side missing `if`.
- [ ] Rows 31, 35, 36, 58 no longer report; the arms report before/after is
      recorded in the PR body.
- [ ] Nothing new gates.
