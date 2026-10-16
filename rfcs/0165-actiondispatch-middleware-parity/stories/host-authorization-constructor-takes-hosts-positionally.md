---
title: "host-authorization-constructor-takes-hosts-positionally"
status: claimed
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-16T00:52:08Z"
assignee: "debug-view-extends-action-view-base-and-renders-rescue-templates"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::HostAuthorization#initialize(app, hosts, exclude: nil, response_app: nil)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/host_authorization.rb`)
takes `hosts` positionally. trails' constructor
(`packages/actionpack/src/action-dispatch/middleware/host-authorization.ts:115`)
takes `(app, options: { hosts, exclude, responseApp })`, and
`HostAuthorizationOptions.hosts` is typed `HostPermission[]` although
`Permissions` accepts a single host or nil. Surfaced on trails#8960, whose
`buildApp` has to cast `hosts`.

## Acceptance criteria

- The constructor is `(app, hosts, { exclude, responseApp } = {})`, as in Rails.
- `hosts` accepts a single permission, an array or null.
- Callers (the middleware stack, tests) are updated.
