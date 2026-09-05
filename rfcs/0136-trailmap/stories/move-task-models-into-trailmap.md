---
title: "Move the ActiveRecord models and migrations into trailmap"
status: in-progress
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: 8
pr: 2
claim: "2026-09-05T10:35:33Z"
assignee: "move-task-models-into-trailmap"
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
tasks/src/models/*.ts   ->  trailmap/app/models/
tasks/src/rfc-close.ts  ->  trailmap/app/models/
tasks/db/migrate/*.ts   ->  trailmap/db/migrate/
```

All of `src/models/` — `story.ts`, `rfc.ts`, `event.ts`, `joins.ts`,
`meta.ts`, and the two files it is tempting to leave behind: `timestamps.ts`
(`pinTimestampColumns`, which every model calls) and `index.ts`, which is the
load-bearing one. See below.

This story is the move only: same class names, same column declarations, same
associations, same `STORY_STATUSES` / `RESOLVED_DEP_STATUSES` constants. The
domain logic that currently sits beside them in `ranking.ts` and `verbs.ts`
moves in follow-up stories, so a failure here is unambiguous.

trailmap connects read-only against the existing `tasks.db` for now; it does
not own the file yet and writes nothing. The CLI keeps working untouched.

### `app/models/` is not autoloaded — the barrel is what makes it work

Do not assume Rails' behaviour here. trails has **no autoloader**, and per
`port-trails-autoloaders` (RFC 0104, blocked) it is not getting one: Zeitwerk's
mechanism is Ruby constant resolution at reference time, and ESM offers no hook
for an unresolved identifier. The only directory scan trails performs is
`loadControllers` in `trailties/src/application/finisher.ts`, and it is
**controllers only** — it globs `app/controllers` for `*-controller.ts` and
registers them for dispatch. Nothing scans `app/models`. Putting a file there
gets it loaded by exactly one thing: an `import` that names it.

This matters because associations name their targets by **string**:

```ts
this.belongsTo("rfc", { foreignKey: "rfc_id" });
this.hasMany("paths", { className: "StoryPath", foreignKey: "story_id" });
this.hasMany("deps", { through: "storyDeps", source: "dependsOn" });
```

The sibling `import type` lines are erased at runtime, so nothing else pulls
those classes in. Rails resolves the strings through constant autoloading; here
they resolve through an explicit registry, and `src/models/index.ts` is what
populates it:

```ts
registerModel([Rfc, Story, StoryDep, StoryRfcDep, StoryPath, StoryPackage, Event, Meta]);
```

Miss it and association traversal throws "uninitialized constant" at runtime —
not at build time, and not on the queries that avoid associations, which is
what makes it worth stating rather than discovering. Carry the barrel across
with its comment intact, and keep its rule: **import the barrel, not the
individual model files, anywhere associations are traversed.**

`index.ts` also calls `registerRfcAutoClose()`, which is why `rfc-close.ts`
moves with the models rather than with the mutation verbs: it is an `afterSave`
on `Story`, the barrel is what arms it, and leaving it behind breaks the
barrel's import. It stays dormant in this story — trailmap writes nothing yet,
so the callback never fires — but it has to resolve. Note its own comment on
why it imports the model modules directly instead of the barrel: the barrel
registers the callback, so going back through it would be an import cycle.

Note `Story.claim_at` is deliberately `TEXT`, not a datetime — the migration
explains why (btwhooks parses it, and 5,131 existing values are ISO-seconds).
Carry that comment across; it is load-bearing.

## Acceptance criteria

- `trailmap/app/models/` holds Rfc, Story, Event, the join models, `Meta`, the
  `pinTimestampColumns` helper, the `registerModel` barrel and the RFC
  auto-close callback, with the Rails-shaped names they already have.
- A test **traverses an association** (`story.rfc`, `story.deps`,
  `story.packages`) through the barrel and gets rows back. This is the check
  that proves registration survived the move; a test that only reads columns
  passes with the barrel missing.
- Importing a model module directly, without the barrel, and traversing an
  association fails loudly rather than silently returning nothing — assert on
  it, so the barrel's rule is enforced rather than documented.
- `trailmap/db/migrate/` holds the migrations; `trails db migrate` against a
  scratch database produces the same schema as the tasks repo's.
- Model tests cover the associations and the status constants.
- trailmap reads the live `tasks.db` and returns the same rows the CLI does
  for a spot-check set of RFCs and stories.
- Nothing in `blazetrailsdev/tasks` changes yet.
