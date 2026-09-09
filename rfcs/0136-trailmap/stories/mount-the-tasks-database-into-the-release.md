---
title: "Give the release its database: mount tasks.db and set TASKS_DATABASE"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The deployed app has no database. `/stories/ready` on the box answers 500, not
the ready queue:

```console
$ curl -s http://127.0.0.1:8080/stories/ready
{"error":"internal_server_error"}   # ConnectionNotDefined
```

It is PAST `requireLoopback` — a 404 would mean it was not, and that was the
defect PR #16 fixed and trailmap#21 proved — so the loopback API is reachable
and simply has nothing to read. `dokku config:show trailmap` sets no
`TASKS_DATABASE`, and `dokku storage:report trailmap` lists no mount, so the
CLI's `tasks.db` is not inside the container at all.

`verify-the-first-live-redeploy-and-loopback-api` carried "returns the ready
queue" as a criterion on the assumption the database was already wired. It was
not, and that is separate work from the redeploy property that story proved.

## Why it is now urgent rather than latent

trailmap#20 landed `config/initializers/tasks-database.ts`, which makes an
unset `TASKS_DATABASE` a **boot failure** rather than a deferred 500 — the
right call, because the old behaviour answered dokku's `/up` healthcheck green
and then raised on the first page that read a row. The consequence is that the
next deploy from `main` will not start at all until this is done.

## What to do

```sh
dokku storage:mount trailmap /home/dean/github/blazetrailsdev/tasks:/tasks
dokku config:set trailmap TASKS_DATABASE=/tasks/.git/tasks.db TASKS_DIR=/tasks
```

Both are checked: the container is `USER node` = uid/gid 1000, matching the
host owner of `tasks.db`, so the bind mount is writable with no permission
work. `TASKS_DIR` is needed as well as `TASKS_DATABASE` — the show pages read
each document's markdown off disk, not out of the database.

## The decision this actually carries

Mounting is not the whole of it. `config/database.ts` already notes that
trailmap is ABLE to write and that the CLI still opens the same file, with
SEQUENCING — nothing posts to the mutation endpoints yet — rather than a
connection flag keeping the two writers apart. Mounting the live file makes
that sequencing load-bearing on the box instead of in principle, and SQLite
takes one writer at a time.

Decide and write down which of these is true before mounting:

- the mount is read-write and the sequencing argument is accepted, with the
  story that ends it named; or
- the mount is read-only until `move-the-tasks-cli-into-trailmap` makes
  trailmap the only writer, and the mutation endpoints stay unreachable in
  production until then.

The second is the conservative reading of what `config/database.ts` already
says, and a read-only mount still answers every read verb, which is all
`/stories/ready` needs.

## Acceptance criteria

- `curl -s http://127.0.0.1:8080/stories/ready` returns the ready queue.
- The read-write question above is decided in prose, in this story or in
  `docs/deploy.md`, not left to the mount command.
- `scripts/deploy.sh` tightens its `/stories/ready` check from "not 404" to
  "== 200", so a future deployment that loses the mount fails the deploy
  instead of warning. The warning it prints today names this story.
- `docs/deploy.md`'s "Known gap: the release has no database" section is
  replaced by the configuration that closed it.
