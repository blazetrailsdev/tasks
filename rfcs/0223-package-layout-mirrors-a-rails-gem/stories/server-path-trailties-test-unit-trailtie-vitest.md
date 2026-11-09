---
title: "server-path-trailties-test-unit-trailtie-vitest"
status: in-progress
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9918
claim: "2026-11-09T14:35:33Z"
assignee: "lib-test-layout-tooling-inventory-rest"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds
`@blazetrails/trailties/all` → `dist/all.js` → `dist/test-unit/trailtie.js`,
which imports `vitest` (one row of
`scripts/layout/server-path-closure-exclude.json`). Rails' `rails/all.rb`
requires `rails/test_unit/railtie`
(`vendor/rails/v8.0.2/railties/lib/rails/test_unit/railtie.rb`), which loads
no test framework at boot: it only registers generators and rake tasks.

## Acceptance criteria

- [ ] `test-unit/trailtie.ts` reaches vitest only lazily from the code paths
      Rails' railtie defers (rake task bodies), so the static and dynamic
      graph from `./all` imports no vitest module; its row is deleted.
