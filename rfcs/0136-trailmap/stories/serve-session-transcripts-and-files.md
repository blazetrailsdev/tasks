---
title: "Serve /sessions/transcript, /sessions/file and /sessions/pane"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack"]
deps: ["port-the-pane-terminal-emulator"]
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

Beside the pane renderer, ringo serves `/sessions/transcript`,
`/sessions/file` and `/sessions/pane` — the stored transcript of a session, an
individual captured file, and a pane's rendered scrollback. These are the
read paths that make the session archive useful; the archive index
(`serve-the-session-archive-index`) is just the way in.

Phase C of RFC 0136, and it depends on `port-the-pane-terminal-emulator` for
the pane route.

## Acceptance criteria

- All three routes serve in trailmap, read-only, matching ringo's output.
- Filename handling on `/sessions/file` is as strict as ringo's — no
  separators, no dotfiles, no traversal — with a test proving each refusal.
- `/sessions/pane` renders through the ported emulator, not a second
  implementation.
- Large transcripts are streamed or bounded rather than buffered whole; say in
  the PR which, and what the measured worst case is.
- ringo keeps serving all three unchanged.
