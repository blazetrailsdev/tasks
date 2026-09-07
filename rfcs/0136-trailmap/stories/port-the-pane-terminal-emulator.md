---
title: "Port paneterm.go's terminal replay into trailmap"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`webhook/paneterm.go` (511 lines) renders a tmux pane log by _emulating a
terminal_, not by filtering escape codes. Its header states the measured shape:
a real 56-minute agent log is 4.2 MB of stream that renders to 1,280 lines — a
70x reduction — because Claude Code renders its UI inline in the primary buffer
by moving the cursor up and erasing lines. A regex that strips SGR codes emits
every repaint stacked on top of the last, which is unreadable and 70x too long.

So it replays the stream into a line buffer with a cursor and emits the pane's
final scrollback, with adjacent same-style cells coalesced into one `<span>`.
It is deliberately not a full VT: no scroll regions, no alternate screen, no tab
stops, no character sets.

Phase C of RFC 0136. Port it into trailmap as a lib, keeping those
non-goals — each one added is another way to get the common case wrong.

## Acceptance criteria

- A `lib/` module replays a pane log to styled HTML, matching `paneterm.go`'s
  behaviour including the style-coalescing.
- The deliberate non-goals above are preserved and stated in the module's
  header, so nobody "completes" the VT later.
- Unit tests port ringo's `paneterm_test.go` cases.
- The 70x reduction is asserted on a real captured log, not a synthetic one.
- Byte-for-byte agreement with the Go renderer is proven by
  `gate-the-pane-renderer-against-ringo`, which is a separate story — this one
  ships the renderer and its unit tests.
