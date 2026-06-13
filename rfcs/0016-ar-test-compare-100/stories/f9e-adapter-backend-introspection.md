---
title: "F-9e — adapter_test backend introspection probes (MySQL/PG)"
status: in-progress
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: 3179
claim: "2026-06-13T02:41:09Z"
assignee: "f9e-adapter-backend-introspection"
blocked-by: null
---

## Context

Residue from F-9a (#3150). MySQL/PG-only introspection probes, gated via
`describeIfMysql`/`describeIfPg`; CI-gated via the ARCONN-keyed adapter lanes (RFC 0012 lane is wired). Skipped `adapter.test.ts` entries:

- `charset` (abstract-mysql-adapter#charset)
- `show nonexistent variable returns nil` (abstract-mysql-adapter#showVariable)
- `not specifying database name for cross database selects` (MySQL cross-DB select)
- `current database` (MySQL/PG `currentDatabase`; Rails respond_to? gate skips SQLite)
- `advisory locks enabled?` (AdvisoryLocksEnabledTest; PG override + establishConnection(advisoryLocks:) config plumbing)

## Acceptance criteria

- [ ] Probes pass under MySQL/PG gating; SQLite stays skipped via respond_to? equivalent.
- [ ] `test:compare --cached --package activerecord` delta non-negative.
