---
title: "server-path-activemodel-lint"
status: ready
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
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

# server-path-activemodel-lint

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) reaches
`packages/activesupport/dist/testing/assertions.js` through
`@blazetrails/activemodel/lint` → `packages/activemodel/dist/lint.js`, which
imports Minitest-style assertions from activesupport's testing module. The
`./*` wildcard export makes `lint` a server-path entry. Rails autoloads
`ActiveModel::Lint` (`vendor/rails/v8.0.2/activemodel/lib/active_model.rb:48`)
and `lint.rb` is test-only (`ActiveModel::Lint::Tests` is included into a test
case). trails' activemodel index no longer re-exports `Lint` (server-path-activesupport-index-testing).

## Acceptance criteria

- [ ] `activemodel/lint` is not reachable as a server-path entry (a testing
      export key, or moved under a testing directory), or lint.ts no longer
      imports `activesupport/testing/*` at module-eval time.
- [ ] The `server-path-activemodel-lint` row is deleted from
      `scripts/layout/server-path-closure-exclude.json`.
