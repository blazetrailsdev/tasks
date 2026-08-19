---
title: "TimeZone#match drops match?'s MAPPING and Regexp arms; dst? has an invented default"
status: done
updated: 2026-08-19
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6740
claim: "2026-08-19T13:36:07Z"
assignee: "converge-time-zone-match-and-dst-predicates"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6733 while converging `TimeZone#tzinfo` onto a `Timezone`
object.

Rails' member is `match?(re)`
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:348-351`):

```ruby
def match?(re)
  (re == name) || (re == MAPPING[name]) ||
    ((Regexp === re) && (re.match?(name) || re.match?(MAPPING[name])))
end
```

trails spells it `match(identifier: string)`
(`packages/activesupport/src/values/time-zone.ts`) and compares against
`this.name` and `this.tzinfo.identifier`. Three divergences: the name drops the
`?` (`isMatch` per docs/ruby-ts-conventions.md), the second comparison reads the
resolved zone rather than `MAPPING[name]` (they differ for every Rails-named
zone whose MAPPING value is a link), and the `Regexp` arm is missing entirely.

Also in the same file, `dst?` is ported as `isDst(date = Temporal.Now.instant())`
where Rails' `dst?(time)` (`:571-573`) takes a required argument — an invented
default that lets a caller omit the instant the period depends on.

## Converged shape

- `match` → the conventions-table spelling of `match?`, with all three arms:
  `re === this.name`, `re === MAPPING[this.name]`, and a `RegExp` arm testing
  both. Callers updated.
- `isDst(date)` loses its default so the argument is required, as `dst?` is.

## Acceptance criteria

- [ ] `match?` ported at its conventions-table name with the `MAPPING[name]`
      and `Regexp` arms.
- [ ] `isDst` takes a required `time`.
- [ ] `pnpm parity:api` delta non-negative; `TimeZoneTest` green on all lanes.
