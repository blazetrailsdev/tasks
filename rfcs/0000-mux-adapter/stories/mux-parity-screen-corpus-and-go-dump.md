---
title: "Parity corpus of real pane screens and a Go dump of every classifier"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

G1 needs an oracle. The Go screen classifiers in `btwebooks/tmux/sender.go` (`parseInputBox`, `stuckRetry`, `hitUsageLimit`, `hasAPIError`, `messagePending`, the `PaneStatus` classifier) plus `slugify`, `shellQuote` and `chunkByRunes` have 3 fixtures between them. See the RFC's **Parity gates**.

## Acceptance criteria

- [ ] `parity/screens/` holds ≥ 300 real screens, sampled from live panes and the session-archive pane logs, with ≥ 20 each of idle, busy, input-pending, usage-limit, API-error and stuck-retry
- [ ] `btwebooks/cmd/parity-dump` writes `expected.json` with every classifier's output per screen, plus the string-helper cases
- [ ] Secrets and tokens are scrubbed from the fixtures, with a check that fails on a known-token pattern
- [ ] The corpus and `expected.json` are reachable from the trailmap repo (vendored or as a submodule; choose one and record why)
