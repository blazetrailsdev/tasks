---
title: "Retire the invented reverse-FK lookup when the canonical-rebuild shield goes"
status: ready
updated: 2026-07-25
rfc: "0070-drop-repair-worker-schema"
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

PR #5300 introduced `bulkInboundFkHost`
(`packages/activerecord/src/test-helpers/canonical-schema.ts`), a reverse
"which foreign keys point at these tables" lookup. **It has no Rails
counterpart**: `SchemaStatements#foreign_keys` is per-table in Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`)
and Rails has no reverse form at all, so there is nothing upstream to port. It
was accepted on cost grounds — the per-table scan measured ~790ms per
`rebuildCanonicalTables` call on PostgreSQL and ~530ms on MySQL on a loaded
canonical DB (322 tables), across 21 call sites — and deliberately confined to
the test helper rather than added to any production adapter, so no adapter grows
a surface Rails lacks.

That confinement caps the blast radius but does not retire the invention. Both
it and the `scanInbound` scan it accelerates exist only to serve
`rebuildCanonicalTables`, which is itself an anti-contamination shield: it
repairs a canonical table a sibling test file left in a reduced shape on the
shared per-worker DB. When RFC 0070 / RFC 0059 finish removing the conditions
that make the shield necessary, the whole chain — `rebuildCanonicalTables`, the
inbound scan, and this bulk lookup — should go with it rather than be inherited
as permanent invented surface.

Related: `fkSafeDropPlan` itself is also a trails invention with no Rails
counterpart; this story is the tracking anchor for the pair.

## Acceptance criteria

- Re-check whether `rebuildCanonicalTables` still has live callers once the
  RFC 0070 burndown is complete (`burn-down-canonical-rebuild-exclude` and the
  `restore-*` stories are done; enumerate what is left).
- If the shield is retirable: delete `bulkInboundFkHost`, the `scanInbound`
  option, and the `foreignKeysReferencing` member of `FkSafeDropPlanHost` along
  with it, and the tests that pin them.
- If it is NOT retirable, close this story as no-work with the reason recorded —
  a standing invention with a written justification is an acceptable outcome, an
  untracked one is not.
- Do NOT weaken `scanInbound: true` as an intermediate step; the integration test
  `"drops a foreign key reaching in from a table it is not rebuilding"` pins it
  and the fallback heuristic structurally cannot see the inbound-only shape.
