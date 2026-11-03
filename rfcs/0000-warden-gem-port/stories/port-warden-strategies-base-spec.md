---
title: "Port spec/warden/strategies/base_spec.rb"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-specs
packages: ["warden"]
deps: ["port-warden-strategies"]
deps-rfc: []
est-loc: 340
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`spec/warden/strategies/base_spec.rb:1-313`, 32 examples on
`Warden::Strategies::Base`: `headers`, `errors`, `success!`, `fail!` vs
`fail`, `halt!` / `pass`, `redirect!` (Location building with
`Rack::Utils.build_nested_query`, `:permanent` → 301), `custom!`, `store?`,
`valid?`, and `_run!` performing once. Uses `env_with_params` from the request
helper, which `port-warden-strategies` creates, and `RAS = Warden::Strategies` defined at the
top of the spec.

## Acceptance criteria

- `strategies/base.test.ts` ports all 32 examples by name; `parity:test`
  matches them.
