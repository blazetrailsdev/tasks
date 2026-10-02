---
title: "Superseded: gate the pane renderer against ringo's"
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

**Nothing to build. Close this story once trailmap#27 has merged.**

It existed because RFC 0136's rule is that a rewrite proves itself against the
thing it replaces, and `port-the-pane-terminal-emulator` was going to be a
rewrite: `paneterm.go` reproduced in TypeScript, then diffed against the Go
over real logs.

That story no longer rewrites anything. trailmap loads ringo's own
`core.RenderPaneLog`, compiled for WASI, so the two renderers this gate would
have compared are the same code. A gate between an implementation and itself
reports EQUIVALENT forever, which is worse than having no gate: the green
check keeps being cited.

## What each criterion became

- **Replay a corpus of real logs through both renderers and diff.** There is
  one renderer. What can still differ is the WASI build from a native build of
  the same source, and that was checked once, over real archived logs, in the
  loader's PR.
- **Any difference fails; it runs in CI.** The property worth holding in CI is
  now a different one: that the committed `vendor/ringo/core.wasm` IS the
  vendored source beside it. `scripts/build-ringo-wasm.sh --check` rebuilds it
  and compares bytes on every PR (trailmap#26).
- **The torn tail is a shared blind spot.** Still true, and still covered the
  way this story said to: unit tests that feed a deliberately truncated log,
  in the loader's test file.
- **Phase exit criterion.** The pane surface counts as done when the loader is
  merged and the rebuild check is green, not when a diff is.

## Acceptance criteria

- Closed with `tasks close`, naming trailmap#27. No PR.
