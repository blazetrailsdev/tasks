---
title: "Serve /sessions/transcript, /sessions/file and /sessions/pane"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack"]
deps: ["port-the-pane-terminal-emulator"]
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

Beside the pane renderer, ringo serves `/sessions/transcript`,
`/sessions/file` and `/sessions/pane` — the stored transcript of a session, an
individual captured file, and a pane's rendered scrollback. These are the
read paths that make the session archive useful; the archive index
(`serve-the-session-archive-index`) is just the way in.

Phase D of RFC 0136, and it depends on `port-the-pane-terminal-emulator` for
the pane route. That story no longer ports anything: it loads ringo's own
replay from `vendor/ringo/core.wasm`, so `/sessions/pane` is ringo's renderer
behind a trailmap response.

### The replay blocks the event loop

`renderPaneLog` runs synchronously, at roughly 110 ms per megabyte of log.
Measured over ringo's archive, the median pane log is 2 MB (0.2 s), the 90th
percentile 10.6 MB (1.1 s) and the largest 104 MB (10 s). Called straight from
a controller, every other request waits behind it. ringo's own handler caps
the output at 20,000 lines, which bounds memory and not time: the whole log is
still replayed.

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
- `/sessions/pane` renders through `lib/ringo-core.ts`'s `renderPaneLog`, not a
  second implementation.
- **`/sessions/pane` does not stall other requests.** Either bound the bytes
  replayed, or run the replay off the main thread. Say in the PR which, and
  the measured time the event loop is held on the largest log in the archive.
  Off-thread needs a worker, and trails has no adapter for one: if that is the
  route, the adapter is a story against trails, filed with the reproduction,
  not a `node:worker_threads` import in trailmap.
- Large transcripts are streamed or bounded rather than buffered whole; say in
  the PR which, and what the measured worst case is.
- trailmap arms no pipes; `/sessions/pane` reads the log file ringo's
  `pipe-pane` already writes.
- ringo keeps serving all three unchanged.
