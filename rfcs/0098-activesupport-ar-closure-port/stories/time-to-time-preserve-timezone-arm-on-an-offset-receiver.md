---
title: "Time#to_time / DateTime#to_time need a receiver that carries an offset"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6550
claim: "2026-08-14T22:49:42Z"
assignee: "retire-time-zone-config-test-only-zone-seams"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/time-ext.ts`'s `toTime(date: Date)` — the port of
`Time#to_time` (`core_ext/time/compatibility.rb:13-15`) and, through the same
bucket, of `DateTime#to_time` (`core_ext/date_time/compatibility.rb:15-17`) —
carries a `@missingRailsCall preserve_timezone` receipt added by PR #6547.

Rails' two bodies are:

```ruby
# core_ext/time/compatibility.rb:13-15
def to_time
  preserve_timezone ? self : getlocal
end

# core_ext/date_time/compatibility.rb:15-17
def to_time
  preserve_timezone ? getlocal(utc_offset) : getlocal
end
```

Both arms collapse for trails' receiver: a JS `Date` is an absolute instant
with no offset of its own, so there is nothing to preserve and nothing for
`getlocal` to convert. The switch IS consulted where the receiver carries an
offset — `preserveTimezone(time: RubyTime)` in the same file (ported by #6547,
taking `core_ext/time/compatibility.rb` to 4/4), which
`core-ext/string/conversions.ts`'s `String#to_time` reads.

The residue is the receiver, not the logic: Rails' `Time#to_time` and
`DateTime#to_time` are methods on values that DO carry an offset
(`@blazetrails/date`'s `Time`, and the `PlainDateTime | ZonedDateTime` its
`DateTime` answers), and trails' single JS-`Date` arm cannot represent either.
This is the same receiver-collision that keeps `core_ext/date_time/conversions.rb`
and `core_ext/date/conversions.rb` sharing `time-ext.ts`
([[time-with-zone-residue-structural-blockers]] section B).

## Converged shape

Give `Time#to_time` and `DateTime#to_time` arms keyed on the receivers that
carry an offset, next to `preserveTimezone` — the `Date` arm's precedent is
`core-ext/date/conversions.ts`'s `toTime`, and the `String` arm's is
`core-ext/string/conversions.ts`'s. Then delete the `@missingRailsCall` tag on
the JS-`Date` arm, or delete that arm if every caller can be moved.

Probably wants to land with, or after, section B of
[[time-with-zone-residue-structural-blockers]], since both turn on splitting
`time-ext.ts` by receiver.

## Acceptance criteria

- [ ] `Time#to_time` / `DateTime#to_time` consult `preserve_timezone` on a
      receiver that carries an offset, with Rails' branch bodies.
- [ ] The `@missingRailsCall preserve_timezone` receipt in `time-ext.ts` is
      deleted.
- [ ] `pnpm parity:api` / `pnpm parity:api:calls` deltas non-negative.
