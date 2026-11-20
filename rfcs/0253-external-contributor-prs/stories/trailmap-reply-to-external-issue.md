---
title: "trailmap: draft, edit and send a reply on an external issue"
status: ready
updated: 2026-11-20
rfc: "0253-external-contributor-prs"
cluster: external-review
packages: []
deps: [ringo-emits-external-issue-events, trailmap-sends-approved-review-to-github]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Acceptance criteria

- **Reply** on an inbox issue drafts a comment (credential-less agent),
  shown in an editable text box. The owner can also write one from scratch.
- **Send** posts exactly the edited text as an issue comment with the
  owner's token, reusing the review send path's idempotency and audit
  storage.
