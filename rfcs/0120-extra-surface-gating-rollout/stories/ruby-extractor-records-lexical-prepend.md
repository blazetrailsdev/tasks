---
title: "api-compare: Ruby extractor records prepend; LEXICAL_PREPENDS hand map is deleted"
status: draft
updated: 2026-10-04
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8463. `scripts/api-compare/extract-ruby-api.rb` records
`include` and `extend` (the `when "include"` arms near lines 981 and 1065) but
not `prepend`, so a prepended module never lands in a host's `includes` and
`collectAllowedNames` in `scripts/api-compare/extra-surface.ts` never walks it.

`ActiveSupport::TestCase` prepends two modules
(`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:145-146`):

    prepend ActiveSupport::Testing::SetupAndTeardown
    prepend ActiveSupport::Testing::TestsWithoutAssertions

To credit `setup` / `teardown` on `test-case.ts`, that PR added a hand-kept
`LEXICAL_PREPENDS` map in `extra-surface.ts` with one row for `TestCase`, plus a
`HOOK_INJECTED_MIXINS` row for `SetupAndTeardown.prepended`
(`testing/setup_and_teardown.rb:21-25`). The hand map is debt: every other
`prepend` in Rails is still invisible to the tool.

## Acceptance criteria

- [ ] The Ruby extractor records a lexical `prepend M` on the host entity (its own `prepends` list, or folded into `includes`, whichever keeps `compare.ts`'s flattening correct).
- [ ] `extra-surface.ts` walks extracted prepends, and `LEXICAL_PREPENDS` is deleted.
- [ ] `pnpm parity:api` and `pnpm parity:api:extra` deltas are reported per package in the PR; any name that newly scores as allowed is traced to a real Rails `prepend`.
- [ ] `pnpm parity:api:extra --package activesupport` still lists no `setup` / `teardown` on `test-case.ts`.
