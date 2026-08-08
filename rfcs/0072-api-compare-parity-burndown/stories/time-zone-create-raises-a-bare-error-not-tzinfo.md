---
title: "TimeZone.create raises a bare Error, not TZInfo::InvalidTimezoneIdentifier"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6248
claim: "2026-08-08T17:15:57Z"
assignee: "enroll-sqlite-rake-test-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

`TimeZone.create` (`packages/activesupport/src/values/time-zone.ts`) raises a
bare `new Error("Invalid time zone: <name>")` for a name it cannot resolve.
Rails' `create` is `alias_method :create, :new`
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:211`), the
original allocator, whose `initialize` resolves the zone via `find_tzinfo`
(`:208`) — so the raise that escapes is `TZInfo::InvalidTimezoneIdentifier`,
which `[]` catches by class at `:239-241`.

Two consequences: the error class and message differ from Rails, and `find`'s
string arm has to catch EVERYTHING rather than that one class, so an unrelated
throw from the `Intl` probe would be silently swallowed as "unknown zone".

Related: `TimeZone.find`'s wrong-class raise (`:249`) interpolates `arg.inspect`
in Ruby; trails interpolates `String(arg)`, so `Object.new` renders
`[object Object]` where Rails renders `#<Object:0x...>`.

Surfaced by PR #6234 (`time-zone-index-returns-nil-instead-of-raising`).

## Acceptance criteria

- [ ] `create` raises a named error standing in for
      `TZInfo::InvalidTimezoneIdentifier`, and `find`'s string arm catches that
      class specifically rather than a bare `catch`.
- [ ] The wrong-class `ArgumentError` message renders its argument the way
      Ruby's `inspect` does.
- [ ] `time-zone.test.ts` `unknown zone raises exception` asserts the class,
      not just that something throws.
