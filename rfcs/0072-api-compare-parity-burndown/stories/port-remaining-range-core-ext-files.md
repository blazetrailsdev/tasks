---
title: "Split range-ext.ts into the core-ext/range/*.rb files Rails declares"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6101
claim: "2026-08-04T23:11:10Z"
assignee: "of-kind-default-type-and-normalize-arguments"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/range-ext.ts` is a trails-invented flat module: it
carries `makeRange`, `rangeIncludesValue`, `rangeIncludesStringValue`,
`rangeToFs`, `rangeStep`, `rangeEach`, `stringSucc`, `overlap`/`overlaps` in one
file with no Rails counterpart (`pnpm parity:api:extra --package activesupport` reports
it as `7 novel, 2 moved [no Rails counterpart]`).

Rails splits the same surface across `core_ext/range/`:

- `vendor/rails/activesupport/lib/active_support/core_ext/range/conversions.rb:39`
  (`to_fs` / `to_formatted_s`, `RANGE_FORMATS` at :3)
- `.../core_ext/range/each.rb:5` (`each`), `:12` (`step`)
- `.../core_ext/range/overlap.rb:7` (`overlap?`), `:22` (`overlaps` alias)
- `.../core_ext/range/compare_range.rb` — already ported by #6096 to
  `core-ext/range/compare-range.ts`, which is the shape to follow.

PR #6096 established the pattern: one TS file per Ruby file under
`core-ext/range/`, importing the `Range<T>` data triple from `range-ext.ts`,
with the receiver as the first parameter (Ruby `prepend` has no TS analogue).

## Converged shape

Move each function into the `core-ext/range/<file>.ts` its Ruby counterpart
lives in, under the `rubyMethodToTs` spelling (`to_fs` -> `toFs`, `overlap?` ->
`isOverlap`/`overlap`, `each` -> `each`, `step` -> `step`). `range-ext.ts` keeps
only the `Range<T>` interface and `makeRange` (the PERMANENT-tagged stand-in for
Ruby's core `Range` class), so the novel count on the file drops toward 1.

`stringSucc` is `String#succ` (a Ruby core method, not Rails) — it belongs with
the string core-ext, not with the range files.

## Acceptance criteria

- Each of conversions.rb / each.rb / overlap.rb has a matching TS file under
  `packages/activesupport/src/core-ext/range/`.
- `pnpm parity:api` gains those files; `pnpm parity:api:extra --package activesupport`
  shows `range-ext.ts` novel count reduced.
- Tests stay in `core-ext/range-ext.test.ts` (the file `parity:test` maps to
  `range_ext_test.rb`) — do NOT split the test file; #6096 measured that a split
  drops ~25 matched tests because compare_range.rb has no Ruby test file.
