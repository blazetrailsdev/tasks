---
title: "server-path-actioncable-testing"
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
claim: "2026-11-09T13:20:31Z"
assignee: "port-help-and-version-commands-for-split-namespace"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds these testing modules reachable from a non-testing export of the built tree, each a row of `scripts/layout/server-path-closure-exclude.json` naming this story:

- `packages/actioncable/dist/{channel/test-case,connection/test-case,subscription-adapter/test,test-helper}.js`, from `@blazetrails/actioncable` (`dist/index.js`).

Rails' `action_cable.rb` reaches `TestCase`, `TestHelper` and `SubscriptionAdapter::Test` through `autoload` only (`vendor/rails/v8.0.2/actioncable/lib/action_cable.rb`).

## Acceptance criteria

- [ ] No non-testing export (including each `./*` wildcard expansion) of the built tree reaches these modules; they are reached only through testing subpath exports, or moved to `test/` when test-suite-private.
- [ ] Their rows are deleted from `server-path-closure-exclude.json`.
