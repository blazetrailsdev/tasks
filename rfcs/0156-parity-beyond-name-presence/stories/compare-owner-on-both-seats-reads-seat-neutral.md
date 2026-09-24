---
title: "compare-owner-on-both-seats-reads-seat-neutral"
status: in-progress
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8039
claim: "2026-09-24T16:15:15Z"
assignee: "association-scope-cache-keys-on-reflection"
blocked-by: null
closed-reason: null
---

## Context

`tsOwnerSeat` (`scripts/api-compare/compare.ts:1550-1561`) answers `undefined` whenever one
owner declares a name on BOTH seats (`isStatic === isInstance`). `tsDeclaresOnLevel`
(`compare.ts:2997-3027`) reads that as `"neutral"`, and a neutral declaration only credits the
row sighted first. That is the rule's intent for one top-level `this`-typed function standing
in for two Ruby methods. But it also swallows the faithful `class_attribute` / `cattr_accessor`
port, where a class DOES carry the name on both seats: `static x` plus the prototype reader
that `classAttribute()` installs (`activesupport/src/class-attribute.ts:82-110`). Ruby defines
exactly that pair (`activesupport/lib/active_support/core_ext/class/attribute.rb:80-84`,
`core_ext/module/attribute_accessors.rb`).

Measured while doing `port-instance-seat-rows-surfaced-by-level-keyed-expected-set`. Changing
`static strictStringsByDefault = false` on `SQLite3Adapter` to
`classAttribute.call(SQLite3Adapter, "strictStringsByDefault", { default: false })`
(`sqlite3_adapter.rb:67`) makes the extractor record the name as static and instance on
`SQLite3Adapter`, as `ts-api.json` shows. Yet `parity:api` then loses the instance reader,
the instance predicate and both writers, and activerecord matched drops. The same doubled
owner is why `migration.rb` `Migration#verbose` / `#verbose=` (`migration.rb:797`,
`cattr_accessor :verbose`) read missing today, although `migration.ts:274-289` declares
`static get/set verbose` and instance `get/set verbose`.

Rows blocked on this (class-hosted `class_attribute`s, from the trails#7936 list):
`abstract_mysql_adapter.rb:29` `emulate_booleans`, `postgresql_adapter.rb:105,123,132`
`create_unlogged_tables` / `datetime_type` / `decode_dates`, `sqlite3_adapter.rb:67`
`strict_strings_by_default`, `log_subscriber.rb:7` `backtrace_cleaner`, `schema_dumper.rb:23-41`
ignore patterns, `migration.rb:797` `verbose`, activemodel `serializers/json.rb:15`
`include_root_in_json`, `error.rb` `i18n_customize_full_message`, activesupport
`actionable_error.rb:17` `_actions`, actionview `base.rb` accessors, and actioncontroller
`test_case.rb` `_controller_class`.

## Acceptance criteria

- Owner seats are tracked per (owner, seat), so an owner declaring a name as a static AND as an
  instance member answers `"seat"` for both levels. A top-level `this`-typed function (owner
  `""`) and an owner whose seat really cannot be told stay neutral.
- `scripts/api-compare` unit test: one class with `static x` plus an instance `x` credits both
  the `self.x` and `x` rows of a Ruby file that expects both.
- `parity:api` matched count for activerecord does not drop, and `migration.rb` `verbose` /
  `verbose=` match.
- Follow-up ports of the rows above become possible with `classAttribute()`. They are not part
  of this story.
