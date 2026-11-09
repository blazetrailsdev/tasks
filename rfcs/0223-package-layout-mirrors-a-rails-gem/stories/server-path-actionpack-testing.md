---
title: "server-path-actionpack-testing"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9923
claim: "2026-11-09T16:20:43Z"
assignee: "server-path-actionpack-testing"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds
`packages/actionpack/dist/index.js` reaching `action-dispatch/testing/*`
through `namespaces.js`, `constants.generated.js` and `action-dispatch/index.js`
(`assertion-response`, `assertions`, `assertions/response`,
`assertions/routing`, `integration`, `request-encoder`,
`test-helpers/page-dump-helper`, `test-process`, `test-request`,
`test-response`: 10 rows of `scripts/layout/server-path-closure-exclude.json`).
Rails' `action_dispatch.rb` reaches `ActionDispatch::Integration`,
`TestRequest`, `TestResponse` and `Assertions` only through `autoload`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch.rb`), never loaded on the
server path.

## Acceptance criteria

- [ ] The `.` entry's import graph reaches no `action-dispatch/testing/*`
      module; the namespace seats for them are made by the testing entry.
- [ ] The 10 rows are deleted from `server-path-closure-exclude.json`.
