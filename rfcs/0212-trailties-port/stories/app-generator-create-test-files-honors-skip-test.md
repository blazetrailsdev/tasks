---
title: "app-generator-create-test-files-honors-skip-test"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`createTestFiles` in `packages/trailties/src/generators/rails/app/app-generator.ts` always writes `test/` files, so `trails new --skip-test` still creates `test/test-helper.ts`. Rails guards the step: `create_test_files` is `build(:test) unless options[:skip_test]` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb`).

## Acceptance criteria

- `createTestFiles` returns without writing under `skipTest`, as Rails' guard does.
