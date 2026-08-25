---
title: "Converge counter-cache absent-column silent-skip to Rails raise (or ratify as tracked policy)"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4003
claim: "2026-06-23T12:52:49Z"
assignee: "counter-cache-absent-column-skip-vs-raise"
blocked-by: null
---

## Context

Surfaced in review of PR #3983 (counter-cache-skip-when-column-absent).

`updateCounterCaches` (`packages/activerecord/src/associations.ts`) now skips
the counter-cache increment/decrement when the resolved counter column is not a
real column on the owner (warm-schema + `hasAttributeDefinition` guard). This
mirrors the _intent_ of Rails' `has_cached_counter?`
(vendor/rails/.../reflection.rb:307-311), but it is NOT what Rails' live
belongs_to update path does:

- Rails' belongs_to counter update is gated only by `require_counter_update?`
  = `reflection.counter_cache_column && owner.persisted?`
  (vendor/rails/.../associations/belongs_to_association.rb:128-130) — there is
  NO column-existence guard on the write path.
- `has_cached_counter?`'s `active_record.has_attribute?(counter_cache_column)`
  check applies only to the inverse-declared (has*many/`size`) read side, and
  it checks the \_declaring* class, not the target.
- So for a counter cache pointing at a genuinely-absent column, Rails _raises_
  (`MissingAttributeError` via `increment!`, or `StatementInvalid` via the
  `update_counters` scope) — it does not silently skip.

trails currently turns that error into a silent no-op (graceful degradation),
documented inline in `updateCounterCaches`. Per the project deviation policy
(always converge or track-pending-convergence; never ratify in-place), this
silent-skip-vs-raise gap is registered here rather than left as a code comment.

Note: the canonical `Comment#post` case is NOT affected — Post aliases
`comments_count` → `legacy_comments_count`, so it resolves to a real column and
updates normally. The skip only fires for a counter column with no matching
(aliased) column on the owner.

## Acceptance criteria

- [ ] Decide convergence direction with the epic owner: either (a) converge to
      Rails by letting the absent-column counter update raise
      (`MissingAttributeError`/`StatementInvalid`), removing the silent skip; or
      (b) confirm graceful-skip is the deliberate trails policy and downgrade the
      inline comment to a `tracked-pending-convergence` reference to this story.
- [ ] If converging to raise: ensure no canonical model regresses (Comment#post
      via alias, Comment#parent → children_count, tags_count all resolve to real
      columns and must still update).
- [ ] Update the inline note in `updateCounterCaches` to point at the resolution.
- [ ] No regression in counter-cache.test.ts / associations.test.ts.
