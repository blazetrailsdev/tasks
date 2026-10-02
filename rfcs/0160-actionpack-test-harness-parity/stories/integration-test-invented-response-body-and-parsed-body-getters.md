---
title: "Remove IntegrationTest's invented responseBody / parsedBody getters"
status: in-progress
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8370
claim: "2026-10-02T00:53:25Z"
assignee: "arel-attribute-and-sql-literal-are-not-nodes"
blocked-by: null
closed-reason: null
---

## Context

`IntegrationTest` (`packages/actionpack/src/action-dispatch/testing/integration.ts:355-361`)
carries two getters with no Rails counterpart:

```ts
get responseBody(): string {
  return this.response?.body ?? this.controller?.responseBody ?? "";
}
get parsedBody(): unknown {
  return JSON.parse(this.responseBody);
}
```

Rails' `ActionDispatch::Integration::Session` delegates
`:status, :status_message, :headers, :body, :redirect?` to `response` and
`:path` to `request`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:97-98`).
The body reader is `body`, not `response_body`, and `parsed_body` is
`ActionDispatch::TestResponse#parsed_body` — a test reads
`response.parsed_body` (`integration.rb:625-645`), never `parsed_body` on the
session.

`ActionController::TestCase` had the same two getters; they were removed in
trails PR 8361 (`test-case-process-invented-headers-and-env-options`).

Callers of the integration getters: `t.responseBody` in
`packages/actionpack/src/action-controller/controller/integration.test.ts:812,819`
and `packages/actionpack/src/action-controller/controller/flash.trails.test.ts:56`
(grep `\.responseBody\b` / `\.parsedBody\b` on an `IntegrationTest` receiver
for the rest).

## Acceptance criteria

- `IntegrationTest#responseBody` and `#parsedBody` are removed.
- Callers read `body` (the Rails delegation at `integration.rb:97`) or
  `response.body` / `response.parsedBody`, as the corresponding Rails test does.
- `pnpm parity:api:extra --package actiondispatch` no longer lists either name
  for `testing/integration.ts`.
