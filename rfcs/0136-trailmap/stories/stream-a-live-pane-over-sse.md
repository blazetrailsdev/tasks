---
title: "Stream a live pane over SSE — trails has no server-sent-events story"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack"]
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

ringo serves `/logs` and `/logs/stream`, and two SSE streams elsewhere, to show
a live agent pane as it runs. trails has no server-sent-events story at all.
The Node HTTP handler RFC 0104 delivered (#7244) streams rather than buffering,
which is the precondition — but nothing has ever held a response open and
pushed to it from trails.

This is the story RFC 0136's proving-ground clause exists for, and it is the
one most likely to generate framework work rather than app work. Expect the
output of this story to be several trails stories plus a thin app.

## Acceptance criteria

- A trailmap route holds a response open and streams pane output to a browser
  as it is produced.
- The framework gaps hit are filed as trails stories against the RFC that owns
  the surface, each with the reproduction that found it — this is a deliverable
  of the story, not a side effect.
- Where trailmap must carry a workaround to keep running, it is commented with
  the story that will remove it. A bespoke replacement for framework surface is
  the failure mode this RFC names explicitly.
- Read-only and additive: ringo's `/logs/stream` keeps serving throughout.
- If the framework cannot support this yet, `tasks block` this story with the
  specific blocker rather than hand-rolling a dispatcher inside trailmap.
