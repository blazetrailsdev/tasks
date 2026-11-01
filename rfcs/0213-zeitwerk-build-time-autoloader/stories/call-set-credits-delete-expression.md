---
title: "call-set-credits-delete-expression"
status: done
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9573
claim: "2026-11-01T15:19:18Z"
assignee: "call-set-credits-delete-expression"
blocked-by: null
closed-reason: null
---

## Context

`collectCalls` in `scripts/api-compare/extract-ts-api.ts` does not credit a `delete` expression to the call set, though CLAUDE.md's Hash table names `delete h.k` as the native form and `extract-ts-api.ts:7772` already records it for arguments. Crediting it (`ts.isDeleteExpression` → `names.add("delete")`) staled `delete` rows across packages and added `thor base.ts remove_class_option order:delete,classOptions`. `packages/zeitwerk/src/registry.ts` `unregisterAutoload` carries a `@missingRailsCall delete` receipt because of this (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/registry.rb:64`).

## Acceptance criteria

- The call set credits a `delete` expression.
- The staled baseline rows are deleted and marks tightened.
- The thor order row is converged.
- The `registry.ts` receipt is removed.
