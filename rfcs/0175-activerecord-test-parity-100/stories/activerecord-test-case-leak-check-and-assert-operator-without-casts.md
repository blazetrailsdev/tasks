---
title: "activerecord-test-case-leak-check-and-assert-operator-without-casts"
status: draft
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
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
closed-reason: null
---

## Context

`packages/activerecord/src/cases/test-case.ts` ports `ActiveRecord::TestCase`
(`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:21-295`), with two
cast or inlined gaps left over from `activerecord-describes-are-named-test-case-constants`:

- `checkConnectionLeaks` reads `conn.owner.backtrace` and calls
  `conn.owner&.kill` (`test_case.rb:66-67`) through casts
  (`(conn.owner as { backtrace?: unknown }).backtrace`,
  `(conn.owner as Thread | null)?.kill()`). ruby-compat's `Thread` has no
  `backtrace`, and its `Fiber` has no `kill`.
- `assertQueriesMatch` calls `assert(matchedQueries.length >= 1, …)` where Rails
  calls `assert_operator matched_queries.size, :>=, 1, …` (`test_case.rb:123`).
  Minitest's `assert_operator`
  (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb`) is not ported.

## Acceptance criteria

- [ ] ruby-compat `Thread#backtrace` and `Fiber#kill` exist with MRI citations,
      and `checkConnectionLeaks` reads `owner.backtrace` and calls `owner.kill`
      with no cast.
- [ ] Minitest `assert_operator` is ported beside the other assertions, and
      `assertQueriesMatch` calls `assertOperator(matchedQueries.length, ">=", 1, …)`.
