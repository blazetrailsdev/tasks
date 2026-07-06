---
title: "Audit: which SQLite-suite models still depend on the internal-write bridge"
status: ready
updated: 2026-07-06
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The internal-write bridge (`readonly-attributes.ts` `_writeAttribute`
`catch → writeCastValue`) may also be silently rescuing SQLite-visible bespoke
models whose tables aren't schema-warmed at construction. Before removing the
bridge we need to know the full set of SQLite-suite models that still depend on
it (beyond those already converged in PR #4027).

## Acceptance criteria

- [ ] Temporarily make the bridge throw (or log) instead of seeding, run the
      SQLite AR suite, and enumerate every test + bespoke model that hits it.
- [ ] Produce an inventory (file → model → missing column) and either fold the
      fixes into the declare stories or list them for the bridge-removal story.
- [ ] Spike/audit only — no production code change required to close (deliver
      the inventory via the audit-report skill).
