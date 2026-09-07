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

- All three routes serve in trailmap, read-only, matching ringo's output.
- Filename handling on `/sessions/file` is as strict as ringo's — no
  separators, no dotfiles, no traversal — with a test proving each refusal.
- `/sessions/pane` renders through the ported emulator, not a second
  implementation.
- Large transcripts are streamed or bounded rather than buffered whole; say in
  the PR which, and what the measured worst case is.
- trailmap arms no pipes; `/sessions/pane` reads the log file ringo's
  `pipe-pane` already writes.
- ringo keeps serving all three unchanged.
