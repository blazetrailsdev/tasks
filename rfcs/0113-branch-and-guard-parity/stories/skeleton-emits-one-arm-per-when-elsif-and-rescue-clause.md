---
title: "Skeleton emits one arm per when / elsif / rescue clause on both sides, not one per statement"
status: in-progress
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 3
pr: 7526
claim: "2026-09-05T18:26:02Z"
assignee: "arms-report-unions-same-file-helper-skeletons"
blocked-by: null
closed-reason: null
---

## Context

Both skeleton extractors emit ONE control token per control _statement_, not
per _arm_, and they do it asymmetrically, so the report cannot see the arm
count RFC 0113 is about.

Ruby side, `scripts/api-compare/extract-ruby-api.rb`:

- `SKELETON_IF_NODES` (`:2708`) lists `case` but not `when`, so a `case` with
  six `when`s emits a single `if` (`walk_for_skeleton`, `:2736`).
- `:bodystmt` with a rescue/ensure slot emits a single `try` (`:2740`)
  regardless of how many `rescue` clauses hang off it.

TS side, `scripts/api-compare/extract-ts-api.ts#extractSkeleton` (`:4243`):

- `SwitchStatement` emits one `if`; each `IfStatement` emits one `if`, so an
  `if / else if / else if` chain — the faithful port of a `case` — emits one
  per arm.
- `TryStatement` emits one `try`; a `catch (e) { if (e instanceof A) … else if
(e instanceof B) … }` chain emits one `if` per clause on top.

Two consequences, measured in
`docs/infrastructure/arm-mismatch-noise-floor.md`:

1. **`case` lowering is the single largest artefact class** (rows 34, 53, 60,
   74, 77): every ported `case` with two or more `when`s reports invented
   `if`s that are not invented.
2. **The RFC's flagship example is invisible.** `sqlite3_adapter.rb:692`
   `translate_exception` is a six-arm `case`; a port that drops the
   `BusyException` arm (the `sqlite3-translate-exception-branch-set` story)
   still emits exactly one `if` on the Ruby side and — if ported as a
   `switch` — one on the TS side. Same for a `rescue A … rescue B …` pair
   ported as a single `catch`.

The fix is to count clauses, on both sides, with the same vocabulary:

- Ruby: one `if` per `when` (and `else`-less `case` stays at N `when`s), one
  `if` per `elsif` (already, via the `:elsif` node), one `try` per `bodystmt`
  PLUS one `rescue` token per `:rescue` clause (chained `:rescue` nodes are
  linked through the clause's last slot — walk the chain).
- TS: one `if` per `CaseClause` of a `SwitchStatement` (the `DefaultClause`
  emits nothing, like Ruby's `else`), one `try` per `TryStatement`, and one
  `rescue` per top-level `instanceof` arm inside the `catch` block — or, where
  the catch has no `instanceof` chain, exactly one `rescue`, matching a bare
  Ruby `rescue`.

`CONTROL_TOKENS` in `scripts/api-compare/report-arms.ts:42` gains `rescue`.
`report-arms.ts` is report-only and stays that way; this changes what it
reports, not whether anything gates.

Depends on nothing, but overlaps in the `catch` walk with
`skeleton-misses-modifier-rescue-and-catch-arms` (done): read that PR before
touching the `catch` branch.

## Acceptance criteria

- [ ] Ruby `case` with N `when`s emits N `if` tokens; TS `switch` with N
      `case` clauses emits N `if` tokens; an `if / else if` chain is
      unchanged. Unit tests on both extractors pin a three-`when` `case`
      against its `switch` port AND its `if`-chain port, both reading equal.
- [ ] Ruby `rescue` clauses emit one `rescue` token each after the `try`;
      TS `catch` emits one per `instanceof` arm, or one when there is no
      chain. Unit tests pin `translate_exception`'s shape: a port missing one
      `when` reports `-if`, a `catch` missing one `instanceof` arm reports
      `-rescue`.
- [ ] `CONTROL_TOKENS` includes `rescue`; `compareArms` and `cluster` need no
      other change.
- [ ] `pnpm parity:api:arms:report` before/after row count is recorded in the
      PR body; the `case`-lowering rows in the noise-floor doc (34, 53, 60,
      74, 77) no longer report.
- [ ] Nothing new gates.
