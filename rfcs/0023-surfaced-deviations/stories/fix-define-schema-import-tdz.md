---
title: "Break adapter-graph circular init so define-schema imports without TDZ crash"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-07-03T00:45:51Z"
assignee: "fix-define-schema-import-tdz"
blocked-by: null
---

## Context

While running the materialize generator
(`packages/activerecord/scripts/materialize-model-declares.ts`) under tsx,
any module that statically imports a runtime value from
`packages/activerecord/src/test-helpers/define-schema.ts` (e.g.
`isWrappedSchema`) TDZ-crashes:

```text
ReferenceError: Cannot access 'SchemaStatements' before initialization
  at connection-adapters/abstract-adapter.ts:2391
    include(AbstractAdapter, SchemaStatements);
```

`define-schema.ts` imports `SchemaStatements` (a value), which pulls in the
whole adapter graph; `abstract-adapter.ts` evaluates
`include(AbstractAdapter, SchemaStatements)` at module top-level before
`SchemaStatements` is initialized due to a circular import edge. This
reproduces on `origin/main` (predates #4115) and is independent of my changes.

PR #4115 worked around it only for the generator by loading `TEST_SCHEMA` /
`isWrappedSchema` via lazy `await import(...)` and only when materializing
files under MODELS_DIR. The underlying circular-init fragility remains: any
future non-test-runtime consumer importing `define-schema` (or the adapter
graph) at module top-level will hit the same TDZ.

Relevant code:

- `connection-adapters/abstract-adapter.ts` top-level `include(AbstractAdapter, SchemaStatements)`
- `connection-adapters/abstract/schema-statements.ts`
- `test-helpers/define-schema.ts` value import of `SchemaStatements`

## Acceptance criteria

- [ ] Identify the circular edge that forces `SchemaStatements` to be
      referenced before initialization at `abstract-adapter.ts` module eval.
- [ ] Restructure so the `include(...)` wiring no longer TDZ-crashes when the
      graph is imported from a non-test-runtime entry point (e.g. defer the
      include, or break the import cycle).
- [ ] A standalone script that statically imports `isWrappedSchema` from
      `define-schema.ts` loads without ReferenceError.
- [ ] Revert the generator's lazy-import workaround (or keep it if still
      desirable for import-cost reasons) — no longer load-bearing.
