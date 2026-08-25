---
title: "Converge TimeZone.create onto Rails' (name, utc_offset, tzinfo) allocator"
status: done
updated: 2026-08-19
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6730
claim: "2026-08-18T23:11:21Z"
assignee: "order-check-ignores-suppressed-call-claims"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6726, which made `load_country_zones` extractor-visible
(re-spelled from a JS `#private` to `private static`) and so exposed a
pre-existing call-argument divergence the gate could not previously see. It is
baselined as the one `kind: "args"` row in
`scripts/api-compare/call-mismatches-exclude/activesupport/values/time-zone.json`
(`load_country_zones` → `create`) — that row is the debt this story retires.

Rails: `create` is `alias_method :create, :new` (time_zone.rb:211) over
`initialize(name, utc_offset = nil, tzinfo = nil)` (time_zone.rb:206-210), so
`load_country_zones` calls
`create(tz_id, nil, TZInfo::Timezone.get(tz_id))` (time_zone.rb:278) — it has
the resolved `TZInfo::Timezone` in hand and hands it over rather than making
`initialize` re-resolve it through `find_tzinfo` (:208).

trails: `TimeZone.create(name)` takes the name alone
(`packages/activesupport/src/values/time-zone.ts:635`) and probes
`Intl.DateTimeFormat` itself; `this.tzinfo` is the IANA name string, not a
timezone object, so there is no third argument to pass and
`loadCountryZones` (:1238) calls `create(tzId)`.

## Converged shape

`create`/`initialize` take `(name, utcOffset = null, tzinfo = null)` in Rails'
order, with the `tzinfo` argument short-circuiting the `find_tzinfo` probe when
supplied. This is coupled to the same seam
`time-with-zone-residue-structural-blockers` is blocked on: trails has no
`TZInfo::Timezone` object, so the third parameter has nothing meaningful to
carry until one exists. Sequence behind that seam, or land the two together.

Note `utc_offset` is the second parameter and trails' `utcOffset` is currently a
computed getter (:1011) — porting the parameter means the getter reads a stored
`@utc_offset` first, exactly as Rails' does
(`@utc_offset || tzinfo.current_period.base_utc_offset`, time_zone.rb:433-435).

## Acceptance criteria

- [ ] `TimeZone.create` / the constructor take Rails' `(name, utc_offset, tzinfo)`
      parameter list, in Rails' order, with Rails' defaults.
- [ ] `loadCountryZones` calls `create(tzId, null, <the resolved zone>)`.
- [ ] `utcOffset` reads the stored value before deriving one.
- [ ] The `load_country_zones` → `create` `kind: "args"` row is DELETED from
      `call-mismatches-exclude/activesupport/values/time-zone.json` (the
      baseline only shrinks), and `parity:api:calls:args` is green without it.
