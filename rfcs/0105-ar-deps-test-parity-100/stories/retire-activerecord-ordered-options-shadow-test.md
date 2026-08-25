---
title: "retire-activerecord-ordered-options-shadow-test"
status: closed
updated: 2026-08-18
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of 0023-surfaced-deviations/dedupe-ordered-options-test-across-packages (filed 2026-08-16 from #6611), which now carries this story's post-#6692 context."
---

## Context

`packages/activerecord/src/ordered-options.test.ts` is an invented duplicate of
Rails' `activesupport/test/ordered_options_test.rb`: it opens
`describe("OrderedOptionsTest")` and repeats that file's test names verbatim
(`usage`, `looping`, `string dig`, `raises with bang`, ...) with made-up bodies
that assert made-up behaviour. Its header says so — "Tests to increase Rails
test coverage matching."

It is credited by nothing: `pnpm parity:test -- --package activerecord` matches
against Rails' activerecord tests, and `ordered_options_test.rb` is an
activesupport file. The real port now lives at
`packages/activesupport/src/ordered-options.test.ts` (landed alongside this
story), so the activerecord copy is a shadow that can only drift.

It already has: three of its assertions encoded pre-convergence bugs in
`OrderedOptions` (`to_s` returning the `#<...>` form rather than `Hash#to_s`,
and `in` being treated as a membership test where
`respond_to_missing?` answers true for every name). Those three were patched in
place to unblock the parent PR rather than deleted, because deleting the 260-line
file would have blown its LOC ceiling.

## Acceptance criteria

- `packages/activerecord/src/ordered-options.test.ts` is deleted.
- `pnpm parity:test` percent does not drop for activerecord or activesupport
  (confirming the file was crediting nothing).
- No new rows in `scripts/parity/unported-files/`.
