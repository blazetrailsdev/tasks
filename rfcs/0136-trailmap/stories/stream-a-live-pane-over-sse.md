---
title: "Stream a live pane over SSE — trails has no server-sent-events story"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack"]
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

ringo serves `/logs` and `/logs/stream`, and two SSE streams elsewhere, to show
a live agent pane as it runs. trails has no server-sent-events story at all.
The Node HTTP handler RFC 0104 delivered (#7244) streams rather than buffering,
which is the precondition — but nothing has ever held a response open and
pushed to it from trails.

This is the story RFC 0136's proving-ground clause exists for, and it is the
one most likely to generate framework work rather than app work. Expect the
output of this story to be several trails stories plus a thin app.

### trailmap reads, ringo arms

The pane stream reaches disk because ringo has tmux itself write it:
`armPaneLog` (`tmux/sender.go:1320`) runs `pipe-pane -o` with
`mkdir -p <dir> && cat >> <path>`. So reading pane scrollback is reading a
file, and there is no tmux socket contention with ringo at all.

**tmux allows one pipe per pane.** The `-o` flag ("only if the pane has none")
is there so a re-arm is idempotent rather than a second concurrent writer —
`sender.go:1317` says so outright. trailmap therefore **never calls
`pipe-pane`**, under any flag: it reads the files ringo already causes tmux to
write. Arming from a second process is how the archive gets corrupted.

Live `capture-pane` reads (`sender.go:358,380,828,1140,1165`) are safe to run
concurrently — tmux is client/server, each invocation is a short-lived client,
and `capture-pane` is read-only — but they need the socket, which trailmap's
dokku app does not have mounted today.

## Acceptance criteria

- A trailmap route holds a response open and streams pane output to a browser
  as it is produced.
- The framework gaps hit are filed as trails stories against the RFC that owns
  the surface, each with the reproduction that found it — this is a deliverable
  of the story, not a side effect.
- Where trailmap must carry a workaround to keep running, it is commented with
  the story that will remove it. A bespoke replacement for framework surface is
  the failure mode this RFC names explicitly.
- The stream tails the pane log FILE. trailmap arms no pipes, and a tail that
  reads a partially-written trailing sequence must not corrupt the rendered
  stream — this is the torn tail, and it is sharper here than in the static
  renderer because every poll lands mid-write by construction.
- If a live `capture-pane` is needed instead, note that the dokku app has no
  tmux socket mounted — that is a deploy change, not a code one, and it is
  part of this story.
- Read-only and additive: ringo's `/logs/stream` keeps serving throughout.
- If the framework cannot support this yet, `tasks block` this story with the
  specific blocker rather than hand-rolling a dispatcher inside trailmap.
