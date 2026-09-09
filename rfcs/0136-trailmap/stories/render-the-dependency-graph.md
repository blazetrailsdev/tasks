---
title: "Show what a story blocks and what blocks it, transitively"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`deps` and `deps-rfc` are modelled — `StoryDep` is a real association, and
"a dep is satisfied when it is `done` OR `closed`" is a rule the ready queue
already depends on. Nothing displays any of it. Working out why a story is not
ready means reading `tasks show` output and chasing ids by hand.

RFC 0136 phase D: surface beyond parity, chosen because it exercises
association loading and recursive traversal, which the flat list and show pages
never did.

## Acceptance criteria

- A story's page shows what it blocks and what blocks it, transitively, with
  each node's status.
- The traversal loads associations through the framework rather than issuing a
  query per node — and if that produces an N+1 the framework cannot avoid, that
  is a trails story, filed and cited.
- Cycles are handled without hanging, with a test.
- Framework gaps filed as trails stories.
