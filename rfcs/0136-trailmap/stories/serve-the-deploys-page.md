---
title: "Serve /deploys and /deploys/log read-only from trailmap"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo serves `/deploys` and `/deploys/log` from `webhook/deploys.go` and
`webhook/deploys_page.go`. The page is how a deploy is watched when trailmap
itself is redeploying, which makes it one of the pages trailmap should serve
last in practice but can serve read-only now, beside ringo, with no risk.

Phase B of RFC 0136's revised rollout: parity first, deletions much later.

## Acceptance criteria

- `/deploys` renders in trailmap with the same rows and ordering as ringo's.
- `/deploys/log` serves a single deploy's log, read-only.
- Nothing in ringo is deleted or disabled; both pages serve simultaneously.
- Controller tests cover both routes.
- Note explicitly in the PR whether the deploy log source is a file or the
  database — if it is a file, say what that implies for the phase F move.
