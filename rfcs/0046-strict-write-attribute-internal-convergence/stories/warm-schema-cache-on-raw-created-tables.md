---
title: "Optional: warm schema cache after raw CREATE TABLE in adapter tests"
status: closed
updated: 2026-07-07
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 46
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Spike: systemic warm hook not viable safely; the viable primitive Model.loadSchema() is already applied by the declare-* stories (#4714 merged, #4729 in-progress). Findings recorded in story body. Deferring to the declare-* path."
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

## Findings (2026-07-07) — not viable as a systemic hook; defer to declare-\*

Investigated the third acceptance bullet. A fully-systemic "warm after raw
`CREATE TABLE` in the harness so no hand-declaration is needed" hook is **not
viable safely**, for three converging reasons:

1. **The harness can't reach the models.** Bespoke adapter-suite models
   (`class X extends Base { static _tableName = "unsigned_types" }`) are
   defined _inside_ `it()` bodies, not at suite-setup time. A suite-level hook
   in `setupAdapterSuite` / `withTransactionalFixtures` has no handle to those
   classes to warm them.

2. **Connection-cache warming no-ops for these suites.**
   `eagerWarmSchemaCache` (`with-transactional-fixtures.ts:51`) already warms
   the per-connection `SchemaCache` via `sc.addAll(pool)` before the first
   test — but it requires `realPool(adapter.pool)`. The adapter suites use
   raw, non-pooled wrapper adapters (`new Mysql2Adapter(...)` /
   `new PostgreSQLAdapter(...)`), whose `pool === null`, so the warm is a
   no-op there. This is the same non-pooled gap that sank the `#4027`
   `_warmSchemaCache` default.

3. **A warm connection cache still wouldn't populate the model.** Even with a
   warm connection `SchemaCache`, a model needs `loadSchema()` /
   `ensureSchemaLoaded()` to fold reflected columns into its own
   `_attributeDefinitions`. `ensureSchemaLoaded` (`base.ts:1313`) _bails_ the
   moment the model has a concrete `attribute()` — so the reflected-metadata
   models (e.g. `UnsignedType`, whose range assertions read the reflected
   `unsigned` flag) can't declare their PK anyway and must warm explicitly.

**The viable warming primitive already exists and is already applied**:
per-model `Model.loadSchema()`. That is exactly what the declare-\* stories
use — `declare-mysql-adapter-suite-model-columns` (PR #4714, merged) warms
`UnsignedType` via `UnsignedType.loadSchema()`;
`declare-pg-adapter-suite-model-columns` (PR #4729, in-progress) declares real
PKs and keeps `loadSchema()` on reflection-dependent models. A systemic hook
would reduce to those same per-model calls, so it would double-do the
declare-\* work with no reduction in surface.

**Decision:** close; defer to the declare-\* path. No PR.
