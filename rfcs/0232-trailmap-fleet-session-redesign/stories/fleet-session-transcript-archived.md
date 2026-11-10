---
title: "trailmap: archived transcript steps in a merged session's log"
status: draft
updated: 2026-11-10
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-session-detail
packages: [actionpack]
deps: [fleet-session-detail]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trailmap serves the session archive: `SessionArchive.forPr`
(`app/controllers/sessions-controller.ts:75-91`) lists a PR's archives, and
`SessionsController#transcript` parses one with `parseTranscript`
(`lib/ringo-core.ts`, capped at `TRANSCRIPT_MAX_STEPS`), but only as an HTML
page. The RFC's "Expanding a session" specifies a JSON read for the card.
This story covers merged sessions, whose archive is complete.

## Acceptance criteria

- [ ] `GET fleet/transcript?pane=<id>` resolves the pane's PR, takes its
      newest worker archive, and answers parsed steps as JSON, newest first,
      `?before=<step>&limit=200` at a time.
- [ ] A merged session's expanded log merges those steps (tool calls, agent
      and user messages) with its envelope events, in time order, and loads
      earlier steps when scrolled to the top.
- [ ] A PR with several archives links the older ones to
      `sessions/:owner/:repo/:pr`. A spawn with no PR shows the event log
      only.
- [ ] Transcripts are read per request and never written to trailmap's
      database or cache (`noStore`, as `SessionsController` does). The page
      makes no request to any origin but trailmap's.

## Verification

- `pnpm vitest run test/controllers/sessions-controller.test.ts` with a
  fixture archive: paging, the newest-worker choice, and a PR with no
  archive.
