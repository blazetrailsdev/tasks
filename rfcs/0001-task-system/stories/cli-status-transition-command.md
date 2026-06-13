---
title: "tasks CLI: add a draft → ready status-transition command"
status: in-progress
updated: 2026-06-13
rfc: "0001-task-system"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 30
pr: 3174
claim: "2026-06-13T01:55:59Z"
assignee: "cli-status-transition-command"
blocked-by: null
---

## Context

DX friction surfaced while filing stories. The CLI has verbs for `claim`,
`in-progress`, `done`, `block`, and `priority`, but **no verb to move a story
from `draft` to `ready`** (the status the `ready`/`next-bundle` queries require).
The only way today is hand-editing the `status:` frontmatter field, which then
needs a separate index rebuild — easy to forget, and the manual edit is what
invites the dirty-worktree build hazard (see
`cli-dirty-worktree-safe-index-build`).

Add `pnpm tasks ready-set <id>` (or `status <id> <value>`) that flips the
frontmatter status, validates the transition (`draft → ready`, and ideally the
other legal moves), rebuilds + commits the index the same way `priority` does,
and refuses illegal transitions with a clear message.

## Acceptance criteria

- [ ] A CLI command sets a story's status (at minimum `draft → ready`) without
      hand-editing frontmatter
- [ ] Illegal transitions are rejected with a clear message
- [ ] The command rebuilds and commits the index like other mutating verbs
- [ ] Help text lists the new command
