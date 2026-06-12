---
title: "F-9e — adapter_test backend introspection probes (MySQL/PG)"
status: draft
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

## Acceptance criteria

Residue from F-9a (#3150). MySQL/PG-only introspection probes, gated via
`describeIfMysql`/`describeIfPg`; local-verify-only until RFC 0012 wires the
adapter-dir CI lane. Skipped `adapter.test.ts` entries:

- `charset` (abstract-mysql-adapter#charset)
- `show nonexistent variable returns nil` (abstract-mysql-adapter#showVariable)
- `not specifying database name for cross database selects` (MySQL cross-DB select)
- `current database` (MySQL/PG `currentDatabase`; Rails respond_to? gate skips SQLite)
- `advisory locks enabled?` (AdvisoryLocksEnabledTest; PG override + establishConnection(advisoryLocks:) config plumbing)

## Additional acceptance criteria

- [ ] Probes pass under MySQL/PG gating; SQLite stays skipped via respond_to? equivalent.
- [ ] `test:compare --cached --package activerecord` delta non-negative.
