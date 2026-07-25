---
title: "Measure, and if material batch, the inbound-FK scan in rebuildCanonicalTables"
status: done
updated: 2026-07-25
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5300
claim: "2026-07-25T13:19:47Z"
assignee: "bulk-reverse-fk-lookup-for-inbound-scan"
blocked-by: null
closed-reason: null
---

## Context

`rebuildCanonicalTables`
(`packages/activerecord/src/test-helpers/canonical-schema.ts`) now calls
`fkSafeDropPlan(..., { scanInbound: true })` (added by #5277) so a stray FK
pointing at a canonical table from outside the rebuild set is found and dropped
before the drop. The scan is unavoidable for correctness — the drop set holds no
FK of its own in exactly that shape, so no cheap signal can hint at it — but it
costs **one FK introspection per live table not being rebuilt**: ~300 on a
loaded canonical DB, once per `rebuildCanonicalTables` call, across 21 call
sites.

On SQLite (`PRAGMA foreign_key_list`) this is in the noise: `reserved-word.test.ts`
measured 11.6s vs 11.9s across runs, within run-to-run variance. On PG and MySQL
each iteration is a catalog query (`pg_constraint` joins /
`information_schema.KEY_COLUMN_USAGE`), and that cost has **not** been measured —
it may or may not be material.

Blocking a cheaper implementation: there is no bulk "which FKs point at these
tables" API. `SchemaStatements#foreignKeys` is per-table in Rails too
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`),
so a reverse/bulk lookup is a **trails invention with no Rails counterpart** — it
needs a deliberate deviation decision, which is why #5277 did not do it inline.

## Acceptance criteria

- Measure the scan cost on PG and MySQL first (per-call wall clock on a loaded
  canonical DB). If it is not material, close this story as no-work rather than
  inventing adapter surface — that outcome is a valid result.
- If it is material: add a bulk reverse-FK lookup behind the existing
  `FkSafeDropPlanHost` seam so `fkSafeDropPlan` keeps its current signature and
  unit tests, with the per-table loop as the fallback for adapters lacking it.
- Justify the invented adapter method at its call site per the deviation
  convention (no Rails counterpart — state why).
- Do NOT weaken `scanInbound: true` in `rebuildCanonicalTables` to buy speed:
  the integration test `"drops a foreign key reaching in from a table it is not
rebuilding"` pins it, and the heuristic it would fall back to structurally
  cannot see the inbound-only shape.
