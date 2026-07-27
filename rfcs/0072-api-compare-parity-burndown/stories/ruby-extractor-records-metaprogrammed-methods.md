---
title: "Teach the Ruby extractor to record define_method / alias_method surface"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: api-compare-tooling
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ruby-api.rb` records only literal `def`s, so every
method Rails generates with `define_method` is absent from `rails-api.json`.
The ported TS counterpart then reads as EXTRA surface rather than as a match.

The clearest instance is
`vendor/rails/actionpack/lib/abstract_controller/callbacks.rb:230-253`, where a
literal `[:before, :after, :around].each` loop generates twelve macros. Twelve
of the fifteen `@noRailsEquivalent` tags added by
`migrate-abstractcontroller-allow-entries` (PR #5367) exist only to excuse this:
six on `callbacks.ts` and six on their `base.ts` install sites. Their reasons
say so in as many words. The same shape appears at
`vendor/rails/railties/lib/rails/engine.rb:417`
(`define_method(:railtie_routes_url_helpers)`).

This is a tooling gap, not a port deviation: the trails names already match
Rails exactly.

## Acceptance criteria

- The Ruby extractor records `define_method "<literal or interpolated>"` where
  the interpolation is driven by a literal array `.each` it can unroll, plus
  `alias_method` with literal names, emitting one entry per generated name.
- `abstractcontroller` gains the twelve `*_action` macro names in
  `rails-api.json`, and `api:compare` matches them against the existing
  `callbacks.ts` / `base.ts` declarations.
- The twelve now-redundant `@noRailsEquivalent` tags are deleted from
  `callbacks.ts` and `base.ts`; `api:extra` reports no stale tags.
- Guard against over-matching: a `define_method` whose name cannot be resolved
  to literals is skipped, not guessed. Cover both arms with extractor tests.
