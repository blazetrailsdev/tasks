---
title: "activerecord: each vitest describe gets a Minitest describe class; every activerecord test is an ActiveRecord::TestCase; describedClasses and topLevel are deleted"
status: in-progress
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps:
  - activerecord-test-case-remaining-members
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8898
claim: "2026-10-14T01:31:42Z"
assignee: "activerecord-describes-are-named-test-case-constants"
blocked-by: null
closed-reason: null
---

## Context

`fixtures()` (`packages/activerecord/src/test-helpers/use-fixtures.ts`,
`testCaseClassFor`) builds an anonymous `ActiveRecord::TestCase` subclass per
describe and registers it in `describedClasses`, keyed by suite object, with a
file-level call registered under `topLevel`. Both live in
`packages/activesupport/src/testing/autorun.ts` with
`@noRailsEquivalent CONVERGEABLE` receipts naming this story. Every describe
that never calls `fixtures()` gets a bare `ActiveSupport::TestCase`, so 405
activerecord test files run without `use_transactional_tests`
(`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:33`) or
`check_connection_leaks` (`:35-38`), although Rails has every test class inherit
`ActiveRecord::TestCase` (`:21`).

The original premise was to name every describe's class as a constant and have
`safeConstantize(suite.name)` resolve it. The repo owner ruled that out on
2026-10-14: trails stays in the vitest ecosystem, with `describe` / `it` as the
base. A ~570-file codemod buys nothing a metric measures, and the ~950
prose-named describes in `.trails` tests can't be constants anyway.

The Ruby model for a vitest `describe` is Minitest's own `Kernel#describe`
(`vendor/minitest/v5.27.0/lib/minitest/spec.rb:86-102`). Each block is a class
created by `sclas.create(name, desc)` (`:275-286`) from the enclosing describe's
class, or at the top from `spec_type(desc)` (`:165-173`), which searches the
`TYPES` that `register_spec_type` (`:151-158`) prepends to. A prose description
is fine there: the class is not a constant.

## Acceptance criteria

- [ ] `autorun.ts` ports `TYPES`, `register_spec_type`, `spec_type` and
      `create`, and resolves each test's class through a `Kernel#describe` port
      over the vitest suite chain. A suite named after a `TestCase` constant is
      still that class. A file-level class sits under the top-level describes.
- [ ] `describedClasses` and `topLevel` are deleted with their receipts, and
      `fixtures()` declares on the describe's class.
- [ ] `cases/helper.ts` registers activerecord's spec type, so every
      activerecord test is an `ActiveRecord::TestCase`. A Rails-backed describe
      sets `useTransactionalTests = false` only where its Rails class does. A
      Rails-backed test that breaks under the transactional default is
      converged to its Rails body, not opted out.
- [ ] Out of scope: `check_connection_leaks`' `owner.backtrace` / `owner.kill`
      casts and `assert_queries_match`'s inlined `assert_operator`. They wait on
      ruby-compat `Thread#backtrace` / `Fiber#kill` and Minitest
      `assert_operator`, filed separately.
