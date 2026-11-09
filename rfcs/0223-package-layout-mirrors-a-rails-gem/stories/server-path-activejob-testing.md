---
title: "server-path-activejob-testing"
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

- `packages/activejob/dist/{queue-adapters/test-adapter,test-case,test-helper}.js`, from `@blazetrails/actionmailer` → activejob.

Rails' `active_job.rb` autoloads `TestCase` / `TestHelper` (`vendor/rails/v8.0.2/activejob/lib/active_job.rb`).

## Acceptance criteria

- [ ] No non-testing export (including each `./*` wildcard expansion) of the built tree reaches these modules; they are reached only through testing subpath exports, or moved to `test/` when test-suite-private.
- [ ] Their rows are deleted from `server-path-closure-exclude.json`.
