---
title: "Ported Rails assertion modules import Minitest from @blazetrails/minitest"
status: draft
updated: 2026-10-22
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: minitest-package
packages: [activesupport, actionpack, actionview, activemodel, activerecord, minitest]
deps: [minitest-package-ports-assertions-rb, minitest-package-ports-mock]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

These non-test files mirror Rails modules whose Ruby bodies call Minitest
assertions, and today import them from `@blazetrails/activesupport` or a
relative `testing/assertions.js` (measured by import-resolved grep, 2026-10-22):

- `packages/actionpack/src/action-dispatch/testing/assertions/routing.ts` (`assertEqual`, `message`)
- `packages/actionview/src/testing/selector-assertions.ts` (`assert`, `assertEqual`, `assertOperator`)
- `packages/actionview/src/testing/selector-assertions/html-selector.ts` (`diff`)
- `packages/actionview/src/testing/dom-assertions.ts` (`assert`)
- `packages/activemodel/src/lint.ts` (`assert`, `assertEqual`, `assertKindOf`, `assertRespondTo`)
- `packages/activerecord/src/testing/query-assertions.ts` (`assert`)
- `packages/activerecord/src/encryption/test-helpers.ts` (`assertEqual`, `assertNotEqual`)
- `packages/activesupport/src/cache/behaviors/cache-{delete-matched,increment-decrement,instrumentation,store-coder,store}-behavior.ts`
- `packages/activesupport/src/testing/{error-reporter-assertions,deprecation}.ts`

Rails' own counts: `assertions.rb` calls `assert` 5×, `assert_equal` 2×,
`refute_equal`, `assert_nil`, `assert_match` once each, `message` 27×;
`error_reporter_assertions.rb` calls `assert` 2×, `assert_equal` 3×,
`assert_predicate` 2×.

## Acceptance criteria

- [ ] Every file above imports its Minitest names from `@blazetrails/minitest`,
      and each package that does so declares the dependency (and tsconfig
      reference) on it.
- [ ] No call is removed or rewritten to `expect`: these are ported Rails
      bodies, and `pnpm parity:api:calls` / `parity:api:calls:args` stay green.
