---
title: "convert-ar-config-accessors-exported-flags"
status: in-progress
updated: 2026-07-29
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5563
claim: "2026-07-29T02:25:45Z"
assignee: "convert-ar-config-accessors-exported-flags"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `module-level-config-accessor-shape`, which settled the shape and
converted 3 of 23 flags. Read the "Decision — shape 2" section of the RFC README
first; it is prescriptive (object literal `ActiveRecord` in
`packages/activerecord/src/ar-config.ts`, `get`/`set` over a file-local `let`,
old `export let` + `setX` DELETED, not deprecated).

This story converts the 8 flags that are re-exported from
`packages/activerecord/src/index.ts` (the reader AND its `setX`), so the public
package surface changes with them:

`protocolAdapters`, `disablePreparedStatements`, `beforeCommittedOnAllRecords`,
`runAfterTransactionCallbacksInOrderDefined`, `actionOnStrictLoadingViolation`,
`indexNestedAttributeErrors`, `schemaCacheIgnoredTables`,
`permanentConnectionCheckout`.

Note `permanentConnectionCheckout`'s current `setPermanentConnectionCheckout`
validates its argument and throws `ArgumentError`; the setter accessor must keep
that check. `isSchemaCacheIgnoredTable` reads `schemaCacheIgnoredTables` in the
same file and must be repointed at the backing binding.

Call-site counts (references, `packages/activerecord/src`): protocolAdapters 12,
indexNestedAttributeErrors 10, permanentConnectionCheckout 9,
actionOnStrictLoadingViolation 8, disablePreparedStatements 7,
beforeCommittedOnAllRecords 5, runAfterTransactionCallbacksInOrderDefined 5,
schemaCacheIgnoredTables 5.

## Acceptance criteria

- All 8 flags moved onto the `ActiveRecord` object; their `export let` and
  `setX` declarations deleted.
- The 8 reader/`setX` names removed from `index.ts` (`ActiveRecord` is already
  exported there).
- All internal call sites read/assign through `ActiveRecord.x`.
- `pnpm api:compare` credits each flag under its Rails name (check
  `output/api-comparison.json` for `"tsName": "protocolAdapters"` etc., not
  `setProtocolAdapters`); overall matched count does not drop.
- Under the 500-LOC ceiling; split further if it is not.
