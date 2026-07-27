---
title: "Emit and validate RFC priority in the tasks index builder"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5416 added RFC-level ready-queue priority (`priority:` in an RFC README's
frontmatter). The tasks repo's index builder knows nothing about it:
`tasks/scripts/build-index.mjs:52-66` emits the RFC row without a `priority`
field, and `tasks/scripts/validate-lib.mjs` validates `priority` only for
stories (`:214-217`), not for RFCs.

Two consequences the trails CLI absorbs today:

- `applyRfcPriorities` (`scripts/tasks/cli.ts:2232`) re-reads every RFC README
  on each index load to fill `rfcs[].priority` in memory.
- A malformed RFC priority (`priority: high`, `priority: -5`) is silently
  ignored by `parseRfcPriority` (`scripts/tasks/cli.ts:2212`) instead of being
  rejected at commit the way a malformed story priority is.

## Acceptance criteria

- `build-index.mjs` emits `priority` on each RFC row, mirroring the story rule
  (`Number.isInteger(fm.priority) ? fm.priority : null`).
- `validate-lib.mjs` rejects a non-integer or negative RFC `priority`, matching
  the story-priority message.
- With the index carrying the field, `applyRfcPriorities` becomes a no-op
  fallback: decide whether to drop it and the `READ_INDEX_CACHE_VERSION`
  suffix (`scripts/tasks/cli.ts:161`) or keep it for older index.json files.
- Trails CLI tests still pass unchanged.
