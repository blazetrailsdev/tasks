---
title: "Relocate 8 misplaced inverse-detection tests from reflection.test.ts to inverse-associations.test.ts"
status: done
updated: 2026-07-06
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps:
  - inheritance-modules-reflection-followup
deps-rfc: []
est-loc: 250
priority: 2
pr: 4667
claim: "2026-07-06T11:26:24Z"
assignee: "reflection-inverse-tests-relocate"
blocked-by: null
---

## Context

`packages/activerecord/src/reflection.test.ts` still carries 8 TS-only
inverse-detection tests that match no test in
`vendor/rails/activerecord/test/cases/reflection_test.rb`. They are MOVE
candidates (RFC 0043 triage): the behavior they exercise lives in Rails'
`vendor/rails/activerecord/test/cases/associations/inverse_associations_test.rb`,
whose TS counterpart is
`packages/activerecord/src/associations/inverse-associations.test.ts`.

Three match Rails inverse_associations_test.rb descriptions verbatim
(`test:compare` confirmed): "has one and belongs to should find inverse
automatically", "has many and belongs to should find inverse automatically",
"has one and belongs to with non default foreign key should not find inverse
automatically". The other five test the same automatic-inverse machinery
(through, polymorphic belongs_to, `inverseOf: false`, scoped + automatic scope
inversing, scoped belongs_to side) and belong in the same file.

These were intentionally LEFT in reflection.test.ts by PR #4129 (the
reflection-extra-burndown deletion story) because relocating them is the
misplaced/wrong-describe workflow, out of scope for a pure-deletion PR. They
are the residual `extra: 12` on reflection_test.rb (8 inverse + 4 Rails-named
it.skip placeholders).

reflection.test.ts lines (at #4129 merge): 1752, 1779, 1801, 1822, 1852, 1874,
1895, 1945.

## Acceptance criteria

- Move the 8 inverse-detection tests verbatim (names unchanged) from
  `reflection.test.ts` into `associations/inverse-associations.test.ts`,
  matching the destination file's setup/schema conventions.
- For the 3 name-matching tests, verify they land as `matched` (not `extra`)
  against inverse_associations_test.rb; for the other 5, confirm they map
  correctly (matched if a Rails analog exists, else keep as deliberate extra
  with a one-line justification).
- reflection_test.rb `extra` drops by 8 (12 -> 4); matched/matchedSkipped/
  missing/wrongDescribe/misplaced on reflection_test.rb stay unchanged.
- inverse_associations_test.rb parity metrics do not regress
  (matched non-negative delta).
