---
title: "Re-spell the Journey test names into Rails' def_test form"
status: draft
updated: 2026-09-07
rfc: "0000-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' Journey tests are `def test_*`-style.
`scripts/test-compare/extract-ruby-tests.rb:514` derives the comparable
description as `name.sub(/^test_/, "").tr("_", " ")` and `compare.ts:161`
lowercases and collapses whitespace, so `def test_path_escape` in
`vendor/rails/actionpack/test/journey/router/utils_test.rb` must be ported as
`it("path escape")`.

trails spelled 83 of these tests under the raw Ruby method name —
`it("test_path_escape")` in
`packages/actionpack/src/action-dispatch/journey/router/utils.test.ts:8` and its
siblings. That credits nothing: the same test shows as `missing` on the Rails
side and `extra` on the TS side of the same file row.

This is convergence, not a rename. `it("test_path_escape")` is not the Rails
name; `"path escape"` is. CLAUDE.md's "never rename a test" rule exists because
names are what `parity:test` matches on, which is precisely the argument for
this change. No test's meaning changes and no test is reworded.

Counts per file (Rails file -> convention TS file), measured 2026-09-07:

| Convention TS file | Re-spell |
| --- | --- |
| `journey/route/definition/parser.test.ts` | 21 |
| `journey/path/pattern.test.ts` | 18 |
| `journey/route.test.ts` | 11 |
| `journey/nodes/ast.test.ts` | 9 |
| `journey/router/utils.test.ts` | 8 |
| `journey/gtg/transition-table.test.ts` | 7 |
| `journey/gtg/builder.test.ts` | 6 |
| `journey/routes.test.ts` | 3 |

## Acceptance criteria

- Every `it("test_<name>")` in `packages/actionpack/src/action-dispatch/journey/**`
  whose de-underscored form matches a Rails `def test_*` in the corresponding
  `vendor/rails/actionpack/test/journey/**` file is re-spelled to that derived
  form.
- Derivation is mechanical: strip `test_`, replace `_` with a space, collapse
  runs of whitespace. Confirm against the Ruby; do not hand-invent prose.
- `pnpm parity:test --package actiondispatch` shows the eight file rows above
  crediting the re-spelled tests under OK, with 0 in the Desc column.
- Only the eight files above are touched. The file moves, the genuinely absent
  tests, and the trails-only extras are other stories.
- Do NOT tighten `assertion-mismatch-mark.json` in this PR — matching these
  tests reveals assertion mismatches for the first time and the mark correction
  is `journey-assertion-mark-one-time-correction`, which lands with it.
