---
title: "Port Integration::Session's delegated readers and host!"
status: in-progress
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8210
claim: "2026-09-28T02:14:25Z"
assignee: "integration-session-delegated-readers-and-host-bang"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actiondispatch` reports `testing/integration.rb` at
92/98. Five of the six missing rows are one Rails line each:

- `delegate :status, :status_message, :headers, :body, :redirect?, to: :response, allow_nil: true`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:97`)
- `delegate :path, to: :request, allow_nil: true` (`:98`)

`status` is credited; `status_message`, `body`, `redirect?` and `path` are
missing and `headers` is declaration-only. `allow_nil: true` means each returns
`nil` when there is no response yet — it does not raise.

The sixth is `Session#host!`, which sets the default host for later requests.

trails' `IntegrationTest` is `packages/actionpack/src/action-dispatch/testing/integration.ts:68`.

## Acceptance criteria

- The six members exist on `Session` at the Rails names (`isRedirect` for
  `redirect?`, `hostBang` for `host!`) and return `null` before the first
  request, as `allow_nil` does.
- `pnpm parity:api --package actiondispatch` reports `testing/integration.rb`
  98/98.
