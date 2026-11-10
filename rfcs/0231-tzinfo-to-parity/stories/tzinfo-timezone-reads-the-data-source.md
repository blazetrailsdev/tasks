---
title: "Timezone's remaining 31 members read periods from the DataSource, retiring the Intl stand-in"
status: ready
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
cluster: null
packages:
  - "tzinfo"
deps:
  - "tzinfo-timezone-subclasses"
  - "tzinfo-zoneinfo-data-source"
  - "tzinfo-data-definitions-generated"
deps-rfc: []
est-loc: 650
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/tzinfo/lib/timezone.ts:1-8` is a "TZInfo 2 stand-in, backed by the
built-in Intl API and the tzdata that `@blazetrails/date` carries".
`timezone.rb` is 17/48: `period_for`, `transitions_up_to`, `canonical_zone`,
`to_local`, `local_time`, `local_datetime`, `local_timestamp`, `offsets_up_to`,
`now`, `current_time_and_period`, `strftime`, `abbreviation`,
`base_utc_offset`, `utc_offset`, `_dump` / `_load`, `default_dst(=)`,
`all_identifiers`, `all_data_zones`, `all_linked_zones`, `all_country_zones`,
`get_proxies`, `data_source`, … (`vendor/tzinfo/v2.0.6/lib/tzinfo/timezone.rb`). Tests:
`tc_timezone.rb`, `tc_timezone_utc.rb`. `tzinfo-timezone-get-is-case-sensitive`
(0158) and `time-zone-utc-offset-reads-current-period-base-offset` (0101) are
neighbours this story may close as a side effect; it does not re-file them.

## Acceptance criteria

- [ ] Every missing `Timezone` member is ported, and periods come from
      `DataSource.get`, not from `Intl`.
- [ ] The `@boundary-file` Intl path is deleted, or each remaining use is a
      receipted boundary.
- [ ] `create_default_data_source`'s selection test and the `tc_data_source.rb`
      examples deferred from `tzinfo-data-source-base` are ported here.
- [ ] Both test files are ported by name; activesupport's TimeZone tests stay
      green on the generated tzinfo-data, with no host `zoneinfo` required.
