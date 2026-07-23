---
title: "Audit/remove PG static FORMAT_TYPE_ALIASES string-lookup path"
status: ready
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Audit/remove the PG static FORMAT_TYPE_ALIASES string-lookup path

## Context

Rails' PG type map is keyed by OID/short typname only; a sql_type string is
resolved via the live regtype query (postgresql/quoting.rb:195), ported in
PR 5150. trails still carries an invented string-keyed fallback:
`normalizeFormatType` + `FORMAT_TYPE_ALIASES`
(packages/activerecord/src/connection-adapters/postgresql-adapter.ts, ~line
5450-5495) consumed by the oid==null branch of `lookupCastTypeFromColumn`
(~line 959-975). After PR 5150 the DDL default-quoting shim no longer uses
that branch; audit remaining callers (if any reach it with oid==null), then
either delete the alias table + branch or document who still needs it.

## Acceptance criteria

- [ ] Enumerate callers reaching `lookupCastTypeFromColumn` with `oid == null`.
- [ ] If none: remove `normalizeFormatType`/`FORMAT_TYPE_ALIASES` and the
      branch; if some: converge them on Rails' regtype/OID resolution or
      document at the call site.
