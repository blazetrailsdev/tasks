---
title: "trailmap: show the stage a session reports, over the derived one"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-stage-signal
packages: []
deps: [fleet-session-stage]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`sessionStage` derives a stage from the envelope, and Drafting versus Self
review is a guess. The RFC's open question 1 decides who reports the stage:
ringo, or the agent through a tasks verb or a pane status line.

## Acceptance criteria

- [ ] Open question 1 is answered in the RFC, and the reporting side is
      filed in its own repo if it is not trailmap.
- [ ] trailmap reads the reported stage into the session object, and
      `sessionStage` returns it when present.
- [ ] A card whose stage is derived, not reported, shows that, for example
      with a hollow current node.
- [ ] Verification: on a day's envelope sample, every session's reported
      stage is shown.
