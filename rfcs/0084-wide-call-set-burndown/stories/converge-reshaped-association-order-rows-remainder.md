---
title: "converge-reshaped-association-order-rows-remainder"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6395
claim: "2026-08-12T02:05:59Z"
assignee: "converge-reshaped-association-order-rows-remainder"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `converge-reshaped-association-order-rows` (RFC 0084), which
converged three of the seven `order:` rows under
`call-mismatches-exclude/activerecord/associations/`:

- `association.ts::matchesForeignKey` — the FK is now read inline in each arm
  (`association.rb:411-418`); `foreignKeyValues`/`idValues`/`keyValuesEqual` and
  the dead duplicate `isMatchesForeignKey` are gone.
- `collection-association.ts::build` — the `Array` arm is back and the body is
  `addToTarget(buildRecord(attributes, block), { replace: true })`
  (`collection_association.rb:117-123`).
- `join-dependency.ts::aliases` — one `new Aliases(joinRoot+nodes.map { ... })`
  expression with the column-names branch inside the block
  (`join_dependency.rb:168-182`).

Four rows remain, each a reshaped body rather than a reordering:

- `collection-association.ts::loadTarget` (`order:mergeTargetLists,findTarget`)
  — Rails (`collection_association.rb:272-279`) is
  `@target = merge_target_lists(find_target, target)` nested inside
  `if find_target?`. The port awaits `doFindTarget()` (a trails-invented sync
  cache probe) into a local, branches on it, and applies `setStrictLoading` per
  record. Converging means removing the `doFindTarget` short-circuit and folding
  the strict-loading application back into `findTarget`, which is where Rails
  does it.
- `collection-association.ts::idsWriter` (`order:all,where`) — Rails
  (`:62-85`) reaches `klass.where(...)` first and `klass.all` only in the
  not-found arm; the port's `findBy`/`Map`/`Set` rewrite inverts that. The same
  row also carries five dropped calls (`type_for_attribute`, `compact_blank`,
  `index_by`, `values_at`, `raise_record_not_found_exception!`), so the whole
  body wants re-porting from the Ruby.
- `has-many-association.ts::deleteRecords` (`order:scope,klass`) — needs the
  rich-reflection resolve (`owner.constructor._reflectOnAssociation(...)`) that
  `this.reflection` forces, plus the missing `:destroy_async` arm
  (`has_many_association.rb:74-100`).
- `preloader/branch.ts::preloadersForReflection` (`order:constructor,klass`) —
  Rails (`branch.rb:91-105`) is `reflection_records.group_by { ... }.map { |(rhs_klass,
reflection_scope), rs| preloader_for(reflection).new(...) }`; the port hoists
  `_preloaderFor` above a hand-rolled `Map` grouping keyed on a stringified
  scope, so the constructor is reached before the `klass` read the extractor
  pairs it with.

## Acceptance criteria

- [ ] For each of the four rows, read the Rails body at its `file:line` and
      converge the TS body to it — removing the invented helper, restoring the
      dropped branch — rather than reordering.
- [ ] Each converged row is DELETED from its shard by hand via
      `serializeBaseline` (only-shrink; no `--write`/reseed).
- [ ] No row is closed by rewording its reason; no new `order:` row added.
- [ ] `pnpm parity:api:calls` green and the AR suites pass on all three adapter
      lanes.
- [ ] Split across PRs if the bodies do not fit one — each PR from `main`, with
      non-overlapping files.
