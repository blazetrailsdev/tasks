---
title: "rfc-page-lifecycle-buttons-and-ready-all-drafts"
status: draft
updated: 2026-10-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`render-the-rfc-and-story-show-pages` (trailmap#11) ported `/rfc/<id>` as a
read; `app/controllers/rfc-pages-controller.ts:80` lists the action buttons as
deliberately not ported. ringo serves them:

- `/spawnloop/rfc-status` → `HandleRFCStatus` (btwebooks `webhook/rfcs.go:1180`),
  which shells out to `tasks rfc-status`; the offered moves per status come from
  `rfcStatusMoves` (`rfcs.go:1158`). "Ready" for an RFC is `active`.
- `/spawnloop/rfc-ready-drafts` → `HandleRFCReadyDrafts` (`rfcs.go:1272`): one
  `tasks status-set <id...> ready --from draft`, all or nothing.

`tasks rfc-status` (`tasks/src/rfc-status.ts`) is a markdown act: it rewrites
the RFC's frontmatter, commits, pushes and ingests, with transitions from its
`ALLOWED` table and a refusal to close an RFC with open stories. trailmap
already serves the story mutation verbs as POSTs (`config/routes.ts:157-165`,
`serve-the-mutation-verbs-as-json`) but has no RFC-status endpoint.

## Acceptance criteria

- trailmap serves an RFC-status POST that makes the same transitions, with the
  same refusals and messages, as `tasks rfc-status` (commit, push, ingest).
- trailmap serves a ready-all-drafts POST with `HandleRFCReadyDrafts`'
  all-or-nothing semantics, reusing the existing `status-set` model method.
- `/rfc/<id>` renders the draft / ready / postpone / close buttons that
  `rfcStatusMoves` offers for the RFC's status, with its confirm text, plus
  "Mark drafts ready" when the RFC has draft stories.
- Closed and superseded RFCs offer no buttons.
- Controller tests cover each transition and the open-stories close refusal.
