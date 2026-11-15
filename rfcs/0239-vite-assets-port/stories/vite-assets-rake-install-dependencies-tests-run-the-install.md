---
title: "rake_tasks_test install_dependencies tests run the real install and glob node_modules"
status: draft
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/test/rake_tasks_test.rb:23-46` runs `bundle exec rake vite:install_dependencies` in `test/test_app`, then asserts that `installed_node_module_names` (`:58-61`, a `Dir.glob("*")` over the app's `node_modules`) includes `right-pad`, a devDependency. `packages/vite-assets/test/rake-tasks.test.ts` (trails#10144) instead swaps in a fake `ChildProcessAdapter#system` and asserts the command and `NODE_ENV=development` it was handed. Two receipts in `scripts/test-compare/assertion-receipts/vite-assets.ts` re-score Rails' `assert_includes` as that equality.

## Acceptance criteria

- Both `install dependencies` tests run the real `vite:install_dependencies` against `test/test_app`, through the package manager `test_app` resolves to, and glob its `node_modules` as `installed_node_module_names` does. A CI-safe offline package cache is acceptable.
- Both receipts are removed, and the tests assert `assert_includes ..., "right-pad"` as Rails does.
