---
title: "fold-perform-insert-update-into-persistence-record-bodies"
status: ready
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
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

- [ ] `base.ts` defines no `_performInsert` / `_performUpdate`; the INSERT and
      UPDATE bodies live in `persistence.ts#_createRecord` / `#_updateRecord`,
      with `_insert_record` and `_update_row` as the only extractions.
- [ ] The six `_create_record` rows above are deleted by hand from
      `persistence.json` (only-shrink; never `--write`), with no new rows.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green;
      `pnpm parity:api:extra --package activerecord` does not grow.
- [ ] Persistence, callbacks, timestamp, dirty, counter-cache, locking and
      autosave suites stay green, plus `persistence-save-block.trails.test.ts`.
