---
title: "port-request-initialize-rack-request"
status: closed
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
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
closed-reason: "out of scope: targets actionpack; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

`ActionDispatch::Request#initialize`
(vendor/rails/actionpack/lib/action_dispatch/http/request.rb:64-75) calls
`super`, then builds `@rack_request = Rack::Request.new(env)` and nils out the
memo ivars (`@method`, `@request_method`, `@remote_ip`, `@original_fullpath`,
`@fullpath`, `@ip`).

trails' constructor
(`packages/actionpack/src/action-dispatch/http/request.ts:148-158`) instead
copies `env` and fills in Rack defaults (`REQUEST_METHOD`, `SERVER_NAME`,
`SERVER_PORT`, `PATH_INFO`, `QUERY_STRING`, `rack.url_scheme`, `rack.input`) —
work Rails does not do here — and never constructs a `Rack::Request`, so
`rack_request` (used by `GET`, `query_string`, and the rack delegations) has no
counterpart.

Surfaced by `audit-constructor-idiom-cluster-reasons` (RFC 0084): the row was
carrying a "constructor idiom — the construction is present in the port" reason
that is false.

## Acceptance criteria

- The constructor calls `super`, sets `rackRequest` from
  `new Rack.Request(env)`, and nils the memo fields, in Rails' order.
- The invented Rack-default filling is removed or traced to the Rails/Rack
  line that does it.
- The `initialize` row is DELETED from
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/http/request.json`
  by hand (only-shrink, `serializeBaseline`).
