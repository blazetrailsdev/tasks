---
title: "Run ringo's pane terminal replay in trailmap, loaded rather than ported"
status: done
updated: 2026-10-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: 5
pr: trailmap#27
claim: "2026-10-02T14:42:50Z"
assignee: "port-the-pane-terminal-emulator"
blocked-by: null
closed-reason: null
---

## Context

ringo renders a tmux pane log by _emulating a terminal_, not by filtering
escape codes. Its header states the measured shape: a real 56-minute agent log
is 4.2 MB of stream that renders to 1,280 lines, because Claude Code renders
its UI inline in the primary buffer by moving the cursor up and erasing lines.
A regex that strips SGR codes emits every repaint stacked on top of the last,
which is unreadable and tens of times too long.

So it replays the stream into a line buffer with a cursor and emits the pane's
final scrollback, with adjacent same-style cells coalesced into one `<span>`.
It is deliberately not a full VT: no scroll regions, no alternate screen, no tab
stops, no character sets.

**This story was "port it". It is now "run it".** ringo moved that renderer out
of `package webhook` into `core/paneterm.go` — standard-library only, exported
as `core.RenderPaneLog` — and trailmap vendors `core` compiled for WASI as
`vendor/ringo/core.wasm` (trailmap#26). A terminal emulator has no framework
surface in it, so writing it a second time in TypeScript would teach trails
nothing, and would then need a parity gate kept green for as long as both
exist. One implementation cannot drift from itself. The framework yield in
phase D is the response that streams a pane, and that stays TypeScript.

The story id keeps its old name because other stories depend on it.

Phase D of RFC 0136.

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

- A `lib/` module loads `vendor/ringo/core.wasm` and replays a pane log to
  styled HTML by calling ringo's `core.RenderPaneLog`. There is no TypeScript
  reimplementation of the replay.
- ringo's deliberate non-goals above are stated where a reader of the module
  will find them, as ringo's limits, so nobody "completes" the VT from
  trailmap's side.
- The log goes in as **bytes**, never a decoded string. tmux appends with no
  locking, so a read can end mid-escape-sequence or mid-UTF-8-sequence, and
  decoding first would rewrite that torn tail before the renderer saw it. A
  test feeds each kind of truncated log.
- The tests are about the boundary, not the renderer, which ringo tests itself:
  arguments arriving, stdin delivered whole, stdout surviving the module
  growing its memory on a multi-megabyte log, and a non-zero exit surfacing
  ringo's own stderr rather than being swallowed.
- Output is identical to the same `core` package built natively, over real
  captured pane logs. Say in the PR how many and how large.
- **The cost of a call is measured and written down in the module.** The
  module runs synchronously, so a replay holds the event loop for its whole
  duration. Nothing serves through it in this story; what a request handler
  must do about that belongs to `serve-session-transcripts-and-files`.
