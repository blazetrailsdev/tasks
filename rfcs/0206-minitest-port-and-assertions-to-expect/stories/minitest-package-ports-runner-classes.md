---
title: "Move Minitest's runner classes (Assertion, Skip, UnexpectedError, BacktraceFilter, Test) into @blazetrails/minitest"
status: draft
updated: 2026-10-22
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: minitest-package
packages: [minitest, activesupport]
deps: [minitest-package-ports-assertions-rb]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activesupport/src/testing/assertions.ts:33-300` ports
`Minitest::Assertion` (`vendor/minitest/v5.27.0/lib/minitest.rb:1035`), `Skip`
(`:1065`), `UnexpectedError` (`:1074`), `BacktraceFilter` (`:1190`), the
`Minitest` module object, and `Minitest::Test`
(`vendor/minitest/v5.27.0/lib/minitest/test.rb:10`), all with
`@noRailsEquivalent PERMANENT`. Their consumers are
`activesupport/src/testing/autorun.ts`, `test-case.ts`,
`testing/setup-and-teardown.ts` and `testing/tests-without-assertions.ts`.

## Acceptance criteria

- [ ] Those classes and the `Minitest` object live in `@blazetrails/minitest`
      at the files mirroring `lib/minitest.rb` and `lib/minitest/test.rb`, with
      receipts dropped where `parity:api` now credits them.
- [ ] The four activesupport consumers import them from `@blazetrails/minitest`.
- [ ] `testing/assertions.ts` holds no Minitest class.
- [ ] The activesupport tests of these consumers pass
      (`pnpm vitest run packages/activesupport/src/testing/`), and the
      `parity:api*` gates are green.
