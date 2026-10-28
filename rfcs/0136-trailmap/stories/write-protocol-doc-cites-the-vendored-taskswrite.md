---
title: "docs/write-protocol.md cites vendor/ringo/db/taskswrite.go, checkable in-repo"
status: ready
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`docs/write-protocol.md:91` cites ringo's write path as `webhook/taskswrite.go` at btwhooks `0eeb2e1`. btwhooks has no remote, so a reviewer can't check that citation. Since trailmap#76 the same code is vendored at `vendor/ringo/db/taskswrite.go` (pin `c3f9198`). The trailmap#76 review raised this, and it was left out because a bump PR carries nothing else.

## Acceptance criteria

- [ ] docs/write-protocol.md points at `vendor/ringo/db/taskswrite.go` and names the pin it describes
- [ ] the ringo source path stays as provenance, not as the only reference
