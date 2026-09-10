---
title: "Append the optional (.:format) segment to declared route paths"
status: done
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 30
pr: trails#7630
claim: "2026-09-08T20:18:27Z"
assignee: "mapper-appends-optional-format-segment"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::Mapper::Mapping.normalize_path(path, format)`
appends the format segment to every declared path
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:116-129`):
`format == true` gives `"#{path}.:format"`, and otherwise
`optional_format?` appends `"(.:format)"` unless the path already carries one.

trails' `Mapper#addRoute`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`) assembles
`fullPath` from the scope prefix and the declared path and never appends the
format segment, so a route declared `get "/whois/:domain"` has a Journey
`path.spec` of `/whois/:domain` where Rails' is `/whois/:domain(.:format)`.
`RouteOptions.format` is carried onto `Route` as `formatted` but nothing
consumes it for the path.

Surfaced by #7610: `journey/router_test.rb`'s `regexp first precedence`
asserts `assert_equal "/whois/:domain(.:format)", r.path.spec.to_s`
(`vendor/rails/actionpack/test/journey/router_test.rb:55`). The port asserts
the trails spelling instead, which is the one assertion-value mismatch left on
that file's 35 matched pairs.

## Acceptance criteria

- `Mapper` appends the format segment following `mapper.rb:116-129` — the
  `format == true`, `optional_format?` and pass-through arms, with
  `OPTIONAL_FORMAT_REGEX`'s guard against double-appending.
- `journey/router.test.ts`'s `regexp first precedence` asserts
  `"/whois/:domain(.:format)"`, matching the Ruby.
- `pnpm parity:test --package actiondispatch` assertion-value count does not
  rise, and `dispatch/routing.test.ts`'s matched count does not fall.
