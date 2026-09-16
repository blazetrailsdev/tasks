---
title: "Split the four oversized RFC 0130 adapter/fixtures/mixin convergence stories"
status: draft
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The four RFC 0130 stories `converge-adapter-execute-mutation-onto-exec-statements`, `converge-adapter-schema-and-result-helper-surface`, `converge-fixtures-helper-surface-onto-rails-fixtures`, `converge-model-mixin-plumbing-surface` were bundled into one ~700 LOC slot but measured ~10x that (trails#7836): `executeMutation` 470 refs/72 files, `defineEnum` 47 refs/16 files, `defineFixtures` 50/6, `generateModels` 38/4, `fromRowHashes` 39/17, `enumType` 32/12. Their prose also names `assertSafeMysqlIdentifier`, `deduplicateKey`, `fkDetails`, which no longer exist in `packages/`. trails#7836 already converged `TransactionCallback`, `includeAggregations`, `makeCachedSelectAll`, `tableCollationCache` and the `AssociationCache` receipts.

## Acceptance criteria

- Each of the four stories is split into per-name (or per-caller-cluster for `executeMutation`) stories that each fit the PR LOC ceiling, with honest `est-loc`.
- Stale names are removed from story prose; converged names from trails#7836 are struck.
