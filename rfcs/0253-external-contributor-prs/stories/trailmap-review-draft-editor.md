---
title: "trailmap: edit, approve or discard each drafted review comment"
status: ready
updated: 2026-11-21
rfc: "0253-external-contributor-prs"
cluster: external-review
packages: []
deps: [trailmap-external-pr-inbox, ringo-external-review-draft-spawn]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The owner has the final say on every word. Each draft comment needs an
editable text box next to its diff hunk.

## Acceptance criteria

- On `external_review.drafted`, trailmap fetches the draft from ringo's
  `GET /api/external-reviews` and stores it (one row per comment, with the
  original text kept immutable).
- The PR page shows the summary, the event selector and each comment as a
  textarea next to its hunk, with the rationale shown to the owner only.
  Each comment has approve/discard, and the owner can add comments of their
  own.
- Edits are autosaved. A new push to the PR marks the draft `stale` without
  losing edits. **Redraft all** on a stale draft starts a new review against
  the new head; the previous draft and its edits stay viewable.
- An e2e test edits one comment, discards another and reloads; the state is
  kept.
