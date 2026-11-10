---
title: "trailmap: tool calls and messages in the session log"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-session-detail
packages: [actionpack]
deps: [fleet-session-detail]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fleet-session-detail` builds the log from envelope events only. The
concept's log (trailmap#136) also shows tool calls, agent messages and user
messages, which only the session's transcript holds. trailmap already serves
the archive: `sessions/:owner/:repo/:pr` lists a PR's archives and
`sessions/transcript?p=` renders one (`config/routes.ts:84-92`,
`SessionsController`, shipped by `serve-session-transcripts-and-files` in
trailmap#82). The RFC's open question 2 asks whether the archive holds a live
session's transcript or only a finished one.

## Acceptance criteria

- [ ] Open question 2 is answered. If the archive is end-of-session only, the
      live-write change is filed against ringo and this story ships the
      archived transcript for merged sessions.
- [ ] The expanded log merges transcript entries (tool calls, agent and user
      messages) with the envelope events, in time order.
- [ ] The log loads lazily on expand and pages back on scroll.
- [ ] Nothing from the transcript is sent beyond the viewer's browser.

## Verification

- `pnpm vitest run test/controllers/sessions-controller.test.ts` and `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job)
  for a card with an archived transcript.
