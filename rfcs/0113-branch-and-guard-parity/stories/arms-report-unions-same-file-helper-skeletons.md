---
title: "Arms report splices same-file helper skeletons at the reach, as the call gate unions their calls"
status: done
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 3
pr: 7526
claim: "2026-09-05T18:26:02Z"
assignee: "arms-report-unions-same-file-helper-skeletons"
blocked-by: null
closed-reason: null
---

## Context

The call-set gate forgives helper extraction; the arms report does not.

`effectiveTsCalls` (`scripts/api-compare/compare.ts:1028`) unions a TS body's
call set with that of any same-file helper it calls, so a faithful port that
extracts a private helper is not flagged for the calls that moved into it.
`compareArms` (`scripts/api-compare/report-arms.ts:110`) reads the body's own
skeleton and nothing else — the merge-rule comment at `:47-77` rejects a
whole-stream union because set operations cannot be taken over a sequence,
and stops there.

The consequence is a class the noise-floor audit had to hand-classify twice
(`docs/infrastructure/arm-mismatch-noise-floor.md`, "helper delegation": rows
32 `has-many-through-association.ts#markOccurrence`, 59
`attribute-methods.ts#formatForInspect`): the arms exist, in a helper, and the
report says they are missing. The inverse is also unmeasured — a Ruby body
whose arms live in a private helper Rails extracts, ported inline, reports
invented arms.

The union CAN be taken over a sequence, at the reach: where the body's
skeleton contains `ref:<helper>` and `<helper>` is a same-file method (the
same resolution `effectiveTsCalls` already performs), splice the helper's
skeleton in place of the reach, once per reach, non-recursively past a depth
of one so mutual recursion cannot loop. Do it symmetrically on the Ruby side
using the same-file resolution the Ruby call union uses. Because the splice is
positional, the `order` verdict stays meaningful; because it is only taken for
same-file reaches, it cannot credit a cross-file delegation, which is the
line `effectiveTsCalls` already draws.

## Acceptance criteria

- [ ] A `spliceHelperSkeletons(row, sameFileSkeletons)` step runs in
      `compareArms` on both sides before projection; depth one; a reach that
      does not resolve to a same-file method is left as-is.
- [ ] Unit test: a Ruby body `if … end` against a TS body that delegates the
      `if` to a same-file private helper reads as no mismatch; the same TS body
      with the helper in another file still reports `-if`.
- [ ] Unit test for the inverse (Ruby helper, TS inline).
- [ ] Rows 32 and 59 from the noise-floor sample no longer report; the arms
      report before/after row count is recorded in the PR body.
- [ ] Nothing new gates.
