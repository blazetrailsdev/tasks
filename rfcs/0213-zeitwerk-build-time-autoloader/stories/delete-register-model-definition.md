---
title: "delete-register-model-definition"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - register-x-retires-from-activerecord-tests
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `register-x-retires-from-other-tests`, whose PR converted every caller outside activerecord and deleted `registerController`, `registerJob`, `registerChannel` and `registerConnection`. `registerModel` could not go there: `register-x-retires-from-activerecord-tests` (trails#9647) was still open. RFC 0213 § "`registerX` retires".

Left to do: `packages/activerecord/src/associations.ts:99` (`registerModel`, `assertActiveRecordBase`), its export, `packages/activerecord/src/register-model-batch.trails.test.ts`, the `registerModel` arm of `packages/activerecord/scripts/materialize-model-declares.ts:433`, and the `registerModel` bullet in root `CLAUDE.md` § "Constant lookup is an import or a registry" and `packages/activerecord/CLAUDE.md:306`.

## Acceptance criteria

- `registerModel` is deleted and no live caller remains (strings in `scripts/api-compare` and `eslint` test fixtures may stay).
- `register-model-batch.trails.test.ts` is removed.
- `materialize-model-declares.ts` no longer reads `registerModel` aliases.
