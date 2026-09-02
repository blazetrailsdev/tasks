---
title: "Port Rack::ShowExceptions::Frame's eight Struct members (show_exceptions.rb:56-59)"
status: ready
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api --package rack` scores `show_exceptions.rb` -> `show-exceptions.ts`
at 33% (8 of 24), the lowest-scoring matched file left in the package after
PR #7363. All 16 missing members are the accessor pairs of one class:

```ruby
Frame = Struct.new(:filename, :lineno, :function, :pre_context_lineno,
                   :pre_context, :context_line, :post_context_lineno,
                   :post_context)
```

(`vendor/rack/lib/rack/show_exceptions.rb:56-59`) — `filename`/`filename=`,
`lineno`/`lineno=`, `function`/`function=`, `pre_context_lineno`/`=`,
`pre_context`/`=`, `context_line`/`=`, `post_context_lineno`/`=`,
`post_context`/`=`. trails has no `Frame` class at all; `pretty`
(`packages/rack/src/show-exceptions.ts`) builds its markup without one.

The trails spelling of a Ruby `x=` writer is `setX()` (CLAUDE.md, "Fidelity is
the job"), and the reader half is a property, so each Struct member is a
`get filename()` / `setFilename()` pair.

This overlaps [[converge-show-exceptions-pretty]] (RFC 0023), which converges
`pretty` onto `show_exceptions.rb:76-91` and drops the bespoke template helper:
Rails' `pretty` is what builds `Frame` instances, so whichever lands first
should carry the class and the other should consume it. Surfaced while porting
`show_exceptions#call`'s `rack.errors` write in #7363.

## Acceptance criteria

- `Frame` exists in `packages/rack/src/show-exceptions.ts` with all eight
  members as reader/`setX` pairs, in `show_exceptions.rb:56-59` order.
- It is built where Rails builds it, by `pretty`, rather than existing unused.
- `parity:api --package rack` raises `show_exceptions.rb` above 33%.
