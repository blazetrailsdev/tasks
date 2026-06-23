---
title: "PG DateTime#serialize returns null for infinity/-infinity strings"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3982
claim: "2026-06-23T12:12:39Z"
assignee: "datetime-serialize-infinity-string-returns-null"
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts`
`DateTime#serialize` returns `null` when given the PG infinity _strings_
`"infinity"` / `"-infinity"`:

```ts
override serialize(value: unknown): string | null {
  if (value === DateInfinity) return "infinity";          // sentinel === +Infinity (number)
  if (value === DateNegativeInfinity) return "-infinity";  // sentinel === -Infinity (number)
  const cast = this.cast(value);
  if (cast === null || cast === DateInfinity || cast === DateNegativeInfinity) return null; // BUG
  ...
}
```

The early-return checks compare the _original_ value against the
`DateInfinity`/`DateNegativeInfinity` sentinels, which are literally
`Number.POSITIVE_INFINITY` / `Number.NEGATIVE_INFINITY`
(`activemodel/src/type/internal/sentinels.ts`). So numeric `±Infinity`
serializes correctly to `'infinity'`/`'-infinity'`, but the string forms
`"-infinity"`/`"infinity"` fall through to `this.cast(...)`, which casts them
to the sentinel, and the line then returns `null` instead of the wire literal.

Discovered in PR #3872 (schema-dumper-pg-infinity-float-default): a
`t.datetime("x", { default: "-infinity" })` column default persisted as
`DEFAULT NULL` instead of `'-infinity'::timestamp`. That PR worked around it by
passing numeric `±Infinity` for the datetime defaults (faithful since the
sentinels ARE the numbers, and matches how the date columns are written), but
the Rails `schema_dumper_test.rb` source uses the string form
`default: "-infinity"`, so the string path should round-trip.

Rails: `PostgreSQL::OID::DateTime#serialize` inherits the infinity handling
from the quoting layer; the string `"-infinity"` is a valid PG datetime input
and must serialize to itself.

## Acceptance criteria

- [ ] `DateTime#serialize("-infinity")` returns `"-infinity"` (and `"infinity"`
      → `"infinity"`), not `null`.
- [ ] `t.datetime(col, { default: "-infinity" })` persists
      `'-infinity'::timestamp...` (verify via introspection), matching the
      numeric-default path.
- [ ] Optionally re-converge the `schema dump with column infinity default`
      test (schema-dumper.test.ts) datetime columns to the Rails-exact string
      defaults `"-infinity"` / `"infinity"`.
- [ ] No regression in datetime value serialization (insert/round-trip tests).
