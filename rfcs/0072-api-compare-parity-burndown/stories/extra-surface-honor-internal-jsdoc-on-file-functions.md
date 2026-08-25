---
title: "extra-surface: honor @internal JSDoc on top-level exported functions"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5335
claim: "2026-07-26T02:14:52Z"
assignee: "extra-surface-honor-internal-jsdoc-on-file-functions"
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). **This is the single biggest false-positive source on the
`novel` side of `pnpm parity:api:extra`: 100 of activerecord's 776 novel names
(13%) are exported functions that already carry an `@internal` JSDoc tag.**

`scripts/api-compare/extra-surface.ts:399-418` (`collectTsFileNames`) drops
any `MethodInfo` with `internal === true`, and the header comment at
`extra-surface.ts:21` claims `@internal` JSDoc sets that flag. It does — but
only for class/module members. For top-level exported functions collected
into `tsPkg.fileFunctions`, `scripts/api-compare/extract-ts-api.ts` never
reads the leading JSDoc, so `internal` is `undefined`.

Reproduction (with `scripts/api-compare/output/ts-api.json` built by
`pnpm parity:api`):

```text
packages/activerecord/src/connection-adapters/abstract/quoting.ts:524-530
  /** … @internal */
  export function dispatchQuote(host: QuotingDispatchHost, value: unknown)
```

yet `ts-api.json` records
`packages.activerecord.fileFunctions["connection-adapters/abstract/quoting.ts"]`
→ `{ name: "dispatchQuote", internal: undefined }`, and `pnpm parity:api:extra
--package activerecord` reports `dispatchQuote` as novel drift.

All ten `dispatch*` novel names on `connection-adapters/abstract/quoting.ts`
are `@internal`. Same pattern across the top-20: `inheritance.ts`
(`classHasAttribute`, `getAbstractClass`, `getApplicationRecordClass`,
`inheritanceColumnDisabled`, `narrowToProjectedColumns`, `setAbstractClass`,
`stiEnabled`, `subclassFromAttributesForNew`), `relation/query-methods.ts`
(`assertValidLeftOuterJoinsBang`, `buildCteSql`, `buildProjections`,
`emitJoinPlan`, `flattenedOrderArgs`, `isBlankArgument`,
`normalizeBoundValue`, `referencesFromConditions`, `structuralUnionEq`),
`associations.ts` (`applyAssociationScope`, `habtmTargetFk`,
`lookupModelWithAutoload`, `resolveAssocClass`), `model-schema.ts`
(`cachedTableExists`, `clearAttributeNamesMemo`, `reconcileVirtualAttributes`),
`connection-adapters.ts` (`resolveSync`, `resolveSyncError`),
`connection-adapters/abstract-adapter.ts` (`adapterNameFromConfig`),
`connection-adapters/abstract-mysql-adapter.ts` (`parseTableOptions`),
`base.ts` (`quoteSqlValue`), `migration.ts` (`registerMigrationArConfig`).

Note this also affects the CONTRIBUTING.md `@internal` convention's
credibility everywhere else `fileFunctions` feed a check — audit any other
consumer of `fileFunctions[*].internal` while fixing.

## Acceptance criteria

- `extract-ts-api.ts` records `internal: true` on `fileFunctions` entries
  whose declaration carries an `@internal` JSDoc tag, matching the existing
  class/module-member behavior exactly (same tag detection, same
  leading-comment lookup).
- A unit test in `scripts/api-compare/extract-ts-api.test.ts` covers an
  `@internal`-tagged top-level `export function` and an untagged sibling in
  the same fixture file.
- `pnpm parity:api && pnpm parity:api:extra --package activerecord` reports
  activerecord novel count dropping from 776 to roughly 676; record the
  exact new number in the PR body.
- No change to `parity:api` parity percentages (`@internal` already had no
  effect on the Rails-side comparison for these names) — state the
  before/after overall figure in the PR body to prove it.
