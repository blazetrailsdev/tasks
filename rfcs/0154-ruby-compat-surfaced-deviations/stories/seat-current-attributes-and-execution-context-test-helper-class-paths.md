---
title: "Seat CurrentAttributes::TestHelper and ExecutionContext::TestHelper in activesupport's class-path tables"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10210 ported `ActiveSupport::CurrentAttributes::TestHelper`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/current_attributes/test_helper.rb`) at
`packages/activesupport/lib/current-attributes/test-helper.ts`, and
`ActiveSupport::ExecutionContext::TestHelper`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/execution_context/test_helper.rb`) at
`packages/activesupport/lib/execution-context/test-helper.ts`. Neither is in activesupport's
generated class-path tables. `Executor::TestHelper` is, in `constants.test-helper.generated.ts`.
So `rbModName` / `rbInspect` cannot name the two modules by their Ruby paths. Running
`pnpm parity:class-paths` locally against stale builds rewrote 16 unrelated tables, so the
PR left the tables alone.

## Acceptance criteria

- `pnpm parity:class-paths`, run on a fresh build, seats
  `ActiveSupport::CurrentAttributes::TestHelper` and `ActiveSupport::ExecutionContext::TestHelper`.
- `pnpm parity:class-paths:check` is green.
