---
title: "Configuration#hosts type admits nil and IPAddr as Rails does"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `config.hosts` accepts `nil`, an `IPAddr`, or an Array
(`railties/lib/rails/application/default_middleware_stack.rb:16`,
`unless Array(config.hosts).empty?`; `commands/middleware_test.rb` sets
`config.hosts = nil` and `config.hosts = IPAddr.new('0.0.0.0/0')`).
`packages/trailties/lib/application/configuration.ts:70` types `hosts` as
`Array<string | RegExp | ((host: string) => boolean)>` only, so
`test/commands/middleware.test.ts` writes `null!` and `as never` casts to set
those values.

## Acceptance criteria

- [ ] `Configuration#hosts` is typed to admit `null` and `IPAddr` (and a single host), as Rails accepts.
- [ ] The casts in `test/commands/middleware.test.ts` are removed; callers that `push` onto `hosts` still typecheck.
