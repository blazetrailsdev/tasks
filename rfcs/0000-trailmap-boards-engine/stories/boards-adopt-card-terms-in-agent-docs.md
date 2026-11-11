---
title: "Move agent docs and skills to card and board terms"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: cli
packages: []
deps: [boards-card-verbs-in-the-cli]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 2. trails `CLAUDE.md` ("Task state vs. task prose", "Working in this
repo"), the `/link`, `post-merge-findings` and `prompt-agent` skills, and
ringo/btwhooks prompt templates name stories, RFCs and the old verbs. Rewrite
them to the new verbs while the old ones still work, one PR per repo. The
`Closes-story:` trailer is accepted in both spellings until phase 4.

## Acceptance criteria

- [ ] Each doc or skill names the `tasks card` verbs
- [ ] A trailer parser accepts both `Closes-story:` and `Closes-card:`
- [ ] No doc tells an agent to hand-edit a field
