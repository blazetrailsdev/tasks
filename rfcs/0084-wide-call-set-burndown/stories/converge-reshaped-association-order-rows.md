---
title: "converge-reshaped-association-order-rows"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6394
claim: "2026-08-12T01:45:59Z"
assignee: "converge-reshaped-association-order-rows"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `burndown-order-only-rows-associations-remainder` (RFC 0084), which
converged the one `order:` row in
`call-mismatches-exclude/activerecord/associations/` that was a pure ordering
divergence — `association-scope.ts::nextChainScope`
(`order:polymorphicName,transformValue`), closed by inlining
`transformValue(nextKlass.polymorphicName())` the way
`vendor/rails/activerecord/lib/active_record/associations/association_scope.rb:94`
writes `value = transform_value(next_reflection.klass.polymorphic_name)`.

Seven rows remain, and each is a symptom of a reshaped body rather than a
reordering — none can be closed by moving a line:

- `association.ts::matchesForeignKey` (`order:foreignKey,isForeignKeyFor`) —
  Rails (`association.rb:411-418`) reads `reflection.foreign_key` inline inside
  each arm; the port routes both arms through invented helpers
  (`foreignKeyValues` → `resolveForeignKey`, `idValues`, `keyValuesEqual`), so
  the FK read happens before the first `foreign_key_for?`. Converging means
  deleting the helpers, not reordering them.
- `collection-association.ts::build` (`order:buildRecord,addToTarget`) — Rails
  (`collection_association.rb:117-123`) is
  `add_to_target(build_record(attributes, &block), replace: true)` with an
  `attributes.is_a?(Array)` arm; the port drops the Array arm and the block,
  hoists `buildRecord` into a local and adds a `setOwnerAttributes` call and a
  truthiness guard Rails does not have.
- `collection-association.ts::loadTarget` (`order:mergeTargetLists,findTarget`)
  — same shape: Rails (`:272-279`) nests `merge_target_lists(find_target,
target)`; the port awaits `doFindTarget()` into a local and adds
  strict-loading branches.
- `collection-association.ts::idsWriter` (`order:all,where`) — Rails
  (`:62-85`) reaches `klass.where(...)` first and `klass.all` only in the
  not-found arm; the port's `findBy`/`Map`/`Set` rewrite inverts that.
- `has-many-association.ts::deleteRecords` (`order:scope,klass`) — needs the
  rich-reflection resolve (`owner.constructor._reflectOnAssociation(...)`) that
  `this.reflection` forces, plus the missing `:destroy_async` arm.
- `join-dependency.ts::aliases` (`order:map,constructor`) and
  `preloader/branch.ts::preloadersForReflection` (`order:constructor,klass`) —
  both memoize (`_aliasesCache`) or defend where Rails does neither, so the
  whole skeleton is reshaped; Rails builds `Aliases.new(join_root...map { ... })`
  as one expression (`join_dependency.rb`).

The extractor asymmetry the parent story warned about is NOT one of these: both
extractors now record a call's own name before its arguments and a receiver
before the call it receives (`extract-ruby-api.rb#walk_for_calls`,
`extract-ts-api.ts#collectCalls`), which is why the `nextChainScope` row closed
by inlining rather than by an extractor fix.

## Acceptance criteria

- [ ] For each of the seven rows, read the Rails body at its `file:line` and
      converge the TS body to it — removing the invented helper, restoring the
      dropped branch, or dropping the memoization — rather than reordering.
- [ ] Each converged row is DELETED from its shard by hand via
      `serializeBaseline` (only-shrink; no `--write`/reseed).
- [ ] No row is closed by rewording its reason; no new `order:` row added.
- [ ] `pnpm parity:api:calls` green and the AR suites pass on all three adapter
      lanes.
- [ ] Split across PRs if the bodies do not fit one — each PR from `main`, with
      non-overlapping files.
