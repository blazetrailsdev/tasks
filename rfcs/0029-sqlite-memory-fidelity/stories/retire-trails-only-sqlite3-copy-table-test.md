---
title: "Fold or retire the trails-only sqlite3-copy-table test file"
status: done
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5538
claim: "2026-07-28T22:05:43Z"
assignee: "retire-trails-only-sqlite3-copy-table-test"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5505 (story `converge-connection-adapters-sqlite3-bespoke-tables`).

`packages/activerecord/src/connection-adapters/sqlite3-copy-table.test.ts` is a
trails-only file — it has no Rails counterpart, so `test:compare` can never
match it. #5505 deleted the eight tests that were redundant with the faithful
ports (`adapters/sqlite3/copy-table.test.ts`,
`adapters/sqlite3/collation.test.ts`) and moved the rest onto canonical tables,
but ten trails-invented test names remain, covering the private rebuild helpers
(`tableStructureSql`, `tableStructureWithCollation`, `tableStructure`,
`copyTableIndexes`, `moveTable`, `alterTable`) at a finer granularity than
Rails' `copy_table_test.rb`.

Per the north star (`project_north_star_drop_defineschema`, RFC 0029), the
endgame is that every AR test file mirrors a Rails file. This one should either
fold its assertions into the existing ports or be retired.

## Acceptance criteria

- [ ] Each remaining test is either folded into the Rails port that owns the
      code path, or kept with a recorded reason why no Rails test reaches it.
- [ ] If nothing survives, the file is deleted.
- [ ] `pnpm test:compare` counts do not regress.
