---
title: "assert-nothing-raised-does-not-register-with-vitest"
status: done
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#7930
claim: "2026-09-24T17:59:05Z"
assignee: "aes256-gcm-inspect-not-rails-format"
blocked-by: null
closed-reason: null
---

## Context

`assertNothingRaised` (`packages/activesupport/src/testing/assertions.ts:143`) ports Rails'
`assert_nothing_raised` (`activesupport/lib/active_support/testing/assertions.rb`, which `assert(true)`s after the block and so counts as an assertion).
A test whose only assertion is `await assertNothingRaised(...)` still prints vitest's
"Test is missing assertions" warning: seen in `packages/activerecord/src/migration.test.ts` for
"create table with if not exists true", "create table with force and if not exists" and
"create table with indexes and if not exists true" (Rails `migration_test.rb:173`, `:205`, `:212`).
The helper's `assert(true)` does not register with vitest's assertion counter.

## Acceptance criteria

- `assertNothingRaised` registers one assertion with vitest (e.g. through `expect.hasAssertions`-visible `expect`), so the warning disappears for tests that use only it.
- Related: `warn-missing-assertions-with-the-real-source-line`.
