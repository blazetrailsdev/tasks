---
title: "Strip blazetrailsdev/tasks to content: no src, bin, db or vendor"
status: draft
updated: 2026-09-03
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["move-export-and-its-schedule-into-trailmap", "split-validation-between-tasks-and-trailmap"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's end state for `blazetrailsdev/tasks` is content only — "no `src/`,
`bin/`, `db/` or `vendor/`. A repo humans and agents edit as prose." Individual
stories move pieces out, but nothing performs the final removal, so the repo
would keep a full second copy of the domain indefinitely.

By the time this runs, every consumer should already be pointed elsewhere:

| Removed                                                             | Replaced by                  |
| ------------------------------------------------------------------- | ---------------------------- |
| `src/models/`, `src/ranking.ts`, `src/verbs.ts`, `src/readmodel.ts` | trailmap's models            |
| `src/db.ts`, `src/db-path.ts`                                       | trailmap owns the connection |
| `src/cli.ts`, `bin/tasks`                                           | trailmap's CLI               |
| `src/ingest.ts`, `src/authoring.ts`, `src/export.ts`                | trailmap services            |
| `db/migrate/`, `vendor/`, `package.json`, lockfile, `node_modules`  | not needed by a content repo |

What stays: `rfcs/**/*.md`, the syntactic-validation `scripts/`,
`finalize-rfc.mjs`, `lib.mjs`, `sync-rfcs.sh`, and repo metadata.

Decide `search.json` here rather than leaving it. It is emitted by
`scripts/build-index.mjs` alongside `index.json`, and that script moves to
trailmap — so either the app serves search, or the file keeps being published,
but it should not be orphaned by accident.

This is the story that makes the RFC's central claim checkable: one
implementation of the domain, not three.

## Acceptance criteria

- `blazetrailsdev/tasks` contains only content, the syntactic `scripts/`, and
  repo metadata.
- A fresh clone with no `node_modules` still serves every `tasks` verb, because
  the CLI no longer lives there.
- Content CI passes on that clone.
- `search.json`'s fate is decided and implemented, not left dangling.
