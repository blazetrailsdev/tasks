---
title: "Retire the invented reverse-FK lookup when the canonical-rebuild shield goes"
status: closed
updated: 2026-07-29
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
closed-reason: "Not retirable: the shield is entrenched, not retiring. The RFC 0070 burndown is complete (burn-down-canonical-rebuild-exclude and all ten restore-* stories are done), yet rebuildCanonicalTables still has 21 live call sites across 20 test files on origin/main (8272ae40b) plus support/setup-second-pool.ts. The remaining callers are not vestigial: they defend tests that legitimately alter a canonical table's shape (migration.test.ts, schema-dumper.test.ts, the mysql2 adapter tests) and documented PG shared-DB flakes (date.test.ts, dirty.test.ts, uniqueness-validation.trails.test.ts). Direction of travel is the opposite of retirement: PR #5519 landed the eslint rule require-canonical-rebuild, which *requires* a rebuild after a catalogue-driven canonical drop, and the two still-open RFC 0070 stories (require-canonical-rebuild-detection-gaps #5554, require-table-teardown-accept-prefix-sweep) both widen that requirement. So bulkInboundFkHost, the scanInbound option, and FkSafeDropPlanHost.foreignKeysReferencing stay, with this as their written justification: they have no Rails counterpart (SchemaStatements#foreign_keys is per-table only, with no reverse form), they are confined to packages/activerecord/src/test-helpers + support and reach no production adapter, and they were accepted on cost grounds (~790ms/PG, ~530ms/MySQL saved per rebuild call on a 322-table canonical DB). Per the story's own acceptance criteria, a standing invention with a recorded justification is an acceptable outcome. Re-open when the caller count reaches zero."
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

Note (2026-07-28): claimed during the #5519 session but never started, and
released back to `ready` unstarted. Re-read the premise against current `main`
before picking it up — #5522 (`split-canonical-schema-registry-from-template-machinery`)
and #5503 both landed in canonical-schema machinery afterwards and may have
changed which callers `rebuildCanonicalTables` still has.

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
