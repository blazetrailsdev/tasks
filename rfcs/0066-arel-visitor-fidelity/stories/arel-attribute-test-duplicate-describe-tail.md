---
title: "arel-attribute-test-duplicate-describe-tail"
status: claimed
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-22T17:26:47Z"
assignee: "arel-attribute-test-duplicate-describe-tail"
blocked-by: null
closed-reason: null
---

## Context

PR #5057 (story `arel-attribute-test-duplicate-describe-blocks`) consolidated
the 3 worst duplicate `describe` groups in
`packages/arel/src/attributes/attribute.test.ts` (`#not_between` 7→1,
`#not_in` 5→1, `#lteq` 4→1). The 1-excess tail remains: 16 describes with
exactly 2 copies each, plus the TS-only `relationName` describe.

Against `vendor/rails/activerecord/test/cases/arel/attributes/attribute_test.rb`
(one `describe` per name; `#eq_all` legitimately has two — rb:441 and rb:1037):

- Split `_any` pairs where the 2nd copy holds the exact-SQL "should generate
  ORs in sql": `#gteq_any`, `#lt_any`, `#lteq_any`, `#eq_any`, `#matches_any`,
  `#does_not_match_any`, `#in_any` — fold the exact `toSql()` assertion into
  the first block (replacing the weaker `toContain("OR")`), delete the 2nd.
- Node-instanceof stragglers near the bottom of the file duplicating an
  earlier full block: `#gt`, `#lt`, `#eq`, `#matches`, `#does_not_match` —
  fold the `toBeInstanceOf` assertion into the first block's same-named it
  (Rails asserts `must_be_kind_of`), delete the straggler.
- Blocks whose bodies never call the method the describe names (delete):
  2nd `#sum` (body tests `contains`), 2nd `#minimum` (body tests `overlaps`).
- `#overlaps`: two 1-it blocks ("should generate && in sql" and "should
  create an Overlaps node") — merge into one block in Rails' it-order
  (create node first).
- `#to_sql`: Rails only has it nested inside `describe "equality"` (rb:1114);
  trails has that nested one plus a top-level duplicate — delete the
  top-level block.
- `relationName` (1 trails / 0 Rails) is a TS-only extra — move it (and its
  `relationName` import) to `attribute.trails.test.ts`, do not delete.

Method per #5014/#5057: keep the strictly stronger assertion (exact `toSql`
over `toContain`), fold anything unique from a dropped block, never rename an
it. Reproduce counts with the python snippet in the parent story
(`arel-attribute-test-duplicate-describe-blocks`).

## Acceptance criteria

- [ ] Every describe in `attribute.test.ts` appears exactly as often as in
      Rails' `attribute_test.rb` (only `#eq_all` twice).
- [ ] `relationName` describe moved to `attribute.trails.test.ts`.
- [ ] No test renamed or reworded.
- [ ] `test:compare --package arel` matched count for
      `attributes/attribute_test.rb` stays at 128; extras fall (70 at time of
      writing, after #5057).
