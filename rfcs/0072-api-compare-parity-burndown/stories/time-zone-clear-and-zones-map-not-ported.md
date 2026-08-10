---
title: "TimeZone.clear has no port and zones_map is inlined into all()"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6269
claim: "2026-08-09T01:24:25Z"
assignee: "enroll-pg-and-mysql-rake-tests-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

Two class methods of `ActiveSupport::TimeZone` have no port, both surfaced by
PR #6250 adding a third memo next to them.

`clear` (`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:264-269`):

```ruby
def clear # :nodoc:
  @lazy_zones_map = Concurrent::Map.new
  @country_zones  = Concurrent::Map.new
  @zones = nil
  @zones_map = nil
end
```

trails has all three memos as module-level state in
`packages/activesupport/src/values/time-zone.ts` — `zoneCache` (`@lazy_zones_map`),
`zones` (`@zones`), and now `countryZonesMemo` (`@country_zones`, added by PR
6250 for `countryZones`) — and nothing resets them. Rails calls `clear` from
the railtie on reload; here the memos live for the process, so a test that
travels tzdata or stubs `Intl` cannot get a clean slate.

`zones_map` (`:286-291`) is a private method Rails extracts and trails
inlined into `all()`:

```ruby
def zones_map
  @zones_map ||= MAPPING.each_with_object({}) do |(name, _), zones|
    timezone = self[name]
    zones[name] = timezone if timezone
  end
end
```

`all()` (`:223-225`) is `@zones ||= zones_map.values.sort`. trails' `all()`
does the `MAPPING`-walk, the nullish filter and the sort in one body, so the
`@zones_map` memo does not exist at all — a decomposition deviation
(CLAUDE.md: "If Rails extracts a private helper, extract it, with the Rails
name").

## Converged shape

Port `zonesMap()` as the private helper with its own memo, and `all()` becomes
`zones ??= Object.values(zonesMap()).sort(...)`. Port `clear()` as a public
class method resetting all four slots — including `countryZonesMemo`, whose
`@country_zones` line is already in the Ruby above.

## Acceptance criteria

- [ ] `TimeZone.clear()` exists and resets the zone cache, the zones list, the
      zones map and the country-zones memo.
- [ ] `zonesMap` is extracted at the Rails name with the `@zones_map` memo, and
      `all()` reads through it.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra` deltas are non-negative;
      `values/time-zone.ts`'s extras do not grow.
