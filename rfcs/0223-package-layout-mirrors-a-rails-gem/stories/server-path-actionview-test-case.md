---
title: "server-path-actionview-test-case"
status: claimed
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-09T16:20:43Z"
assignee: "server-path-actionpack-testing"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds these testing modules reachable from a non-testing export of the built tree, each a row of `scripts/layout/server-path-closure-exclude.json` naming this story:

- `packages/actionview/dist/{rails-dom-testing/assertions,test-case}.js`.

Rails' `action_view.rb` autoloads `TestCase` (`vendor/rails/v8.0.2/actionview/lib/action_view.rb`); rails-dom-testing is a test-only gem.

## Acceptance criteria

- [ ] No non-testing export (including each `./*` wildcard expansion) of the built tree reaches these modules; they are reached only through testing subpath exports, or moved to `test/` when test-suite-private.
- [ ] Their rows are deleted from `server-path-closure-exclude.json`.
