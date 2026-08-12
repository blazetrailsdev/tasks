---
title: "fold-perform-insert-update-into-persistence-record-bodies"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6430
claim: "2026-08-12T18:36:50Z"
assignee: "fold-perform-insert-update-into-persistence-record-bodies"
blocked-by: null
closed-reason: null
---

## Context

UPDATED 2026-08-12: the CREATE half landed in PR #6418 — `_performInsert` is
gone from `base.ts` and its body is inlined in `persistence.ts#_createRecord`,
which retired the `attributes_for_create`, `type_for_attribute` and
`deserialize` rows. What remains is the UPDATE half (`_performUpdate`), plus the
three `_create_record` rows the create fold did NOT retire — each now carries
its own reviewed reason in `persistence.json` rather than pointing here:
`attributes_with_values` (the port binds `valuesForDatabase()`, not the cast
values `attributes_with_values` yields), `with_connection` (the port uses the
already-threaded connection so the INSERT does not flip the lease permanent) and
`id` (Rails returns `id`; the trails chain returns a boolean). Converging those
three is a behaviour change, not a move, and is out of this story's scope.

Original context follows.

Follow-up to `move-persistence-create-update-record-to-persistence-ts` (PR
pending), which moved the Persistence layer of the create/update super chain out
of `callbacks.ts` and into `persistence.ts` as the instance-side `_createRecord`
/ `_updateRecord` (`persistence.rb:900-916`, `:918-942`). That story's second
half — folding `base.ts`' trails-only `_performInsert` / `_performUpdate`
decompositions into those two bodies — was left out: it is a ~320 LOC move on
its own, and `_performInsert` (base.ts:3449) / `_performUpdate` (base.ts:3594)
reach private record state (`_pendingOperation`, `_attributes`,
`_dirty.reinstateNewRecordChanges`) and pull in `LockingOptimistic`,
`_attributesForCreate` and `writePathValueNode`, so the move has real
import-cycle risk against `base.ts` (CLAUDE.md, "Call-time constant
resolution").

Rails inlines the work: `_insert_record` and `_update_row` are the only
extractions it makes (`persistence.rb:920-940`). The cost of the split is now
measured — pairing `persistence.ts#_createRecord` with `persistence.rb:918-942`
surfaced six call-set rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/persistence.json`
(`attributes_for_create`, `attributes_with_values`, `with_connection`,
`type_for_attribute`, `deserialize`, `id`), each carrying a reason naming this
story as the one that retires it.

Note `_performInsert` is deliberately SYNC (it parks the statement promise in
`_pendingOperation` so the sync half of the chain can start it) — see the
`async body defers scalar writes` trap before making it async.

## Acceptance criteria

- [x] `base.ts` defines no `_performInsert` / `_performUpdate`; the INSERT and
      UPDATE bodies live in `persistence.ts#_createRecord` / `#_updateRecord`.
      The `_insert_record` extraction is in place (PR #6418). The `_update_row`
      one is NOT: PR #6430 carries the inline UPDATE build forward verbatim,
      because delegating to `_updateRow` swaps the write-path
      `valuesForDatabase()` binds for `attributes_with_values` cast values —
      a behaviour change across every column type, not a move — and
      `LockingOptimistic._updateRow` is not installed over
      `_Persistence._updateRow` at all. Deferred to
      `route-update-record-through-update-row` (same RFC), which owns the bind
      path, the missing install and the touch-path lock enforcement.
- [x] The `_create_record` rows are retired as far as this story can: PR #6418
      deleted `attributes_for_create`, `type_for_attribute` and `deserialize`.
      The remaining three (`attributes_with_values`, `with_connection`, `id`)
      each carry their own reviewed reason in `persistence.json` and are
      behaviour changes out of scope, per this story's UPDATED context. The
      `_update_record` / `attributes_for_update` row survives because the
      extractor pairs `_update_record` with the ClassMethods `_updateRecord`
      homonym, not the instance body. No rows added.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green;
      `pnpm parity:api:extra --package activerecord` does not grow.
- [ ] Persistence, callbacks, timestamp, dirty, counter-cache, locking and
      autosave suites stay green, plus `persistence-save-block.trails.test.ts`.
