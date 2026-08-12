---
title: "converge-collection-association-load-target-and-ids-writer"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6396
claim: "2026-08-12T02:26:00Z"
assignee: "converge-collection-association-load-target-and-ids-writer"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-reshaped-association-order-rows-remainder` (RFC 0084),
which converged the two rows whose files were free (`has-many-association.ts`
`delete_records` and `preloader/branch.ts` `preloaders_for_reflection`). The two
remaining rows both live in `packages/activerecord/src/associations/collection-association.ts`,
which PR #6394 (`converge-reshaped-association-order-rows`) still had open at
the time, so they could not ship in the same non-overlapping-files PR.

Rows still in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/collection-association.json`:

- `load_target` (`order:mergeTargetLists,findTarget`) — Rails
  (`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:272-279`)
  is `@target = merge_target_lists(find_target, target)` nested inside
  `if find_target?`. The port awaits `doFindTarget()` (a trails-invented sync
  cache probe) into a local, branches on it, and applies `setStrictLoading` per
  record. Converging means removing the `doFindTarget` short-circuit and folding
  the strict-loading application back into `findTarget`, where Rails does it.
- `ids_writer` (`order:all,where`) — Rails (`collection_association.rb:62-85`)
  reaches `klass.where(...)` first and `klass.all` only in the not-found arm;
  the port's `findBy`/`Map`/`Set` rewrite inverts that. The same row also
  carries five dropped calls (`type_for_attribute`, `compact_blank`, `index_by`,
  `values_at`, `raise_record_not_found_exception!`), so the whole body wants
  re-porting from the Ruby.

## Acceptance criteria

- [ ] Both bodies converged to the Rails source at the cited `file:line` —
      invented helper removed, dropped calls restored — not reordered.
- [ ] Each converged row DELETED by hand from
      `call-mismatches-exclude/activerecord/associations/collection-association.json`
      (only-shrink; no `--write` reseed of the whole tree).
- [ ] No row closed by rewording its reason; no new `order:` row added.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; the AR
      suites pass on all three adapter lanes.
