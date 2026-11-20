---
title: "trailmap: promote an external issue to a draft story, owner-edited"
status: draft
updated: 2026-11-19
rfc: "0253-external-contributor-prs"
cluster: external-review
packages: []
deps: [ringo-emits-external-issue-events, trailmap-external-pr-inbox]
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
