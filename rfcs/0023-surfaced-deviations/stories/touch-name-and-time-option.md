---
title: "touch(name, {time:}) — support column name + explicit time in one call"
status: ready
updated: 2026-06-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `touch(*names, time: nil)` accepts both column names and an explicit time in one call:

```ruby
developer.touch(:created_at, time: new_time)  # touch named attr at specific time
```

Trails `touch(optionsOrName?, ...rest)` signature treats the first arg as either
`{ time? }` options OR a string column name — you can't pass both a column name
AND a `{ time: }` option:

```ts
// Trails: must work around with travelTo
travelTo(newTime);
try {
  await developer.touch("legacy_created_at");
} finally {
  travelBack();
}
```

Rails source: activerecord/lib/active_record/persistence.rb (`touch`) and
activerecord/lib/active_record/timestamp.ts (`touch_attributes_with_time`).

Workaround applied in timestamp.test.ts (line 169–175) — `travelTo` to set
the clock before calling `touch(name)` without the time option.

## Acceptance criteria

- `touch("col_name", { time: specificInstant })` works (passes both name and time)
- Matches Rails `touch(*names, time: nil)` signature: `names` are the explicit
  columns to touch; `time` overrides the timestamp value
- `timestamp_test.rb` test `test_touching_an_attribute_updates_timestamp_with_given_time`
  no longer needs the `travelTo` workaround in `timestamp.test.ts`
