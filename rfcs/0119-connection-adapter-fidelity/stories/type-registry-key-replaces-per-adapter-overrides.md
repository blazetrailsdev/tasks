---
title: "type-registry-key-replaces-per-adapter-overrides"
status: claimed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-05T01:42:09Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

PR #7153 (RFC 0113) separated `ADAPTER_NAME` from the type-registry key and
added a `typeRegistryKey` reader to `AbstractAdapter` plus each of the three
concrete adapters
(`packages/activerecord/src/connection-adapters/{abstract-adapter,abstract-mysql-adapter,postgresql-adapter,sqlite3-adapter}.ts`).

Rails has no such reader: it reaches the registry through per-adapter method
overrides where trails still branches on a key, so each branch is one of those
overrides waiting to be written. All four readers carry a bare
`@noRailsEquivalent CONVERGEABLE`.

## Acceptance criteria

- Each `typeRegistryKey` branch becomes the per-adapter override Rails
  dispatches to, and the four
  `@noRailsEquivalent CONVERGEABLE type-registry-key-replaces-per-adapter-overrides`
  receipts are deleted with the reader.
- `pnpm parity:api:extra --package activerecord` novel count strictly drops.
