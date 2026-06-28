---
title: "Fix maria date/multiparameter reflection under one-schema warm cache"
status: ready
updated: 2026-06-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Under `AR_ONE_SCHEMA=1`, `date.test.ts` and `multiparameter-attributes.test.ts`
fail MariaDB-only on the synchronous multiparameter date-assembly path:
`topic.last_read.equals is not a function` / `expected '2004' to be PlainDate`.
Both are CANONICAL (`useHandlerFixtures(["topics"], {schema: TEST_SCHEMA})`), not
deviations. They pass on sqlite/postgres and pass on maria in normal (drop) mode.

Likely mechanism: one-schema mode's per-test reset truncates instead of dropping
and does NOT clear the schema cache (`resetTestAdapterState` clears it every
beforeEach in normal mode). A MariaDB cold-lease date-type reflection then
persists in the warm cache, so `last_read` resolves to a non-PlainDate for the
synchronous assembler. Related to RFC 0031 (schema-cache-always-warm).
Excluded in PR #4246 (`eslint/one-schema-exclude.json`) to reach green.

## Acceptance criteria

- Root-cause the maria date-type reflection under the one-schema warm cache
  (cold-lease vs stale-cache; cf. mysql columns() MariaDB-flag cold-lease fix).
- `date.test.ts` + `multiparameter-attributes.test.ts` pass on maria under
  `AR_ONE_SCHEMA=1` and are removed from the exclude list.
- No DROP TABLE reintroduced on the data path to achieve it.
