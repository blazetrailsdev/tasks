---
title: "trailmap: edit, approve or discard each drafted review comment"
status: draft
updated: 2026-11-19
rfc: "0252-external-contributor-prs"
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

- `POST /api/external-reviews` stores a draft (one row per comment, with the
  original text kept immutable).
- The PR page shows the summary, the event selector and each comment as a
  textarea next to its hunk, with the rationale shown to the owner only.
  Each comment has approve/discard, and the owner can add comments of their
  own.
- Edits are autosaved. A new push to the PR marks the draft `stale` without
  losing edits.
- An e2e test edits one comment, discards another and reloads; the state is
  kept.
