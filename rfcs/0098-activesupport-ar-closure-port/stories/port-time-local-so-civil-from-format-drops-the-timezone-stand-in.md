---
title: "Port Time.local to @blazetrails/date so civil_from_format drops its TimeZone#local stand-in"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6566
claim: "2026-08-15T14:45:06Z"
assignee: "wave-1e-relation-batches-finder-spawn-rows"
blocked-by: null
closed-reason: null
---

## Context

PR #6550 ported `DateTime.civil_from_format`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_time/conversions.rb:69-76`)
into `packages/activesupport/src/time-ext.ts`. Rails' `:local` arm reads the
offset off a bare `Time`:

```ruby
def self.civil_from_format(utc_or_local, year, month = 1, day = 1, hour = 0, min = 0, sec = 0)
  if utc_or_local.to_sym == :local
    offset = ::Time.local(year, month, day).utc_offset.to_r / 86400
  else
    offset = 0
  end
  civil(year, month, day, hour, min, sec, offset)
end
```

`@blazetrails/date`'s `Time` has no `local` constructor — `packages/date/src/time.ts`
exposes `now`, `utc` and `mktime` only — so the port stands in with
`TimeZone.find(Temporal.Now.timeZoneId())!.local(year, month, day).utcOffset`,
i.e. ActiveSupport's `TimeZone#local` over the system's IANA zone id.

That is the same bare-`Time` substitution already recorded once in
`packages/activesupport/src/core-ext/date/conversions.ts`'s `toTime` docstring,
so this is the second call site reaching for it. It reads the right instant and
the right offset, but it routes a ruby/date constructor through an
ActiveSupport value, which is a layering inversion rather than a language
shortcoming.

Note Ruby's `Time.local` is `Time.mktime`'s alias (`time.c`), and
`@blazetrails/date` already has `mktime` — so this may be a rename/alias away
rather than a new implementation. Check that first.

## Converged shape

Give `@blazetrails/date`'s `Time` the `local` constructor (alias of `mktime`,
matching Ruby), then have `civilFromFormat` read
`Time.local(year, month, day).utcOffset` the way `conversions.rb:70` does, and
drop the `TimeZone#local` stand-in. Revisit
`core-ext/date/conversions.ts`'s `toTime` at the same time — it carries the
same substitution and the same docstring paragraph.

## Acceptance criteria

- [ ] `civilFromFormat`'s `:local` arm reads its offset from a ruby/date `Time`,
      not from an `ActiveSupport::TimeZone`.
- [ ] The bare-`Time` substitution paragraph in
      `core-ext/date/conversions.ts`'s `toTime` docstring is either retired with
      it or narrowed to what still applies.
- [ ] `pnpm parity:api` / `pnpm parity:api:calls` deltas non-negative; no new
      baseline rows.
