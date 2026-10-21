---
title: "Make marcel's tests and test helper plain, typed vitest"
status: ready
updated: 2026-10-21
rfc: "0000-marcel-port-to-100"
cluster: marcel-polish
packages: ["marcel"]
deps: ["marcel-drop-codegen-shims"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The tests are already vitest `describe` / `it` with no test case instance, and
the gem's `Marcel::TestCase` helpers are exported functions
(`test-helpers/test-helper.ts`: `files`, `fixturePath`,
`eachContentTypeFixture`). What remains is generated noise:

- `test-helpers/test-helper.ts` has 11 inline dispatch / `rbStrSend` sites,
  mostly in `eachContentTypeFixture` (`test_helper.rb:29-40`).
- `mime-type.test.ts` filters `ObjectSpace.eachObject(File)` through an inline
  lambda; it is `[...ObjectSpace.eachObject(File)].filter((f) => !f.isClosed())`.
- `extension.test.ts` registers duplicate-extension tests as
  `it.skipIf(...)`, where Ruby's `test … unless extensions.include?(extension)`
  (`extension_test.rb:12-23`) defines no test at all: 2 phantom skips.
- `describe`-scoped ivar `let`s are typed `unknown` (`let path: unknown`).

## Acceptance criteria

- No inline dispatch lambda or `rbStrSend` in the test files or test helper.
- `extension.test.ts` defines a test only where Ruby does; the skip count
  drops to the one `PERMANENT-SKIP`.
- Ivar `let`s carry real types; assertions use built-in matchers where they
  give Ruby's answer and `@blazetrails/vitest-matchers` otherwise
  (CONTRIBUTING.md "Porting a Minitest assertion").
- Test names are unchanged.
