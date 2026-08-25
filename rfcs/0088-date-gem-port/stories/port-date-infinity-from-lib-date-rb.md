---
title: "Port Date::Infinity and Date#infinite? — lib/date.rb is the gem's only Ruby surface and none of it is ported"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6308
claim: "2026-08-09T23:26:04Z"
assignee: "exclude-test-memsize-from-the-date-test-population"
blocked-by: null
closed-reason: null
---

## Context

`vendor/date/lib/date.rb` is the gem's **entire** Ruby-visible surface — 70 lines
holding `Date#infinite?` and the `:nodoc:` `Date::Infinity < Numeric` class with
`initialize`, `d` (protected), `zero?`, `finite?`, `infinite?`, `nan?`, `abs`,
`-@`, `+@`, `<=>`, `coerce`, `to_f` (`lib/date.rb:11-77`). RFC 0088's
`date-c-source-extractor-decision` spike measured it as exactly what
`extract-ruby-api.rb` credits: `date: 2 classes, 0 modules, 12 public methods`.

**None of it is ported.** `packages/date/src/date.ts` (5,468 lines) has no
`Infinity` class and no `infinite?` reader; its only `Infinity` occurrences are
the unrelated `JULIAN = Infinity` / `GREGORIAN = -Infinity` reform sentinels
(`date.ts:2952-2959`, `:3008`, `:4624`). `packages/date/src/index.ts` exports
`Date`, `DateTime`, `Rational`, `dNewByFrags`, `dtNewByFrags`, `strftime`, `Time`
— no `Infinity`.

It is load-bearing for the test gate: `test_date.rb:9` (`test_range_infinite_float`)
and `:166` (`test_infinity_comparison`) both need it, and they cannot be ported
without it.

It is also the one piece of `date` that `parity:api` could ever credit. The
package is enrolled with `compareApi: false` (`vendor/sources.ts:208`) on the
spike's finding that 12 methods are not worth a package-sized extra-surface
report — **this story does not change that flag**; it ports the class because the
tests need it and because it is genuine gem surface, not to move an API number.

`Date::Infinity` extends `Numeric`, which trails has no port of. Model it as a
plain class with the gem's twelve members at their translated names
(`-@` → `negate`-style spellings are NOT acceptable if a better one exists; check
`docs/ruby-ts-conventions.md` for the operator spelling the comparator expects
before choosing). `coerce` is Ruby's numeric-coercion protocol and has no JS
analogue as a protocol — port the method (it answers a pair) and let `<=>` call
it, exactly as `lib/date.rb:44-55` does.

## Acceptance criteria

- [ ] `Date::Infinity` exists in `packages/date/src/date.ts` with all twelve
      members at the names `docs/ruby-ts-conventions.md` produces from the Ruby
      names, and `d` is protected/private as the Ruby marks it.
- [ ] `Date#infinite?` answers `false` (`lib/date.rb:14-16`).
- [ ] `<=>` handles all five arms the Ruby handles — `Infinity`, `+Float::INFINITY`,
      `-Float::INFINITY`, `Numeric`, and the `coerce` fallback returning `nil` on
      `NoMethodError` — in the same order, per CLAUDE.md's control-flow rule.
- [ ] `to_f` answers `0` / `±Infinity` per `lib/date.rb:66-73`.
- [ ] `compareApi` stays `false` for the `date` source; this story does not flip it.
- [ ] Coverage lands in `date.trails.test.ts` (the gem's own coverage of the class
      is inside `test_date.rb`, ported by `port-test-date-rb-constants-and-comparison`).
