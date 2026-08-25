---
title: "Triage activesupport's 291 skip stubs into port-or-exclude dispositions"
status: ready
updated: 2026-08-13
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activesupport"
deps:
  - "derive-ar-closure-test-manifest"
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activesupport's 451 remaining tests are **291 `it.skip`/`todo` stubs** and 160
genuinely absent tests (measured 2026-08-13). A stub is not a pass —
`scripts/test-compare/compare.ts:694-695` increments `matchedSkipped` and
`compare.ts:894-895` subtracts it — but it is a different kind of work from a
missing test: the file exists and holds the Rails name verbatim, so the question
is only whether the case can run in TypeScript.

Many plainly cannot, and those must become reasoned case-level `tests:`
exclusions rather than ports. The concentrations, in-closure by the manifest
from `derive-ar-closure-test-manifest`:

- `core_ext/hash_ext_test.rb` — 44 stubs (of 93 Rails tests)
- `share_lock_test.rb` — 25 (thread/monitor semantics)
- `core_ext/date_and_time_compatibility_test.rb` — 21
- `core_ext/string_ext_test.rb` — 15, `core_ext/array/conversions_test.rb` — 12
- `json/encoding_test.rb` — 11, `dependencies_test.rb` — 10
- `core_ext/time_ext_test.rb` — 6, `core_ext/date_ext_test.rb` — 5,
  `core_ext/date_time_ext_test.rb` — 5, `core_ext/class/attribute_test.rb` — 5,
  `inflector_test.rb` — 4, `concurrency/load_interlock_aware_monitor_test.rb` — 3
- plus ~35 across smaller in-closure files

Out-of-closure stubs (91) are not in this story's scope — they belong with RFC
0101's cache/XmlMini enrollment work.

## Acceptance criteria

- Every in-closure skip stub has a written disposition: **port** (which of the
  porting stories takes it) or **exclude** (a case-level `tests:` entry with a
  reason naming the specific Ruby-only mechanism — threads, `Marshal`, `Ractor`,
  `ObjectSpace`, fork).
- The exclusion dispositions are landed as case-level entries in this PR; the
  reasons are specific enough that a reviewer can check them against the Rails
  test body.
- The port dispositions are reflected by editing the porting stories below
  (`pnpm tasks edit`), so their scopes are real rather than estimated.
- The PR body states the resulting in-closure remaining count and how it splits
  port vs exclude.
