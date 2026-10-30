---
title: "/search counts body mentions in JS over matching rows; count them in SQL once Arel nodes are reachable"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: ["activerecord-exposes-arel-to-applications"]
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

trailmap#99's `bodyMentions` (`app/models/concerns/search.ts`) plucks each matching body and counts in JS, in both apps, because Arel nodes are not reachable (`activerecord-exposes-arel-to-applications`). A common phrase transiently loads most of the ~37 MB of bodies; `q=the` took 0.47s on a copy of the live database.

## Acceptance criteria

- Mentions are computed in SQL in `search.ts` and the Rails twin's `search.rb`, so `body` is not plucked.
- Mention counts and result order are unchanged for the existing tests.
