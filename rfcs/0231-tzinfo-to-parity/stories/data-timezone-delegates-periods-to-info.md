---
title: "data-timezone-delegates-periods-to-info"
status: draft
updated: 2026-11-11
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10007 ported `InfoTimezone` / `DataTimezone` as subclasses of `Timezone`, but the period logic is still on `Timezone`, backed by Intl:

- `DataTimezone#period_for`, `#periods_for_local` and `#transitions_up_to` (`vendor/tzinfo/v2.0.6/lib/tzinfo/data_timezone.rb`) delegate to `info`, with their `ArgumentError` guards ('time must be specified', 'local_time must be specified', 'to must be specified'). None of them is ported.
- `DataTimezoneInfo#period_for` / `#periods_for_local` / `#transitions_up_to` (`data_sources/data_timezone_info.rb:18-74`) are not ported, and there is no `TransitionsDataTimezoneInfo` backed by the Intl/tzdata source.
- `Timezone.get` is `new DataTimezoneInfo(identifier).createTimezone()` (`packages/tzinfo/lib/timezone.ts`) where Rails has `data_source.get_timezone_info(identifier).create_timezone` (`timezone.rb:127-129`).
- `Timezone#abbr`, `#observedUtcOffset`, `#isDst`, `#periodForUtc`, `#periodsForLocal` and `#utcToLocal` branch on `this.info instanceof ConstantOffsetDataTimezoneInfo`, where Rails reads `period_for(time)` (`timezone.rb`).
- `Timezone`'s `(name, info)` constructor has no Rails counterpart. `InfoTimezone` should keep `@info` (protected `info`) and answer `identifier` as `@info.identifier` (`info_timezone.rb`).

## Acceptance criteria

- `DataTimezone` and `DataTimezoneInfo` port `period_for`, `periods_for_local` and `transitions_up_to` with Rails' guards and messages, backed by a `TransitionsDataTimezoneInfo` (or an equivalent ported info) over the Intl/tzdata data.
- `Timezone.get` goes through a data source's `get_timezone_info`.
- The `instanceof ConstantOffsetDataTimezoneInfo` arms in `timezone.ts` are gone; the `Timezone` methods read `period_for`.
- `Timezone`'s constructor takes no arguments; `InfoTimezone` holds `info` (protected) and reads `identifier` from it.
- The `tc_data_timezone.rb` period tests are ported.
