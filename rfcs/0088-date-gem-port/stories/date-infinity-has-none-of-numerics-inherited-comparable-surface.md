---
title: "Date::Infinity stands alone where Ruby is Numeric < Comparable, so a Range endpoint has no comparison operators"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6315
claim: "2026-08-10T01:16:46Z"
assignee: "date-infinity-has-none-of-numerics-inherited-comparable-surface"
blocked-by: null
closed-reason: null
---

## Context

Shipped in #6308 (`port-date-infinity-from-lib-date-rb`). Ruby declares the class
as `class Infinity < Numeric` (`vendor/date/lib/date.rb:17`). trails has no
`Numeric` port, so `packages/date/src/date.ts`'s `DateInfinity` stands alone: it
carries the twelve members `lib/date.rb:19-66` defines and NONE of the surface
Ruby inherits.

That inherited surface is load-bearing for the class's actual job. `Numeric`
includes `Comparable`, so `<`, `<=`, `>`, `>=`, `==` and `between?` all come free
off the `<=>` at `lib/date.rb:35-48` — and those comparison operators are exactly
what a `Range` calls on an endpoint. `Date::Infinity` exists to BE an unbounded
`Range` endpoint (`test_date.rb:9` `test_range_infinite_float`, `:166`
`test_infinity_comparison`), so without them the ported class answers `compareTo`
and nothing a range would actually reach for.

trails also has no `Comparable` idiom to mix in here — `packages/activesupport`'s
`include()` / `Included<>` is the settled shape for a Ruby `include`, but there is
no `Comparable` module to pass it.

## Acceptance criteria

- [ ] Decide and record whether trails ports `Numeric`/`Comparable` for this, or
      whether `Date::Infinity` carries the `Comparable`-derived operators directly
      off its `compareTo` — with the Rails/gem citation for whichever shape lands.
- [ ] `Date::Infinity` answers the comparison surface a `Range` endpoint needs,
      derived from `<=>` (`lib/date.rb:35-48`) rather than reimplemented per
      operator.
- [ ] `test_date.rb:9` (`test_range_infinite_float`) and `:166`
      (`test_infinity_comparison`) can be ported against it — this story unblocks
      `port-test-date-rb-constants-and-comparison`, which owns those two tests.
