---
title: "ActionDispatch::Request#initialize's own body and the reader memos it seeds are unported"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8856, which inlined `Http::URL#initialize` and `Http::FilterParameters#initialize` into `Request`'s constructor but left the class's own `initialize` unported.

`ActionDispatch::Request#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:64-75`) is `super`, then `@rack_request = Rack::Request.new(env)`, then `@method`, `@request_method`, `@remote_ip`, `@original_fullpath`, `@fullpath` and `@ip` set to `nil`.

trails' constructor (`packages/actionpack/src/action-dispatch/http/request.ts`) runs the three inlined module bodies and stops. It builds no `@rack_request`, `#method` and `#requestMethod` are `#` fields that start `undefined`, and `@remote_ip` (`request.rb:313-317`), `@original_fullpath` (`:261`), `@fullpath` (`:272`) and `@ip` (`:307`) have no memo at all, so each reader recomputes where Rails answers `@x ||=`.

The `FilterParameters` readers (`packages/actionpack/src/action-dispatch/http/filter-parameters.ts`) test `!= null` and assign, where `filter_parameters.rb:33-55` is `@x ||= ...`.

An earlier story for this, `port-request-initialize-rack-request` (RFC 0084), was closed as out of scope, not converged.

## Acceptance criteria

- `Request`'s constructor ends with the body of `request.rb:64-75`, line for line, after the inlined module segments.
- `method`, `request_method`, `remote_ip`, `original_fullpath`, `fullpath` and `ip` memoize as their Rails readers do, and `remote_ip=` clears its memo (`request.rb:316-318`).
- The four `FilterParameters` readers are written as `||=`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green with no new baseline row.
