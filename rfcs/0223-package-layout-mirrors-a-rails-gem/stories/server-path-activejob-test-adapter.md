---
title: "server-path-activejob-test-adapter"
status: done
updated: 2026-11-10
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9937
claim: "2026-11-09T23:05:24Z"
assignee: "server-path-activejob-test-adapter"
blocked-by: null
closed-reason: null
---

## Context

`packages/activejob/dist/queue-adapters/test-adapter.js` is a row of `scripts/layout/server-path-closure-exclude.json`. The gate counts it as testing code only because activejob's `./*` export expands to the key `./queue-adapters/test-adapter`, whose `test` token makes it a testing export (`isTestingExport`, `scripts/layout/server-path-closure.ts`). Rails ships it in lib and autoloads it from `queue_adapters.rb` (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters.rb`), so `queue_adapter = :test` resolves in any environment. trails imports it eagerly from `packages/activejob/lib/queue-adapters.ts:7` and `constants.generated.ts`.

## Acceptance criteria

- [ ] Decide (owner) whether the `:test` adapter is server-path code. If it is, the gate stops classifying it as testing. If it is not, it is reached only through its autoload.
- [ ] The row is deleted from `server-path-closure-exclude.json`.
