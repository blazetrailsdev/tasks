---
title: "Gate the pane renderer against ringo's over real captured logs"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: ["port-the-pane-terminal-emulator"]
deps-rfc: []
est-loc: 200
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0136's rule is that a rewrite proves itself against the thing it replaces
before anything is deleted — the same shape as the ready-queue equivalence gate
that made the domain move safe (`equivalence-gate-trailmap-against-the-cli`,
done).

`port-the-pane-terminal-emulator` reproduces `webhook/paneterm.go`'s terminal
replay. Unit tests prove it handles the cases ringo's tests name; they do not
prove it agrees with ringo on the logs the fleet actually produces, which are
4 MB of inline repaints and the only input that matters.

## Acceptance criteria

- A gate replays a corpus of REAL captured pane logs through both renderers and
  diffs the HTML.
- The corpus is committed (or fetched from a fixed location) so the gate is
  reproducible, and includes at least one full-length agent session.
- Any difference fails the gate. A tolerated difference needs a named reason in
  the gate's own source, not a silenced assertion.
- The gate runs in CI, not only by hand.
- **The torn tail is a shared blind spot and the gate cannot see it.** Both
  renderers read the same appended-to file with no locking, so both are wrong
  together on a truncated trailing sequence and the diff stays green. Cover
  it with a unit test that feeds a deliberately truncated log, not with the
  corpus.
- This story is a phase C exit criterion: the pane surface does not count as
  ported until it is green.
