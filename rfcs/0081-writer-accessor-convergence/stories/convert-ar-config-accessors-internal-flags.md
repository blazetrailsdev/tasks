---
title: "convert-ar-config-accessors-internal-flags"
status: done
updated: 2026-07-29
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5564
claim: "2026-07-29T02:35:44Z"
assignee: "convert-ar-config-accessors-internal-flags"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `module-level-config-accessor-shape`, which settled the shape and
converted 3 of 23 flags. Read the "Decision — shape 2" section of the RFC README
first; it is prescriptive (object literal `ActiveRecord` in
`packages/activerecord/src/ar-config.ts`, `get`/`set` over a file-local `let`,
old `export let` + `setX` DELETED, not deprecated).

This story converts the 12 flags that are NOT re-exported from `index.ts`, so
the change is package-internal:

`databaseCli`, `belongsToRequiredValidatesForeignKey`, `applicationRecordClass`,
`errorOnIgnoredOrder`, `timestampedMigrations`, `migrationStrategy`,
`verifyForeignKeysForFixtures`, `useYamlUnsafeLoad`, `raiseIntWiderThan64bit`,
`yamlColumnPermittedClasses`, `generateSecureTokenOn`,
`raiseOnAssignToAttrReadonly`.

`trailtie.ts`'s `active_record.set_configs` initializer forwards four of these
(`raiseOnAssignToAttrReadonly`, `belongsToRequiredValidatesForeignKey`,
`generateSecureTokenOn`) and is the pattern the pilot already converted for
`maintainTestSchema` / `queues` — follow it. `ar-config.test.ts` asserts the
defaults and setter round-trips for most of this batch and must move to
`ActiveRecord.x` alongside.

Call-site counts (references, `packages/activerecord/src`):
raiseOnAssignToAttrReadonly 16, belongsToRequiredValidatesForeignKey 12,
applicationRecordClass 10, errorOnIgnoredOrder 9, generateSecureTokenOn 8,
useYamlUnsafeLoad 5, yamlColumnPermittedClasses 5, timestampedMigrations 4,
raiseIntWiderThan64bit 4, databaseCli 3, migrationStrategy 3,
verifyForeignKeysForFixtures 3.

## Acceptance criteria

- All 12 flags moved onto the `ActiveRecord` object; their `export let` and
  `setX` declarations deleted. After this story `ar-config.ts` has no
  `export let` left.
- All internal call sites read/assign through `ActiveRecord.x`.
- `pnpm api:compare` credits each flag under its Rails name; overall matched
  count does not drop.
- Under the 500-LOC ceiling; split further if it is not.
