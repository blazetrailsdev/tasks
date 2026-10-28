---
title: "ringo: HTTP `PaneSender` client of `muxd`, run in shadow"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps:
  - muxd-host-pane-agent
  - mux-shared-go-helpers-package
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

ringo keeps `PaneSender` but gains a `muxd` client implementation. In shadow mode, every read goes to both implementations and is compared. Writes still go to `tmux.Sender`.

## Acceptance criteria

- [ ] A `muxclient` package implements `PaneSender`, `deploySender`, `paneInputer`, `paneScreenSource` and `paneArchiver`
- [ ] `MUX_MODE=go|shadow|muxd` per read and per write verb, with Go as the default
- [ ] In shadow mode, mismatches are recorded with the screen, and a `muxd` error never affects the Go result
- [ ] `/link-pane` forwards the pane→PR binding to `muxd`, which writes `panes.pr`
- [ ] Requests carry the `muxd` token from a dokku secret
