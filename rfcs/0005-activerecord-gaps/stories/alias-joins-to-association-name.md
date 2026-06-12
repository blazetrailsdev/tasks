---
title: "Alias JOINs to the association name (Rails parity) to enable self-join where-hash disambiguation"
status: claimed
updated: 2026-06-12
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 10
pr: null
claim: "2026-06-12T15:37:14Z"
assignee: "alias-joins-to-association-name"
blocked-by: null
---

## Context

Rails names every association JOIN's table alias after the **association name**
(pluralized / de-conflicted via `AliasTracker`), not the target table name. Two
consequences we don't yet mirror:

1. **Same-table sibling joins collide.** Joining two associations that target
   the same table fails outright in trails. Concrete repro: the 5 skipped
   `missing with enum*` tests in
   `packages/activerecord/src/relation/where-chain.test.ts` (~L455–480) —
   `reading_listing` (inner join) + `unread_listing` (left join) are two
   `has_one`s both targeting `Book`, differentiated only by an enum scope.
   Rails aliases the second join; our `_addAssocJoin` throws on the
   same-table collision (see the BLOCKED comment at where-chain.test.ts:468).
2. **Where-hash disambiguation by association name.** Rails lets you write
   `where(reading_listing: { … })` against the join because the alias IS the
   association name; with table-named aliases that key can't resolve.

Where the work lives:

- `packages/activerecord/src/associations/join-dependency.ts` — `addAssociation`
  (~L150) chooses the join alias; `setReferences` (~L139) already aliases a join
  to a reference name, so the aliasing plumbing partially exists.
- `packages/activerecord/src/associations/alias-tracker.ts` — already tracks
  alias counts and names self-joined HABTM-through tables (see comment ~L116);
  extend/route association joins through it the way Rails'
  `AliasTracker#aliased_table_for` does.
- Rails source: `activerecord/lib/active_record/associations/join_dependency.rb`
  (`table_aliases_for` / `construct_tables!`) and
  `associations/alias_tracker.rb` (`aliased_table_for` — first occurrence gets
  the plain name, subsequent get `<name>_<model>s_<n>`-style suffixes).
- The predicate builder / where-hash side then needs to resolve a hash key that
  matches a joined association name to that join's alias table
  (`relation/query-methods.ts` where-hash resolution).

Related: `JoinDependency` arity divergence noted in
`scripts/api-compare/output/arity-mismatches.json` (`construct`,
`AssociationScope.get_chain`) — don't widen scope to fix those here, but follow
Rails' alias-derivation order so this doesn't bake in another deviation.

## Acceptance criteria

- [ ] Association joins are aliased per Rails `AliasTracker` semantics: first
      join of a table keeps the table name; same-table sibling association
      joins get Rails-identical aliases (verify the exact generated alias
      strings against Rails-produced SQL, not just "doesn't collide").
- [ ] Un-skip the 5 `missing with enum*` tests in
      `relation/where-chain.test.ts`; they pass on SQLite locally.
- [ ] `where({ <association_name>: {...} })` resolves against the join alias
      when that association is joined (covered by an existing Rails test —
      port/un-skip it rather than writing a bespoke one).
- [ ] No test renames; `pnpm test:compare --cached --package activerecord`
      shows the skip-count drop. ≤500 LOC; run only touched test files.
