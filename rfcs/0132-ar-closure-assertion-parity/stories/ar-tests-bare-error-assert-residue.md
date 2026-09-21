---
title: "Remaining assertRaises([Error]) sites in AR tests"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#7935
claim: "2026-09-21T17:54:07Z"
assignee: "assertions-activesupport-cache-xml-json-callbacks"
blocked-by: null
closed-reason: null
---

## Context

trails#7930 converged the sites listed in `ar-tests-assert-bare-error-where-ruby-raises-runtimeerror`. Other `assertRaises([Error], ...)` sites remain in `packages/activerecord/src`, and each needs checking against its Rails class:

- `tasks/database-tasks.test.ts:1103-1143,1448-1472`
- `migration/foreign-key.test.ts:647,706`
- `adapters/sqlite3/sqlite3-adapter.test.ts:1149-1173`
- `adapters/abstract-mysql-adapter/active-schema.test.ts:221`
- `adapters/postgresql/extension-migration.test.ts:103`
- `assertions/query-assertions.test.ts:26-105`: these now raise `ActiveSupport::Testing::Assertion`, because the helpers go through `assert()` (`query_assertions.rb:22-80` uses `assert_equal`/`assert_operator`). Rails asserts `Minitest::Assertion`.

## Acceptance criteria

- Each site asserts the class its Rails counterpart names, cited `file:line`. The production raise site moves with it where needed.
