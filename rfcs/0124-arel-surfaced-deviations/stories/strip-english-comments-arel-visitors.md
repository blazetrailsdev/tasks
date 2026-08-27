---
title: "Strip English-language comments from arel (visitors slice)"
status: in-progress
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 460
priority: 2
pr: 7132
claim: "2026-08-27T19:00:30Z"
assignee: "strip-english-comments-arel-visitors"
blocked-by: null
closed-reason: null
---

## Context

**Policy, 2026-08-27 (maintainer): trails carries no English-language comments.
The only comments that survive are our JSDoc flags and the tool directives the
toolchain reads — with no narrative prose around them.** The sweep runs package
by package, starting with arel.

The rationale is the one the port rests on: trails is a line-by-line
re-implementation and the Ruby is vendored at `vendor/rails/`. A sentence in
trails explaining what a method does is a second description of something Rails
already documents, in a place that rots independently of both sides. The
`Mirrors:` citation is the pointer; the Ruby is the prose.

This is what the arel fidelity audit (`audits/arel-20260827T152610Z.md`, graded
line bloat **C**) put a number on: arel carries 2,718 comment lines against
Rails' 271 — **10x** — roughly half of the package's 4,980-line excess over the
Ruby. `blazetrails/no-freeform-comments` did not catch it, and is not failing:
its keep-rule 1 keeps every JSDoc block unconditionally, so two thirds of the
volume was never in scope.

## What goes and what stays

Measured 2026-08-27 over `packages/arel/src` excluding tests — 2,711 comment
lines:

| class                              |     lines | disposition                    |
| ---------------------------------- | --------: | ------------------------------ |
| **prose**                          | **1,384** | **delete**                     |
| citation (`Mirrors`, a `.rb` path) |       538 | keep                           |
| block delimiters (`/**`, `*/`)     |       477 | keep/collapse with their block |
| blank `*` lines inside blocks      |       192 | collapse                       |
| JSDoc tags                         |        94 | keep                           |
| tool directives                    |        26 | keep                           |

**Keep** — a comment must be one of:

- A JSDoc tag: `@internal`, `@noRailsEquivalent`, `@missingRailsCall`,
  `@missingRailsArgs`, `@nie disposition=`. The _reason argument_ these tags
  require is not prose and stays — `parity:api:extra` and
  `lint-missing-rails-call-reasons` read it, and it is reviewed.
- A Rails citation: a `Mirrors:` line or a `<file>.rb:<lines>` reference,
  standing alone. It is a pointer, not a sentence.
- A tool directive: `eslint-*`, `@ts-*`, `prettier-ignore`, coverage pragmas,
  `boundary:` / `@boundary-file:`. Deleting one changes what the toolchain does.

**Delete** — every English sentence, wherever it lives:

- standalone `//` narration,
- prose paragraphs inside a JSDoc block,
- prose attached to a citation (`Mirrors: X — this is why we do Y`; keep the
  `Mirrors: X`, drop the clause),
- descriptive JSDoc summaries (`/** Add GROUP BY. */`, `/** Set the FROM
table. */`) — these are the exact form the maintainer named. TypeDoc loses
  them; that is accepted, the signature and the citation carry it.

Deleting the 1,384 prose lines takes **14% of the package** out and is roughly
half the measured gap to Ruby.

## Slicing

1,384 deleted lines will not fit one PR. Ship per subtree, largest first, and
file one sibling story per remaining slice off this one:

| slice                         | prose lines |
| ----------------------------- | ----------: |
| `visitors/`                   |         460 |
| `src/*.ts` (root)             |         420 |
| `nodes/`                      |         333 |
| `test-helpers/`               |         143 |
| `attributes/` + `collectors/` |          28 |

**This story is the `visitors/` slice**, and it also establishes the
keep/delete definition above for the siblings to follow. `visitors/visitor.ts`
is the worst single file in the package — 105 comment lines in 202, half the
file restating the dispatch design.

## Relationship to the lint rule

`0023-surfaced-deviations/close-jsdoc-bypass-in-no-freeform-comments` changes
`blazetrails/no-freeform-comments` so keep-rule 1 stops keeping JSDoc
unconditionally. That rule change is the _mechanism_ that stops the prose
coming back; this story is the arel _sweep_. They are separable and this one
does not wait: a sweep with no rule regresses, and a rule with no sweep cannot
be enrolled. Sequence them by whichever lands first — if the rule lands first,
its arel enrollment covers this slice and the sweep is its autofix output.

## Acceptance criteria

- [ ] Every prose comment under `packages/arel/src/visitors/` is gone —
      `//` narration, JSDoc paragraphs, and prose clauses hanging off a
      citation.
- [ ] Every `Mirrors:` line, `.rb` citation, JSDoc tag with its required reason
      argument, and tool directive is preserved verbatim.
- [ ] A JSDoc block reduced to nothing is removed entirely, not left as an
      empty `/** */`.
- [ ] No behaviour change: no code edits beyond comment removal, no renames,
      no reformatting of surviving lines beyond collapsing the blocks they sit
      in.
- [ ] `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` and
      `parity:api:extra --package arel` are unchanged — the tags the extractors
      read all survived. `parity:api:extra:gate` stays at arel novel 0.
- [ ] `pnpm lint` clean; no new eslint-disable.
- [ ] Sibling stories filed for the four remaining slices, each naming its
      measured prose-line count.

## Notes

Open question for the maintainer, called out rather than assumed: `@param` /
`@returns` / `@example` carry English prose by construction. This story treats
them as prose and deletes them (arel has few — 94 tag lines total, all classes
combined). If they should survive as "our JSDoc flags", say so before the
sibling slices run, because activerecord has far more of them.
