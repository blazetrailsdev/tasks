---
title: "btwhooks: tell the worker to run `tasks stage <id> self`"
status: ready
updated: 2026-11-28
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-stage-signal
packages: []
deps: [tasks-session-stage-verb, trailmap-stories-stage-migration]
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`tasks-session-stage-verb` adds `tasks stage <id> <drafting|self>`. The
agent only reports Self review if its prompt tells it to. Split out of
`tasks-session-stage-verb`, because btwhooks has no GitHub remote (it deploys
through dokku only), so there is no repository to open that PR against.

## Acceptance criteria

- [ ] The worker prompt in btwhooks (`webhook/spawnloop.go`) gains one line
      telling the agent to run `pnpm tasks stage <id> self` when it starts
      reviewing its own diff.
- [ ] It is deployed only after `trailmap-stories-stage-migration` is done,
      since that story is when the live `pnpm db:migrate` adds the `stage`
      column. Shipped earlier, agents run `tasks stage` against a database
      without the column and the verb fails.

## Verification

- A spawned worker's prompt contains the line, and a story it works on
  reports `self` in `tasks show` before its PR is opened.

## Notes

`packages` is empty because this changes the btwhooks prompt, not a trails
package. Since btwhooks has no PR host, this story is closed by hand with
the deploy noted in `closed-reason` or the done event.
