---
title: "assertions-activesupport-module-class-remainder"
status: ready
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `assertions-activesupport-module-class-and-object`, which shipped the
`core_ext/object/*` files (try, to_query, deep_dup, inclusion, with, blank,
to_param, acts_like, json_cherry_pick, instance_variables) under the 700 LOC
ceiling. The remaining divergences, measured with
`pnpm parity:test -- --assertions --missing --package activesupport` against
`vendor/rails/activesupport/test/`:

- `core_ext/module_test.rb` (25 count / 37 kind / 12 value) — delegation tests
- `concern_test.rb` (8/14/2)
- `core_ext/module/attribute_accessor_per_thread_test.rb` (10/11/3)
- `core_ext/module/attribute_accessor_test.rb` (12/11/1)
- `core_ext/secure_random_test.rb` (6/6/0)
- `core_ext/module/introspection_test.rb` (5/6/0)
- `core_ext/class/attribute_test.rb` (5/5/0)
- `core_ext/module/attr_internal_test.rb` (4/4/1)
- `core_ext/digest/uuid_test.rb` (4/4/0)
- `core_ext/module/concerning_test.rb` (3/4/1)
- `core_ext/file_test.rb` (2/4/0)
- `core_ext/kernel_test.rb` (2/3/1)
- `core_ext/module/remove_method_test.rb` (3/3/0)
- `core_ext/module/attribute_aliasing_test.rb` (2/2/1)
- `core_ext/name_error_test.rb`, `core_ext/load_error_test.rb`,
  `core_ext/module/anonymous_test.rb`, `descendants_tracker_test.rb`,
  `core_ext/class_test.rb`
- leftovers in `core_ext/object/`: `deep_dup_test.rb` "anonymous modules are
  duped" (a JS class cannot be dup'd; `deepDup` in
  `packages/activesupport/src/hash-utils.ts` returns functions as-is, Rails
  `Module#deep_dup` at `core_ext/object/deep_dup.rb` dups anonymous modules),
  and `duplicable_test.rb` (Rails loops `OBJECTS` with `v.dup` rescue
  `TypeError`, then `assert_predicate`/`assert_not_predicate`).

The mark is `scripts/test-compare/assertion-mismatch-mark.json`; use
`assertNotRespondTo` / `assertPredicate` from
`packages/activesupport/src/testing/assertions.ts` for Rails helper kinds.

## Acceptance criteria

- Every file listed reports 0 count / kind / value mismatches.
- The activesupport row of `assertion-mismatch-mark.json` is lowered by exactly
  this story's contribution.
- No test name changes; activesupport `parity:test` percent does not drop.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
