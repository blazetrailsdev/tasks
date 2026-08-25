---
title: "Park the writeback, not the query, in _awaitOwnedLoad"
status: closed
updated: 2026-07-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Done in #5035. The join-before-query approach it described was itself wrong for re-entrant through-reconcile loads (they must run a fresh query, not piggyback), so #5035 removed the join entirely: every load queries, only the writeback is ownership-gated, and a load that lost ownership awaits the current owner's writeback. That closes both the concurrent-duplicate-read regression and the ordering fragility this story was filed for."
---

## Context

`_awaitOwnedLoad` (`packages/activerecord/src/associations.ts`) lets a second
concurrent read of an association JOIN the load already parked on the holder,
rather than displacing it. Shipped in #5035.

The joiner returns `holder.target` as soon as the owner's **query** settles.
But the owner writes that target a tick later, after `_awaitOwnedLoad` returns
to it (`syncToAssociationInstance` in `loadHasOne`, `loadHasMany`, and the
`loadBelongsTo` tail). The owner currently wins because it resumes straight off
`await pending` while the joiner pays an extra hop for `Promise.allSettled` —
a one-tick margin, with nothing structural enforcing it.

Adding a single `await` between the owner's ownership check and its writeback —
for instance `_wireInverseAssociation` becoming async — inverts the order, and
both concurrent readers go back to receiving `null` (singular) or `[]`
(collection). That is the exact regression the join path was added to fix.

Not urgent: the two "concurrent reads of the same association" tests in
`has-one-mid-flight-reassignment.trails.test.ts` assert both readers get the
record, so an inversion fails CI rather than shipping silently. This story is
about removing the fragility, not about a live bug.

## Acceptance criteria

- The parked promise resolves **after** the writeback, so a joiner awaiting it
  observes the written target by construction rather than by tick ordering.
  Likely shape: `_awaitOwnedLoad` takes the writeback as a callback and parks
  the full chain, so ownership and write live in one promise.
- The three call sites (`loadHasOne`, `loadHasMany`, `loadBelongsTo`) move to
  the new shape together — a half-applied change reintroduces the race on
  whichever arm is left behind.
- The concurrent-read tests still pass, and an added `await` in the writeback
  tail no longer changes their outcome.
- Rails parity note kept at the call site: Rails needs none of this because
  `@target` holds _the_ load, so a second read never starts a rival query.
