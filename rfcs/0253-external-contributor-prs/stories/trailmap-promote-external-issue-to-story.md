---
title: "trailmap: promote an external issue to a draft story, owner-edited"
status: blocked
updated: 2026-11-21
rfc: "0253-external-contributor-prs"
cluster: external-review
packages: []
deps:
  - ringo-emits-external-issue-events
  - trailmap-external-pr-inbox
  - ringo-draft-story-from-external-issue
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-21T22:23:36Z"
assignee: "trailmap-promote-external-issue-to-story"
blocked-by: "waiting on ringo-draft-story-from-external-issue: ringo has no endpoint that drafts a story from an external issue (operator ruling: block, file prereq)"
closed-reason: null
---

## Context

Stories feed agents, so a stranger's issue must never become one without
the owner writing or approving every field.

## Acceptance criteria

- External issues appear in the inbox next to external PRs.
- **Promote to story** asks an agent (no GitHub write token, issue quoted as
  untrusted data) for a draft title, Context and Acceptance criteria, and
  shows them in editable text boxes with an RFC picker.
- **Create** writes the story with `status: draft` and a
  `Source: <repo>#<n>` line, through the existing tasks write path. Nothing
  is written before the owner clicks.
- A test asserts that no external-issue event creates a story by itself.
