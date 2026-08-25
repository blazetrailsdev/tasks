---
title: "Port ErrorReporterAssertions and ConstantStubbing into the TestCase receiver"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 6512
claim: "2026-08-14T11:46:26Z"
assignee: "drop-builder-association-scope-option-shim"
blocked-by: null
closed-reason: null
---

## Context

Residual of `port-active-support-test-case-receiver` (PR #6510), which ported
`ActiveSupport::TestCase` (`packages/activesupport/src/test-case.ts` ←
`activesupport/lib/active_support/test_case.rb`) and wrote its include list
down once. Two of the modules that list `include`s have no port to name:

- `activesupport/lib/active_support/testing/error_reporter_assertions.rb`
  (`test_case.rb:148`) — `assert_error_reported`, `assert_no_error_reported`
  and the `ErrorCollector` that backs them. No `testing/error-reporter-assertions.ts`
  exists at all.
- `activesupport/lib/active_support/testing/constant_stubbing.rb`
  (`test_case.rb:150`) — `stub_const`; `parity:api` reports
  `testing/constant-stubbing.ts  0/1  0%`.

Both were listed as missing members of `test_case.rb` itself (the include list
is flattened into that file's expected surface), so porting them moves both
their own rows and `test_case.rb`'s 25/40.

## Converged shape

Port each file under its Rails path with Rails' method names and control flow,
then add one assignment block per `include` to `test-case.ts`, in Rails' order
(`test_case.rb:148` then `:150`, i.e. after Assertions and after Deprecation
respectively).

## Acceptance criteria

- [ ] `testing/error-reporter-assertions.ts` and `testing/constant-stubbing.ts`
      exist; their `parity:api` rows and `test_case.rb`'s move up.
- [ ] `test-case.ts` includes both at Rails' positions.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
