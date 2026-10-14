---
title: "Redirection#redirect extracts options with extract_options! and raises ArgumentError"
status: ready
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Redirection#redirect`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/redirection.rb:204-215`)
is `options = args.extract_options!`, `status = options.delete(:status) || 301`,
`path = args.shift`, then three returns and
`raise ArgumentError, "redirection argument not supported" unless block`.

`redirect` in `packages/actionpack/src/action-dispatch/routing/redirection.ts`
does not call `extractOptionsBang`: it tests the last argument by hand
(`typeof last === "object" && !("call" in last)`), wraps a callable object in a
new closure where Rails assigns `block = path if path.respond_to? :call`, and
throws a bare `Error` where Rails raises `ArgumentError`. trails#8875 made
`Mapper` include this function directly, so it is now the routing DSL's
`redirect`.

## Acceptance criteria

- [ ] `redirect` extracts its options with `extractOptionsBang`, takes
      `block = path` when `path` responds to `call`, and raises `ArgumentError`
      with Rails' message.
