---
title: "rack-request-env-header-accessors"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

`Rack::Request` includes `Rack::Request::Env`
(`vendor/rack/lib/rack/request.rb:82`, included at :789), which defines
`has_header?` (:95), `get_header` (:100) and `set_header` (:116);
`Rack::Request::Helpers` (:149) defines `body` (:190).

`packages/rack/src/request.ts:120` names these `has` / `get` / `set`
(:131-:143) and has no `body` at all. api-compare scored them as matched only
because the includer graph resolved `include Helpers` to the _sibling_
`Rack::Response::Helpers`, so `packages/rack/src/response.ts:142-150` counted
as their implementation site. PR #5344 scoped that resolution to Ruby's
constant lookup, making the four a visible gap.

## Acceptance criteria

- `packages/rack/src/request.ts` exposes `hasHeader` / `getHeader` /
  `setHeader` / `body` matching `Rack::Request::Env` and `::Helpers` semantics.
- Existing `has`/`get`/`set` callers migrate; do not keep a Rails-less alias
  unless Rack itself has one.
- `pnpm api:compare --package rack` shows `request.rb` back at 88/88.
