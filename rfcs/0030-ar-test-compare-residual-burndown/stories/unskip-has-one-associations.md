---
title: "Un-skip has_one_associations_test (41 skipped)"
status: done
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: 3907
claim: "2026-06-22T18:03:57Z"
assignee: "unskip-has-one-associations"
blocked-by: null
---

## Context

`test:compare --package activerecord` reports **41 skipped tests** in
`associations/has-one-associations.test.ts` (mirrors Rails
`associations/has_one_associations_test.rb`) — the single largest skip cluster
blocking AR's climb from 97% to 100%, and ~17% of the entire 234-test gap. No
existing 0030 story targets this file.

The TS file is **already canonical** (not in
`eslint/require-canonical-schema-exclude.json`), so this is pure un-skip +
impl-convergence work — no 0019 schema conversion required.

Representative skipped cases (read the Rails test first for each, per the
NEVER-rename-test-names rule):

- `nullify on polymorphic association`, `nullification on destroyed association`,
  `nullification on cpk association`
- `association change calls destroy`, `dependence`,
  `restrict with error with locale`
- `build and create should not happen within scope`
- `can marshal has one association with nil target`

## Acceptance criteria

- Un-skip the has_one association tests in
  `packages/activerecord/src/associations/has-one-associations.test.ts`,
  converging the implementation where they fail (do NOT rename/reword tests).
- Each un-skipped test passes against the canonical schema on sqlite/pg/mysql.
- `test:compare --package activerecord` shows the has_one skip count drop toward 0.
- Split into multiple PRs if the un-skip set exceeds the 500 LOC ceiling;
  register follow-on stories rather than fanning out PRs yourself.
