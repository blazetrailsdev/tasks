---
title: "trailmap: redraft one comment with an instruction"
status: ready
updated: 2026-11-20
rfc: "0253-external-contributor-prs"
cluster: external-review
packages: []
deps: [trailmap-review-draft-editor]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Acceptance criteria

- Each draft comment has a **Redraft** box ("shorter", "ask, don't tell").
  Submitting it resumes the parked review session with the instruction and
  that comment's context.
- Only that comment's text is replaced, and the previous text is kept as
  history. Other comments, including their edits, are untouched.
