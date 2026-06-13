---
title: "tasks CLI: add `show <id>` and richer `list` columns (priority, est-loc)"
status: claimed
updated: 2026-06-13
rfc: "0001-task-system"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 30
pr: null
claim: "2026-06-13T01:44:01Z"
assignee: "cli-inspect-and-list-ergonomics"
blocked-by: null
---

## Context

Read-path friction surfaced this session.

- **No `show <id>`.** To inspect a story's full body/metadata you must first
  locate its file path under `rfcs/*/stories/`. A `pnpm tasks show <id>` that
  prints the resolved frontmatter + body (and the file path) would remove the
  `find`/`grep` step.
- **`list` columns are thin.** `list` renders est-loc as `—` even when the
  frontmatter has a value, and **omits priority entirely**, so you can't see the
  ordering you just set without opening files or running `ready`. Add a priority
  column and fix est-loc rendering.
- **Priority semantics are undocumented.** "Lower N = higher priority" appears
  only in the `priority` help line; surface it in `list`/`ready` headers or docs,
  and note that ties have undefined order.

## Acceptance criteria

- [ ] `pnpm tasks show <id>` prints a story's metadata + body + file path
- [ ] `list` shows a priority column and renders est-loc correctly when set
- [ ] Priority direction ("lower = higher") is documented where the ordering is
      shown
