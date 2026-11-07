---
title: "ActionDispatch::Request includes Rack::Request::Env instead of re-implementing header accessors"
status: draft
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Request` includes `Rack::Request::Env` and `Rack::Request::Helpers` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:21-24`), so it has no `get_header`, `has_header?`, `set_header`, `add_header` or `each_header` of its own. trails' `packages/actionpack/src/action-dispatch/http/request.ts` re-implements these:

- `getHeader` at :381 returns `this.env[name]`, which reads `undefined` on a miss. `Rack::Request::Env#get_header` (`vendor/rack/v3.2.8/lib/rack/request.rb:105-107`) reads nil, which trails#9831 ported as `null`.
- `eachHeader` at :404 returns `void` and requires a block. Rack's (`request.rb:116-118`) returns the env, or `to_enum` when blockless.

## Acceptance criteria

- `ActionDispatch::Request` gets these methods through `include(Request, Env)` from `@blazetrails/rack` instead of declaring them, and the duplicates are deleted.
- `getHeader` reads null on a miss for ActionDispatch requests; callers' `?? null` guards that Rails lacks are dropped.
