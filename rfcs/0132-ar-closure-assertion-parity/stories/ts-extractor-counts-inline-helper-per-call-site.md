---
title: "TS assertion extractor counts an in-test helper per call site, not lexically"
status: draft
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`collectAssertionKinds` / `countAssertions`
(`scripts/test-compare/extract-ts-core.ts:127-200,255-310`) expand a same-file
helper's body once per CALL SITE. A Ruby lambda assigned to a local and
`.call`ed N times is counted LEXICALLY ONCE by the Ruby extractor, so a
faithful port of that shape reports N x the assertions.

Concretely, `activerecord/test/cases/associations/eager_test.rb:169-185`
(`test_loading_associations_dont_leak_instance_state`) assigns an `assertions`
lambda and calls it twice. Porting it as an arrow function called twice scored
21 assertions against Rails' 7, so PR trails#7821 had to restructure the test
into a `for (const firm of [...])` loop — a shape Rails does not have — to land
at 7. Note the extractor ALSO treats a local named `assert*` as an assertion
callee itself (`isAssertionCallee`, `:38-41`), adding one more phantom count per
call.

## Acceptance criteria

- A same-file helper whose declaration is lexically INSIDE the test body is
  counted once, not once per call site, on the TS side — matching the Ruby
  extractor's treatment of a lambda local.
- `eager.test.ts`'s `loading associations dont leak instance state` can be
  written with the Rails lambda shape (an `assertions` local called twice) and
  still report 0 assertion-count and 0 assertion-kind mismatches.
- No package's counter in `scripts/test-compare/assertion-mismatch-mark.json`
  increases; reseed only downward.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
