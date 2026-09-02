---
title: "Move the ActiveRecord models and migrations into trailmap"
status: draft
updated: 2026-09-02
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrailsdev/tasks/src/models/` already holds real ActiveRecord models —
`Story extends Base` with `rfc_id`, `status`, and associations to deps,
packages and events — plus `db/migrate/*.ts` written as `Migration`
subclasses. They live in a CLI's `src/` because there was no application to
put them in. trailmap is that application.

Move, without behaviour change:

```text
tasks/src/models/{story,rfc,event,joins,meta}.ts  ->  trailmap/app/models/
tasks/db/migrate/*.ts                             ->  trailmap/db/migrate/
```

This story is the move only: same class names, same column declarations, same
associations, same `STORY_STATUSES` / `RESOLVED_DEP_STATUSES` constants. The
domain logic that currently sits beside them in `ranking.ts` and `verbs.ts`
moves in follow-up stories, so a failure here is unambiguous.

trailmap connects read-only against the existing `tasks.db` for now; it does
not own the file yet and writes nothing. The CLI keeps working untouched.

Note `Story.claim_at` is deliberately `TEXT`, not a datetime — the migration
explains why (btwhooks parses it, and 5,131 existing values are ISO-seconds).
Carry that comment across; it is load-bearing.

## Acceptance criteria

- `trailmap/app/models/` holds Rfc, Story, Event and the join models, with the
  Rails-shaped names they already have.
- `trailmap/db/migrate/` holds the migrations; `trails db migrate` against a
  scratch database produces the same schema as the tasks repo's.
- Model tests cover the associations and the status constants.
- trailmap reads the live `tasks.db` and returns the same rows the CLI does
  for a spot-check set of RFCs and stories.
- Nothing in `blazetrailsdev/tasks` changes yet.
