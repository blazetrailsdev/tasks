---
title: "Journey path/pattern test parity"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
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

`vendor/rails/actionpack/test/journey/path/pattern_test.rb` has 20 tests.
`journey-test-names-to-rails-def-test-form` credits 18 by re-spelling. Two
remain absent, and the convention file
`packages/actionpack/src/action-dispatch/journey/path/pattern.test.ts` holds 18
trails-only tests — the largest extra count in Journey.

The absent pair is whichever two of the Rails list the re-spelling does not
reach; `pnpm parity:test --package actiondispatch --missing` names them against
the file row after that story lands. Rails' list: `to regexp with extended
group`, `optional names`, `to regexp match non optional`, `to regexp with
group`, `match data with group`, `match data with multi group`, `star with
custom re`, `insensitive regexp with group`, `to regexp with strexp`, `to regexp
defaults`, `failed match`, `match controller`, and the rest of the 20.

## Acceptance criteria

- Every Rails test in `pattern_test.rb` has a matching `it` in the convention
  file; the two absent ones are ported from the Ruby, read whole first.
- The 18 trails-only tests move to a `journey/path/pattern.trails.test.ts`
  sibling. None is deleted.
- `pnpm parity:test --package actiondispatch` reports
  `journey/path/pattern_test.rb` at 20/20, 0 extra.
- Assertion mismatches on the 20 pairs are converged, not marked.
