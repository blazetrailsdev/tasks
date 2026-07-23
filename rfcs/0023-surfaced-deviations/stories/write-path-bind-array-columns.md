---
title: "Write path: bind array columns instead of inline quoting"
status: draft
updated: 2026-07-23
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

PR #5094 converged the write path to bind every column value as a
prepared-statement parameter — except array columns, which stay inline via
`arelSql(adapter.quote(raw))` (`writePathValueNode`,
`packages/activerecord/src/base.ts` ~line 860). Rails binds array attributes
like everything else: the Attribute reaches the visitor, and the PG adapter's
`type_cast` routes `OID::Array::Data` through `encode_array`
(postgresql/quoting.rb), so the driver receives the encoded `{...}` literal as
one bound TEXT param typed by the column. trails' PG `_bindForPg` already
handles `ArrayData` via `typeCast` (postgresql-adapter.ts ~3575-3582), so the
write path could bind arrays too; the inline path was kept in #5094 to hold
scope. Converging removes the last per-type split in `writePathValueNode`
(the helper then collapses to a bare BindParam) and stops array literals from
being embedded in the SQL string (prepared-statement reuse).

## Acceptance criteria

- [ ] Write-path array column values bind as parameters (encoded array string),
      not inline literals, on PG (the only adapter with array columns).
- [ ] `PostgresqlArrayTest` and datetime/binary-element array round-trips stay
      green.
- [ ] test:compare / api:compare delta non-negative.
