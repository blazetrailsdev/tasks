---
title: "server-path-activesupport-index-testing"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9915
claim: "2026-11-09T13:51:27Z"
assignee: "server-path-activesupport-index-testing"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds
`packages/activesupport/dist/index.js` importing every `testing/*` module:
`testing/assertions`, `constant-lookup`, `deprecation`,
`error-reporter-assertions`, `isolation`, `method-call-assertions`,
`setup-and-teardown`, `stream`, `tagged-logging`, `time-helpers` (10 rows of
`scripts/layout/server-path-closure-exclude.json`). Rails' `active_support.rb`
autoloads none of them; `active_support/testing/*` is reached only by an
explicit `require` (`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb`).

## Acceptance criteria

- [ ] `@blazetrails/activesupport`'s `.` entry no longer imports any
      `testing/*` module; consumers import them from the testing subpath
      exports.
- [ ] The 10 `packages/activesupport/dist/testing/*` rows are deleted from
      `server-path-closure-exclude.json`.
