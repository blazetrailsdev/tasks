---
title: "instanceof Time sites written before Time.=== admitted TimeWithZone"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8079
claim: "2026-09-25T03:24:24Z"
assignee: "activesupport-assert-match-drops-respond-to-and-last-match"
blocked-by: null
closed-reason: null
---

## Context

`activesupport-time-at-in-option-and-case-equality` ported `Time.===`
(`vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:18-20`)
as `Symbol.hasInstance` on `Time` (`packages/activesupport/src/core-ext/time/calculations.ts`),
so `twz instanceof Time` is now true, as `Time === twz` and
`twz.is_a?(Time)` (`time_with_zone.rb:509-511`) are in Rails.

About 60 `instanceof RubyTime` / `instanceof Time` sites were written when that
was false, and some dispatch statically to a `this`-typed Time module function
or a Time private field, which a `TimeWithZone` cannot answer. The PR fixed the
ones a test reached: `changeNsec` (`activemodel/src/type/helpers/time-value.ts`),
`Duration#sum` / `dateOrTimeSince` / `dateOrTimeAdvance` (`activesupport/src/duration.ts`,
now dynamic `t.since` / `t.advance` as Rails' `duration.rb:486-510` does),
`time-ext.ts` `advance` / `change`, and the `inspect` arm order in
`activerecord/src/attribute-methods.ts`. The remainder are typed to exclude
`TimeWithZone` or only duck-type, but were not each audited:
`activerecord/src/timestamp.ts:207`, `integration.ts:39,83`,
`connection-adapters/postgresql/oid/range.ts:148`,
`connection-adapters/mysql/quoting.ts:139`,
`activesupport/src/core-ext/time/conversions.ts:53,85,87`,
`core-ext/date-and-time/calculations.ts:117`, `core-ext/date-and-time/zones.ts:58`,
`core-ext/object/json.ts:187`, `core-ext/time/compatibility.ts:11`,
`values/time-zone.ts:348,353`, `testing/time-helpers.ts:134`.

## Acceptance criteria

- [ ] Each listed site either dispatches dynamically (the receiver's own method,
      as the Rails body does) or checks `TimeWithZone` before `Time`, with the Rails
      `file:line` it mirrors.
- [ ] A test per converged site that feeds it a `TimeWithZone`.
