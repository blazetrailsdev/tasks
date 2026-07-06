---
title: "Optional: warm schema cache after raw CREATE TABLE in adapter tests"
status: ready
updated: 2026-07-06
rfc: "0046-strict-write-attribute-internal-convergence"
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

Per-model column declaration (the declare-\* stories) is mechanical and broad.
A systemic alternative: warm the per-connection schema cache after a raw
`adapter.exec("CREATE TABLE …")` in the adapter test harness, so `columnsHash()`
reflects the real columns synchronously and no hand-declaration is needed.

During #4027, making `defineSchema(adapter, …)` warm by default regressed
low-level migration/adapter tests and no-opped for non-pooled wrapper adapters
(`_warmSchemaCache` requires `adapter.pool`). This story investigates a narrower,
safe warming hook (e.g. an opt-in helper the adapter suites call after raw DDL,
or warming only pooled adapters) that does not perturb migration/DDL tests.

## Acceptance criteria

- [ ] A warming mechanism for raw-created tables that lets bespoke adapter-suite
      models reflect their PK synchronously, WITHOUT regressing migration / DDL /
      low-level adapter tests.
- [ ] If viable, it obsoletes the need for hand-declaring columns in the
      declare-\* stories (note the overlap; don't double-do the work).
- [ ] If not viable safely, close with findings and defer to the declare-\* path.
