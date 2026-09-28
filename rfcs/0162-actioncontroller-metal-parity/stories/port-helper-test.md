---
title: "Port controller/helper_test.rb"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-view-and-helper-test-fixtures",
    "abstract-controller-class-attributes-and-helper-resolution",
    "port-helper-attr",
    "port-the-controller-helper-proxy",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/helper_test.rb` has no trails
file at `controller/helper.test.ts` (22 tests):

- `HelperPathsTest` (`:77`), 1 — `helpers_path` priority across two paths
- `HelpersTypoControllerTest` (`:87`), 1 — `helper "admin/users"` raises
  `NameError` whose `detailed_message` carries a did-you-mean hint
- `HelperTest` (`:95-279`), 17 — `helper`, `helper_method` with args and
  kwargs and its error backtrace, `helper_attr`, nested and acronym
  controllers, `clear_helpers`, `all_helpers` (including an alternate helper
  dir), and the `helpers` proxy on the class and the instance
- `IsolatedHelpersTest` (`:281`), 3

It reads `fixtures/helpers`, `helpers1_pack`, `helpers2_pack`, `helpers_typo`
and `alternate_helpers`.

## Acceptance criteria

- `controller/helper.test.ts` ports all 22 tests in Rails order. The typo test
  asserts `detailed_message`'s did-you-mean hint, which is blocked
  (`helper-name-error-has-no-did-you-mean`, RFC 0141); it is ported with that
  assertion and skipped with the story id until the blocker lands, so the rest
  of the file does not wait.
- The file reports 22/22 in `pnpm parity:test --package actioncontroller`, one
  of them skipped against the named blocker.
