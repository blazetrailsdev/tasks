---
title: "Hoist the mid-load-replacement guard to doAsyncFindTarget call sites"
status: draft
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The mid-load-replacement guard (`AssociationTargetReplacedDuringLoad`, added in PRs #5038 and #5035) is armed per `doAsyncFindTarget` override: each of `HasManyAssociation`
(has-many-association.ts:110), `HasOneAssociation` (has-one-association.ts:449)
and `BelongsToAssociation` (belongs-to-association.ts:307) brackets its
`loadHas*`/`loadBelongsTo` call with `_loaderWritebackSuppressed++/--` in a
`finally`.

That per-override arming is a footgun: a new `doAsyncFindTarget` override
silently loses the guard. This already happened once —
`BelongsToPolymorphicAssociation`'s override was added unarmed and had to be
fixed (then deleted in #5035 for being byte-identical to its parent). The next
override to appear will hit the same trap.

## Acceptance criteria

- Hoist the arming out of the three subclass `doAsyncFindTarget` bodies into
  their **call sites**, so every current and future override is covered
  structurally:
  - `Association#_findTarget` (association.ts:495-496) — the single singular
    call site.
  - `CollectionAssociation#loadTarget` (collection-association.ts:570-576) —
    and confirm the second collection call path around
    collection-association.ts:526-530 is covered too (or routed through one
    choke point).
- The three subclass override bodies drop to a bare `return loadHas*(...)`,
  matching their Rails `find_target` counterparts (singular_association.rb:47,
  association.rb:248), which carry no such bookkeeping.
- All existing mid-flight tests stay green on **PostgreSQL and MariaDB**, not
  just SQLite — `has-one-mid-flight-reassignment.trails.test.ts`,
  `has-many-mid-flight-reassignment.trails.test.ts`, and the
  `has-one-through-associations` "set record after delete association" case.
- The `.setTarget(` tree-sweep test stays green (no new caller).

## Note

This touches #5038's merged has_many arming, so it is scoped as its own story
rather than folded into #5035's convergence (per the review-cycle convergence
rule). Raised by Copilot review #12 on PR #5035, finding 2.
