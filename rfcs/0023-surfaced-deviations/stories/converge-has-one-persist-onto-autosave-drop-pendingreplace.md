---
title: "Converge has_one persistence onto Rails autosave path; retire _pendingReplace machinery"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-07-03T15:33:52Z"
assignee: "converge-has-one-persist-onto-autosave-drop-pendingreplace"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `has-one-autosave-callback-unconditional-registration`
(PR #4480), which made the has_one `after_create`/`after_update` autosave
runner register unconditionally (matching Rails `add_autosave_association_callbacks`,
`elsif reflection.has_one?`).

trails persists has_one children via a trails-only `_pendingReplace` /
`persistReplace` / `flushPendingReplaces` machinery
(`associations/has-one-association.ts`, `has-one-through-association.ts`,
`base.ts:3328`) — Rails has no such concept; it persists purely through
`save_has_one_association` (autosave_association.rb:473-504). To avoid
double-saving now that the autosave callback always runs, PR #4480 added a
`if (inst?._pendingReplace) return true` skip in `autosaveHasOne`
(autosave-association.ts:488) and kept the through-side workaround
`constructThroughRecordInMemory` (has-one-through-association.ts:149-182) that
queues the built join record onto the through proxy's `_pendingReplace`.

This leaves two parallel persistence paths for a has_one child (the general
autosave path and the writer-path `persistReplace`), reconciled by a flag skip.
The floating-`persistReplace` from the awaitable `writer()` on a persisted owner
(has-one-association.ts:52-57) also races the autosave callback when un-awaited
(root cause of the PG double-write fixed in PR #4480 by awaiting in tests).

## Acceptance criteria

- [ ] Evaluate converging the has_one write path onto the single Rails
      `save_has_one_association` autosave path, removing (or minimizing) the
      trails-only `_pendingReplace`/`persistReplace`/`flushPendingReplaces`
      machinery and the `autosaveHasOne` `_pendingReplace` skip guard.
- [ ] Simplify/remove the `constructThroughRecordInMemory` through-side
      workaround once the general path persists lone built join records.
- [ ] Ensure `writer()` immediate-persist semantics (Rails' persist-on-assignment
      to a saved owner) are met without a floating promise that races owner
      autosave.
- [ ] No regression in has_one / has_one_through / autosave suites on
      sqlite + PG + MariaDB.

Rails: `vendor/rails/activerecord/lib/active_record/autosave_association.rb`
(`save_has_one_association`), `associations/has_one_association.rb`,
`associations/has_one_through_association.rb`.
