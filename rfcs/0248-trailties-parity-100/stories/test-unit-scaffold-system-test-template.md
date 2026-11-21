---
title: "trailties: port test_unit scaffold system_test template"
status: ready
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TestUnit::Generators::ScaffoldGenerator#create_test_files` writes `system_test.rb.tt`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/scaffold/scaffold_generator.rb`;
template at `test_unit/scaffold/templates/system_test.rb.tt:19,36,38`), which branches on
`boolean?(attr)` and `datetime?(attr) || time?(attr)` to emit `check`/`fill_in` steps.
trails#10429 ported `isBoolean` / `isDatetime` / `isTime` on
`packages/trailties/lib/generators/test-unit/scaffold/scaffold-generator.ts`, but no
system-test template exists under the test-unit scaffold generator, so they have no caller.

## Acceptance criteria

- [ ] `system-test.ts.tt` ported from `system_test.rb.tt`, calling `isBoolean` / `isDatetime` / `isTime` at the Rails branch points.
- [ ] `create_test_files` writes it under the Rails guard (`options[:system_tests]`).
- [ ] The scaffold generator tests that assert the system test file are ported with Rails names.
