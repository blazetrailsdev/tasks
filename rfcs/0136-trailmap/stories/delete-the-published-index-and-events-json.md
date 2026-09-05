---
title: "Delete index.json, events.json and publishReadModels"
status: ready
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: ["retire-the-go-read-model"]
deps-rfc: []
est-loc: 120
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`index.json` and `events.json` exist for one reason, stated in
`tasks/src/db.ts`: btwhooks' Go side reads them off disk "rather than talking
to this CLI, so they are the published interface and must be refreshed
synchronously". Once ringo talks to the API, that reason is gone.

Delete the files, `publishReadModels()`, and the republish-on-every-mutation
step. With them go two documented classes of bug: mutations republishing into a
worktree copy and leaving the canonical file stale, and readers observing a
half-written file.

Check for other consumers before deleting. These are published files in a git
repo, so assume nothing — `search.json` sits beside them, and the RFC lists
this as an open question.

Resolve the velocity question first. ringo's README says `/graphs/velocity`
treats the tasks git log as a timestamped event stream because "every tasks-CLI
mutation is one commit". That looks stale — only `tasks new` still commits
(`authoring.ts:170`), and `verbs.ts:5-6` describes commit-per-mutation in the
past tense. Either way velocity must be reading the `events` table through the
API before anything here is deleted.

## Acceptance criteria

- `index.json`, `events.json` and `publishReadModels()` are deleted, and
  mutations no longer republish.
- A search for other consumers is done and recorded.
- `/graphs/velocity` reads the `events` table via the API and renders the same
  weekly figures.
- `blazetrailsdev/tasks` holds only `rfcs/**/*.md`, a syntactic-validation
  `scripts/`, and repo metadata.
