---
title: "has-one-through-build-skips-target-load"
status: ready
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
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

`member.buildClub(...)` on an **unloaded has_one_through** issues a `clubs` SELECT
that Rails never issues, and skips a `memberships` SELECT that Rails does issue.

`HasOneAssociation#needsTargetLoadForBuild` (packages/activerecord/src/
associations/has-one-association.ts) exists so the `build#{name}` accessor
(`builder/has-one.ts:67-73`) can pre-issue Rails' `load_target` at
`has_one_association.rb:62` — the sync `build` can't await. But
`HasOneThroughAssociation` inherits it, and its Rails counterpart has no
`load_target` at all:

```ruby
# vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:10-13
def replace(record, save = true)
  create_through_record(record, save)
  self.target = record
end
```

`create_through_record` (:15-19) instead loads the **through** proxy:

```ruby
through_proxy  = through_association
through_record = through_proxy.load_target
```

So for `build_club` Rails queries `memberships`, never the `clubs` join.

Measured on this branch (PR #4899), persisted Member + persisted Club + unloaded
`club` association, `member.buildClub({ name: "New Club" })`:

- today: exactly one query — `SELECT "clubs".* FROM "clubs" INNER JOIN
"memberships" ON ... LIMIT 1`. Rails issues no such query.
- with a naive `override needsTargetLoadForBuild() { return false; }`: **zero**
  queries. Rails issues one (`memberships`).

So the override alone trades one divergence for another — do not stop there. All
231 tests in has-one-through-associations / has-one-through-disable-joins /
nested-attributes pass **both** with and without it, so the suites will not catch
either error; this needs its own assertion.

Raised in review of #4899, which added the through's `setNewRecord` and
`removeDisplaced` overrides (the same "a through must not use direct-FK has_one
machinery" invariant). Pre-existing and not caused by that diff, so it was left
out to keep #4899 scoped to `set_new_record`. Note the fix also changes
`build#{name}`'s shape for a through — the accessor returns the record
synchronously instead of a Promise once the load path is skipped.

## Acceptance criteria

- [ ] `member.buildClub(...)` on an unloaded through issues no `clubs` SELECT.
- [ ] It does load the through proxy, as `create_through_record` (:15-19) does —
      verify whether trails' in-memory arm (`constructThroughRecordInMemory` in
      has-one-through-association.ts) already loads it; the build path currently
      shows no `memberships` SELECT, while the `create` path does.
- [ ] A test pins the query shape (not just the count) for `build#{name}` on an
      unloaded through — `assertQueriesCount` alone passed both ways.
- [ ] Confirm `build#{name}` returning synchronously for a through breaks no
      caller (`await` on a non-Promise is fine; check for `.then` callers).
- [ ] No regression in has_one_through / disable_joins / nested_attributes.
