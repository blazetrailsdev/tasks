---
title: "Wave 4d part 5: the sync/async-blocked association helper rows"
status: in-progress
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6763
claim: "2026-08-20T09:52:30Z"
assignee: "wave-4d-associations-residue-part-5"
blocked-by: null
closed-reason: null
---

## Context

The tail of cluster 4 of the `wave-4d-associations-residue-part-4` split. PR 6739
converged the four tractable helper decompositions (`belongs-to-association`
`update_counters`, `disable-joins-association-scope` `last_scope_chain`,
`preloader/batch` `group_and_load_similar`); the rows below were scoped out
because each is blocked on a sync/async or structural question rather than a
call-site fix. `join-dependency` and the HABTM builder are tracked separately
(see `converge-join-dependency-aliasing-through-alias-tracker`, and for the
HABTM join model the existing `0023-surfaced-deviations` story
`converge-habtm-builder-to-rails-macro-sequence`).

Remaining rows and their Rails sources:

1. `associations/has-one-through-association.json` `replace -> create_through_record`
   — `has_one_through_association.rb:9-13`: `replace(record, save = true)` is
   `create_through_record(record, save); self.target = record`. trails' `replace`
   is synchronous while `createThroughRecord` is async, so it queues a
   `_pendingReplace` marker drained later by `persistReplace` /
   `autosaveHasOne`. Establish whether the sync `replace` signature is forced
   (Rails' `writer` path) or whether the awaitable-writer idiom already used
   elsewhere in the package removes the need for the marker.

2. `associations/preloader/association.json` `preloaded_records -> load_records`
   — `preloader/association.rb:154-158`: `preloaded_records` is
   `load_records unless defined?(@preloaded_records); @preloaded_records`.
   trails' `preloadedRecords` is a sync getter returning `this._preloadedRecords
?? []` and cannot await the load. Same question for `records_by_owner`
   (`:148-152`), which trails already ports as `async recordsByOwner()`.

3. `associations/preloader/association.json` `load_records -> records_for`
   — `preloader/association.rb:28-39`: `records_for(loaders)` is called from
   `LoaderQuery#load_records_in_batch`, which trails DOES port
   (`loadRecordsInBatch` calls `recordsFor`). Verify whether this row is a real
   gap or an extractor homonym collision — `load_records` names three different
   methods in that one file (`Association#load_records`,
   `LoaderRecords#load_records`, and `LoaderQuery#load_records_in_batch`), which
   is the known "call gate names with Relation homonyms" trap. If it is a
   collision, the fix is a reviewed reason, not a body change.

4. `associations/has-many-through-association.json` `build_record -> map`
   — deliberately NOT reasoned in part 3 because the reading did not hold up: no
   `map` is visible in `has_many_through_association.rb:90-114`. Re-derive from
   the Rails source before writing anything.

5. `associations/association.json` `skip_statement_cache? -> any?`
   — same: no `skipStatementCache` exists anywhere under
   `packages/activerecord/src/`, so the method may be unported rather than
   divergent. Check `association.rb` and decide port-vs-reason.

## Acceptance criteria

- [ ] Each row above is converged (the TS body makes the call Rails makes,
      verified against the Rails source line) or carries a reviewed one-line
      per-site reason / a `@missingRailsCall` tag at the call site.
- [ ] Rows 4 and 5 are re-derived from the Rails source, not inherited from the
      earlier readings; if either is an unported method, port it or file the
      port separately rather than reasoning the row.
- [ ] Row 3 is confirmed as real-gap or homonym collision with evidence.
- [ ] Rows deleted by hand via `serializeBaseline`, marks tightened per shard.
      No `--write`, no reseed, no widened allowlist.
- [ ] `pnpm parity:api:calls` / `:args` green; `pnpm parity:api:extra --package
activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
