---
title: "Response.create passes body through as Rails does"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Response.create` (`packages/actionpack/src/action-dispatch/http/response.ts`) is `headers = mergeDefaultHeaders(...)`, then `body = Array.isArray(body) ? body : [body]`, then `new this(status, headers, body)`. Rails' `self.create` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:159-162`) passes `body` through unchanged to `new`, whose `initialize(status = 200, headers = nil, body = [])` (`response.rb:171`) hands it to `self.body =`. The wrap is an arm Rails does not have; trails#9016 kept it when converging the local names.

## Acceptance criteria

- `create` passes `body` to the constructor as Rails does, with no `Array.isArray` arm, and a String body is handled where Rails handles it (`body=`, `response.rb:339-350`).
- The `body` parameter type matches what `new` accepts, so no wrap is needed to typecheck.
- `pnpm vitest run` on the response tests passes, and `parity:api:arms` reports no invented `if` on `create`.
