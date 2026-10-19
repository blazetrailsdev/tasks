---
title: "rack-forward-request-initialize-env-and-call-recursion"
status: draft
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::ForwardRequest#initialize` (`vendor/rack/v3.1.14/lib/rack/recursive.rb:17-28`) parses `URI(url)` and writes `PATH_INFO`, `QUERY_STRING` (if any), `HTTP_HOST`, `HTTP_PORT`, `RACK_URL_SCHEME` into `@env`, with message "forwarding to #{url}". `Recursive#_call` (`recursive.rb:45-50`) rescues it with `call(env.merge(req.env))`.

trails (`packages/rack/src/recursive.ts`): `ForwardRequest` extends `Error` (not a Ruby `Exception` analogue) and its constructor only stores `url`/`env` with message `ForwardRequest: ${url}`. `_call` instead loops with `while (true)` and does the URL parse itself through `new URL(e.url, "http://localhost")`, writing only `PATH_INFO`/`QUERY_STRING`.

## Acceptance criteria

- `ForwardRequest`'s constructor mirrors `recursive.rb:17-28` key for key, with Rails' message.
- `_call` mirrors `recursive.rb:45-50`: rescue `ForwardRequest` and `return this.call({ ...env, ...req.env })`. No loop and no URL parse in `_call`.
- `recursive.test.ts` "support forwarding" stays green.
