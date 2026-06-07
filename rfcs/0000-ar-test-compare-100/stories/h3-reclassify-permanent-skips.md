---
title: "H-3 — reclassify permanent skips"
status: ready
updated: 2026-06-07
rfc: "0000-ar-test-compare-100"
cluster: hygiene
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~19 live `it.skip` in counted files are JS-impossible (YAML/Marshal, thread/fork).
Moving them to `PERMANENT-SKIP` + `unported-files.ts` shrinks the denominator
and makes 100% reachable. Also move `resolver.test.ts` "url missing scheme"
(JS-vs-Ruby divergence — scheme-less string → `AdapterNotSpecified`).

## Acceptance criteria

- [ ] Each candidate audited against `unported-files.ts` before reclassifying.
- [ ] YAML/Marshal/thread/fork offenders converted to `PERMANENT-SKIP` form and
      added to `unported-files.ts` (~19 total).
- [ ] `resolver.test.ts` "url missing scheme" added as documented divergence.
- [ ] `pnpm test:compare --package activerecord` denominator decreases by ~20.

## Notes

Offenders: `base.test.ts` (6), `query-cache.test.ts` (4), `schema-cache.test.ts`
(2), `extension.test.ts` (2), `prepared-statement-status.test.ts` (1), assoc
Marshal (3). `standalone-connection.test.ts` (4) stays live (externally blocked).
