---
title: "Rack's Collector includes Enumerable; trails hand-writes findAll"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7145 (RFC 0121 enrollment of `rack`).

`Rack::Multipart::Parser::Collector` does `include Enumerable`
(`vendor/rack/lib/rack/multipart/parser.rb:139`) and defines only `each`
(`parser.rb:149`). `Parser#result` then calls `@collector.find_all(&:file?)`
(`parser.rb:247`) — `find_all` is Enumerable's, not the class's.

`packages/rack/src/multipart/parser.ts` hand-writes a single `findAll` method
returning `this.mimeParts.filter(...)` instead of porting the mixin. It carried
an `@internal` tag that backed nothing; PR #7145 removed the tag (a
`@noRailsEquivalent` receipt there scores STALE, since the extractor does not
flag the name as extra surface), so the deviation is now untagged and
unmeasured.

## Converged shape

Give `Collector` the Enumerable surface the way trails ports a Ruby `include`
(`include()` / `Included<>` from `@blazetrails/activesupport`, per CLAUDE.md
"Module mixins"), driven by the ported `each`, and delete the bespoke `findAll`.
If ActiveSupport carries no Enumerable module yet, that gap is the first half of
the story — check `packages/activesupport/src/` before adding one, and keep the
Ruby name `findAll` for the member `parser.rb:247` actually calls.

## Acceptance criteria

- [ ] `Collector` gets `findAll` from a mixin driven by `each`, not from a
      hand-written method body.
- [ ] `packages/rack/src/multipart.test.ts` and `request.test.ts` stay green.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra --package rack` deltas
      non-negative.
