---
title: "test:compare — symmetric non-assert helper expansion for assertion counts"
status: done
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 4390
claim: "2026-07-02T00:16:14Z"
assignee: "assertion-count-symmetric-helper-expansion"
blocked-by: null
---

## Context

Follow-up from PR #4372 (assertion-count comparison in `scripts/test-compare`).
Assertion counts are collected from the **test body only** on both extractors
(`extract-ruby-tests.rb` `find_assertions`, `extract-ts-core.ts`
`countAssertions`). Helper-delegated tests therefore count 0 direct assertions
even though they assert heavily via a same-file/class helper, e.g. Rails
`test_dump_indexes_for_schema_one` → `do_dump_index_tests_for_schema` (~15
asserts), `duel` (2), `test_copy_table`; trails delegates too (`testCopyTable`).

A one-level, **Rails-only** expansion was prototyped (scratchpad
`helper_expand.rb`) and is a net regression:

- FIXES `multiple find or create by within transactions` (0 → 2, matches trails).
- BREAKS `copy table with binary column` (Rails 0 → 3 vs trails 0) because the
  trails body ALSO delegates (`await testCopyTable(...)`) and the TS side isn't
  expanded — one-sided expansion manufactures a false mismatch.
- Only PARTIALLY resolves `dump indexes for schema one` (0 → 7 vs trails 15)
  because the helper calls sub-helpers (`do_dump_index_assertions_for_one_index`
  ×4) — one level isn't enough.

The design's value is that both sides use the SAME counting rule, so expansion
must be symmetric (both extractors) and recursive (depth-limited).

## Acceptance criteria

- Both extractors resolve calls to **same-file / same-class non-assertion
  helper methods** and add the helper's assertion count, recursively with a
  depth cap and cycle guard (no double-counting, no infinite recursion).
- `copy table with binary column` stays a 0-diff match (both expand `testCopyTable`
  / `test_copy_table` to the same count).
- `dump indexes for schema *` and `multiple find or create by *` count their
  true (expanded) assertions on both sides.
- Handle Ruby `:vcall` / `:command_call` helper calls and loops/`yield`/blocks
  sensibly (document static-vs-runtime limitations).
- Report-only; no CI gate. Add extractor unit tests for the expansion + the
  `copy_table` symmetry trap.
