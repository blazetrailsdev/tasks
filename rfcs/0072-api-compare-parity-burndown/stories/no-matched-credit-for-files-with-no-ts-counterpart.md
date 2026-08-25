---
title: "Stop crediting matched members to Ruby files that have no TS counterpart at all"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6414
claim: "2026-08-12T14:06:02Z"
assignee: "converge-collection-proxy-create-delegates-to-association"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6411 while excluding out-of-closure activesupport files.
`vendor/rails/activesupport/lib/active_support/execution_wrapper.rb` was
credited with `matched: 2` in `scripts/api-compare/output/api-comparison.json`
even though its `expectedTsFile` (`execution-wrapper.ts`) does not exist and
`grep -rn "ExecutionWrapper\|execution_wrapper" packages/activesupport/src`
returns nothing — there is no port of it anywhere in the tree. The two matches
came in through the cross-file `moves` credit: a TS name that happens to equal a
Ruby member name in a DIFFERENT file is credited to the Ruby file.

Consequence: `matched` (and therefore `percent`) overstates real parity by the
size of the name collisions, and the overstatement is invisible — a file with a
0-line port reads as partially ported. Adding the file to `UNPORTED_FILES` in
PR #6411 made the phantom credit visible only because `matched` went DOWN by 2 on a
pure scope-declaration commit, which is otherwise a red flag a reviewer has to
chase.

Related, already-landed work in this RFC on the same accounting seam:
`home-bucket-must-credit-each-reopening-to-its-own-file`,
`credit-mixin-methods-ported-in-their-own-file`,
`credit-inherited-methods-to-the-ancestor-that-defines-them`.

## Converged shape

A Ruby file whose `expectedTsFile` does not exist, and onto which no TS file
maps, should not accumulate `matched` credit from unrelated files. Either:

- gate `moves` credit on the target Ruby file having SOME real TS counterpart
  (the `moves` list already distinguishes "found, just in a different .rb"), or
- keep the cross-file match reported as advisory `moves` only and stop rolling
  it into `matched`.

Whichever way it lands, `matched` must mean "a TS member the compare can point
at in a file that maps to this Ruby file".

## Acceptance criteria

- No Ruby file with a non-existent `expectedTsFile` and no mapped TS file
  reports `matched > 0`.
- A sweep of the artifact reports how many members and which packages the fix
  moves; the totals change is stated in the PR body, since the stats DB reads
  `percent`.
- `scripts/api-compare/*.test.ts` gains a regression covering the phantom-credit
  case.
