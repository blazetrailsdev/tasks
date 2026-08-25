---
title: "Pin query shape of build accessor on an unloaded has_one_through"
status: done
updated: 2026-07-17
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4905
claim: "2026-07-17T01:51:12Z"
assignee: "has-one-through-build-accessor-query-shape"
blocked-by: null
closed-reason: null
---

## Context

PR #4905 fixed `member.buildClub(...)` on an unloaded has_one_through to load the
through proxy (`memberships`) via `HasOneThroughAssociation#loadTargetForBuild`
instead of issuing a `clubs` join SELECT Rails never performs
(`has_one_through_association.rb:15-19`, `create_through_record` calls
`through_proxy.load_target`). Surfaced in review of PR #4899.

Gap: no test pins the query shape of the `build#{name}` accessor path for a
through. Existing coverage nearby:

- `packages/activerecord/src/associations/has-one-set-new-record-displaced.trails.test.ts`
  drives the low-level `assoc.build(...)`, which bypasses the `build#{name}`
  accessor (so it never exercises `loadTargetForBuild`), and its
  `assertQueriesCount` guard covers the create-through path only.
- PR #4905's own tests assert the behaviour but, per the reviewer, not the
  accessor path's emitted SQL specifically.

A query-count assertion alone is insufficient: earlier work on this cluster
showed a naive through opt-out can pass the count while emitting the wrong query
(zero versus one, or `clubs` versus `memberships`). Pin the shape.

## Acceptance criteria

- [ ] A test drives `member.buildClub(...)` (the `build#{name}` accessor, not
      `association("club").build`) on a persisted member with an unloaded club
      through-association.
- [ ] Assert the emitted SQL includes the `memberships` through-proxy load and
      excludes any `clubs` join SELECT (query shape, not just count).
- [ ] Reuse `quote-regex.ts` for identifier assertions so it passes MariaDB CI.
- [ ] No new models or tables; canonical `Member` / `Club` / `Membership` only.
