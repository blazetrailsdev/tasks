---
title: "server-path-activerecord-testing"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9919
claim: "2026-11-09T14:20:28Z"
assignee: "server-path-actionmailer-testing"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds these testing modules reachable from a non-testing export of the built tree, each a row of `scripts/layout/server-path-closure-exclude.json` naming this story:

- `packages/activerecord/dist/{cases/helper,encryption/test-helpers,test-adapter,testing/query-assertions}.js`, `support/{async-helper,describe-if-*,setup-second-pool,supports}.js`, `test-helpers/{models/arunit2-model,models/index,test-schema}.js` (reached through `./*` expansions and `constants.query-assertions.generated`).

These mirror Rails' `activerecord/test/**` or `active_record/testing/*`, never loaded by `active_record.rb` (`vendor/rails/v8.0.2/activerecord/lib/active_record.rb`).

## Acceptance criteria

- [ ] No non-testing export (including each `./*` wildcard expansion) of the built tree reaches these modules; they are reached only through testing subpath exports, or moved to `test/` when test-suite-private.
- [ ] Their rows are deleted from `server-path-closure-exclude.json`.
