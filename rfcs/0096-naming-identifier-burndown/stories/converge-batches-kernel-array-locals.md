---
title: "converge-batches-kernel-array-locals"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6633
claim: "2026-08-17T09:26:50Z"
assignee: "converge-batches-kernel-array-locals"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/relation/batches.rb` normalizes the
cursor by reassigning the local — `cursor = Array(cursor)` at :93, :165 and
`cursor = Array(cursor).map(&:to_s)` at :260 — and inlines `Array(start)` /
`Array(finish)` at :306, :310 and inside `batch_on_loaded_relation` (:387-388).

trails (`packages/activerecord/src/relation/batches.ts`) hoists each of those
into `cursorArr` / `startArr` / `finishArr` because the parameter is typed
`string | string[] | undefined` and cannot be narrowed by reassignment. The
settled trails spelling of `Kernel#Array` is `kernelArray`
(`packages/activesupport/src/array-utils.ts`), which the bodies do not use.

Surfaced by the RFC 0096 `wave-4-naming-ar-relation` cluster: six naming rows
(`apply_limits`, `build_batch_orders` x2 each, `compare_values_for_order` x2).

## Acceptance criteria

- [ ] The bodies call `kernelArray` where Rails calls `Array()`, at the same
      places Rails calls it (inline in `batch_on_loaded_relation`, once per
      entry point for the cursor).
- [ ] The locals carry the Rails identifiers, or the row is reported with the
      TS typing constraint that forces the binding.
- [ ] The `batches.ts` naming rows fall in
      `pnpm parity:api:calls:args:report`, no new `shape` rows.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
