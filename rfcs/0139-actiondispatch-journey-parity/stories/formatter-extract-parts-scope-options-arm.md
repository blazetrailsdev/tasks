---
title: "Carry Route#scopeOptions and its arm of the extract_parameterized_parts keep-condition"
status: in-progress
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 51
pr: 7632
claim: "2026-09-08T21:17:42Z"
assignee: "mapper-match-fans-out-one-route-per-verb"
blocked-by: null
closed-reason: null
---

## Context

`Journey::Formatter#extract_parameterized_parts` decides which keys survive
into the generated path with a two-armed condition
(`vendor/rails/actionpack/lib/action_dispatch/journey/formatter.rb:118-120`):

    keys_to_keep = route.parts.reverse_each.drop_while { |part|
      !(options.key?(part) || route.scope_options.key?(part)) || (options[part].nil? && recall[part].nil?)
    } | route.required_parts

trails' port, `RouteSet#extractParameterizedParts`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`, added by PR
7610), carries only the `options.key?(part)` arm — it has no
`route.scope_options.key?(part)`, because trails' `Route`
(`routing/route.ts`) has no `scopeOptions` field to consult.

`scope_options` is the options hash captured from the enclosing `scope(...)`
block at definition time: `Mapper::Mapping` threads it through
(`routing/mapper.rb:141`) into `Journey::Route.new(..., scope_options:, ...)`
(`journey/route.rb:10,72`). Its effect is that a part named by the enclosing
scope keeps its trailing position even when `url_for`'s own options do not
name it.

Surfaced in review of PR 7610. None of `journey/router_test.rb`'s 35 tests
exercises a scoped route through `url_for`, so nothing regresses today — this
is a known gap in code that PR rewrote, filed rather than left silent.

## Acceptance criteria

- `Route` carries the enclosing scope's options under the Rails name
  (`scopeOptions`), populated by `Mapper` the way `mapper.rb:141` populates it.
- `extractParameterizedParts`'s keep-condition gains the
  `route.scopeOptions` arm, mirroring `formatter.rb:118-120` exactly.
- A test covers a `scope(...)`-defined route whose trailing part is named only
  by the scope, pinning that the part survives generation.
- `pnpm parity:test --package actiondispatch` and the assertion ratchet do not
  regress.
