---
title: "Decouple adapter-graph TDZ guard test from define-schema before it is deleted"
status: in-progress
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: 1
pr: 4498
claim: "2026-07-03T17:33:51Z"
assignee: "decouple-tdz-guard-from-define-schema"
blocked-by: null
closed-reason: null
---

## Context

PR #4458 added a regression guard for the adapter-graph circular-init TDZ:
`scripts/test-deps/adapter-graph-import-tdz.test.ts`. It has two assertions —
one imports `SchemaStatements` (value) directly (the load-bearing check that
actually reproduces the TDZ entry condition), and one imports `isWrappedSchema`
from `packages/activerecord/src/test-helpers/define-schema.ts`.

RFC 0059 deletes `define-schema.ts`. When it lands, the second import breaks the
guard file. The `SchemaStatements`-value assertion is entirely
define-schema-independent and preserves the full regression protection on its
own.

## Acceptance criteria

- [ ] Drop the `isWrappedSchema` / `define-schema.ts` import + assertion from
      `scripts/test-deps/adapter-graph-import-tdz.test.ts`, keeping the
      `SchemaStatements`-value import assertion (which is what genuinely guards
      the TDZ).
- [ ] Guard test still fails against a reverted abstract-adapter (module-eval
      include) and passes with the fix.
- [ ] Do this as part of / alongside the define-schema removal so the guard
      never references a deleted module.
