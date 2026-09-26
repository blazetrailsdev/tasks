---
title: "TableRows#build_table_rows_from calls currentTimeFromProperTimezone instead of Rails' inline default_timezone check"
status: done
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#8131
claim: "2026-09-26T02:32:09Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::FixtureSet::TableRows#build_table_rows_from` (`activerecord/lib/active_record/fixture_set/table_rows.rb:33`) computes the fixture timestamp inline:

```ruby
now = ActiveRecord.default_timezone == :utc ? Time.now.utc : Time.now
```

trails' `packages/activerecord/src/fixture-set/table-rows.ts` (`buildTableRowsFrom`) calls `currentTimeFromProperTimezone()`, the module function from `timestamp.ts`, instead. The result is equivalent, but it is a call Rails does not make here, and since trails#8112 that method is a `Timestamp::ClassMethods` method seated on `Base`. Calling it as a bare module function outside a model is the shape #8112 removed everywhere else.

## Converged shape

`const now = defaultTimezone() === "utc" ? RubyTime.now().getutc() : RubyTime.now();`, using `ActiveRecord.defaultTimezone` from `active-record.ts` and ruby-compat/date `Time.now`, and drop the `timestamp.js` import.

## Acceptance criteria

- `table-rows.ts` mirrors `table_rows.rb:33` and no longer imports `currentTimeFromProperTimezone`.
- `parity:api:calls` stays green.
