---
title: "PG array-literal quoting threads dialect so datetime elements get quoted_date formatting"
status: ready
updated: 2026-07-07
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced during PR #4753 (sqlite-mysql-datetime-literal-fixed-6-microseconds).

The two PG array-literal quoting sites in `packages/activerecord/src/base.ts`
(`arelSql(quoteSqlValue(raw, true))` at ~3594 and ~3720) do not thread a
`dialect` down to individual array elements. `quoteSqlValue` accepts a `dialect`
arg and routes scalar Temporal values through `temporalToBindString(v, dialect)`
(PG BC / fixed-6 formatting), but for arrays it delegates to
`quoteArrayLiteral(v)` in `packages/arel/src/quote-array.ts`, which:

- takes no `dialect` param, and
- formats Temporal elements via a generic `toISOString`/`JSON.stringify`
  fallback (Temporal.Instant has no `toISOString`, so it falls to JSON.stringify
  → ISO-8601 with `T`/`Z`), NOT the dialect-correct `quoted_date` literal.

So a datetime element inside a PG array literal skips the BC-suffix and fixed-6
microsecond formatting that scalar datetimes get. Edge case (datetime[] columns
inlined rather than bound), explicitly scoped out of PR #4753.

## Acceptance criteria

- [ ] `quoteArrayLiteral` (arel) accepts a `dialect` and formats Temporal
      elements through the same dialect-correct formatter the scalar path uses
      (`temporalToBindString` / the sql-datetime formatters), including PG BC +
      fixed-6 microseconds.
- [ ] The two `base.ts` array sites pass the PG dialect through.
- [ ] Unit coverage: a datetime element in a PG array literal emits the same
      `quoted_date` form as the scalar PG path (incl. BC + `.ffffff`).
- [ ] test:compare / api:compare delta non-negative.
