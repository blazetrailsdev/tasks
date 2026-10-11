---
title: "/up/ready stays green when tasks.db is replaced under the open connection"
status: draft
updated: 2026-10-11
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ProbesController#checkDatabase` (trailmap `app/controllers/probes-controller.ts`, trailmap#54) checks that the path `TASKS_DATABASE` names exists and that `Story.count()` succeeds. The path check was added because, measured live, a `tasks.db` moved aside after boot keeps answering queries: the pool holds the file open and reads the unlinked inode.

Existence is the weakest form of that check. If the file is moved aside and a different one put at the same path (a restore, a re-import, `cutover-import.sh`), the path exists, the count succeeds against the OLD inode, and `/up/ready` is green while trailmap serves a database the CLI and ringo no longer write.

`FsStatResult` in ruby-compat carries optional `dev` and `ino`, so the path's identity can be read. What is missing is the identity of the file the connection has open.

## Acceptance criteria

- [ ] `/up/ready` goes red when the file at `TASKS_DATABASE` is not the file the connection opened, naming both
- [ ] The mechanism is stated in the source: for example recording the path's `dev`/`ino` when `connectToTasksDatabase` establishes the connection (`config/initializers/tasks-database.ts`) and comparing on each probe
- [ ] A test replaces the file after connecting and asserts the check goes red
- [ ] If the adapter cannot report `ino` on some backend, the check degrades to today's existence check and says so in its body
