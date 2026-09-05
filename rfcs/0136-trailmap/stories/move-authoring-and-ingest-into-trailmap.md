---
title: "Move tasks new and ingest into the app"
status: ready
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: ["move-the-tasks-cli-into-trailmap"]
deps-rfc: []
est-loc: 250
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tasks new` is the last thing holding the CLI to the filesystem. Today
`authoring.ts:83-177` writes the story markdown, commits it, pushes to
`origin/main`, and runs ingest — all in the caller's checkout.

It moves into trailmap as a POST: the app writes the file, commits it and
ingests it in one operation, owning both the markdown and the database so they
cannot diverge.

Carry two details across deliberately. `authoring.ts:167` stages only the one
file rather than `git add -A`, so a caller's unrelated working-tree changes are
never swept into the commit. And `ingest.ts:116` fetches `origin/main` before
ingesting because agents push story files straight there — a compensation for
GitHub being a rendezvous point between processes on one machine, which the
follow-on content-hosting RFC removes entirely but which must keep working
until then.

This requires trailmap to hold the tasks checkout writable with a git identity
— the same arrangement the btwhooks container already has, and for the same
reason.

## Acceptance criteria

- `tasks new` is a POST; trailmap writes, commits, pushes and ingests.
- Only the new story file is staged.
- Validation failures are refused before anything is written, with the same
  messages, so a bad story never lands half-created.
- The generated file is byte-identical to today's for the same arguments.
- `tasks ingest` is served the same way, and both work from any directory.
