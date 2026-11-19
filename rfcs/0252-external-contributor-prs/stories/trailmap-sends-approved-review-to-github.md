---
title: "trailmap: send the approved review to GitHub, exactly as edited"
status: draft
updated: 2026-11-19
rfc: "0252-external-contributor-prs"
cluster: external-review
packages: []
deps: [trailmap-review-draft-editor]
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

- **Send** (behind a confirm that shows the final text) posts one GitHub
  review with the owner's token: the summary, the chosen event and only the
  approved comments, with their text byte for byte as edited.
- Sending is idempotent on the draft id. The GitHub review id and the sent
  text are stored next to the original draft.
- Nothing else in trailmap or ringo can post to an external PR. A test
  covers this.
- One manual run from a second account is recorded in the PR (see the RFC's
  Verification section).
