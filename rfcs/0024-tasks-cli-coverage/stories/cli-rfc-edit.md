---
title: "tasks rfc — RFC frontmatter mutations (status, supersede, relate, clusters, packages)"
status: ready
updated: 2026-06-13
rfc: "0024-tasks-cli-coverage"
cluster: rfc-commands
deps: [frontmatter-block-editor]
deps-rfc: []
est-loc: 120
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC frontmatter is hand-edited today: status transitions
(`draft → active → closed → postponed → superseded`), the `superseded-by`
pointer, `related-rfcs`, `clusters`, and `packages`. This story adds a single
`tasks rfc <slug>` command with flags, overloading one verb the way `priority`
and `block` already do.

## Acceptance criteria

- [ ] `tasks rfc <slug> --status <s>` transitions RFC status, validating against
      the allowed set; `superseded` requires `--supersede <other-slug>` and sets
      both `status: superseded` and `superseded-by`.
- [ ] `tasks rfc <slug> --relate <csv>` / `--clusters <csv>` / `--packages <csv>`
      set those array fields via the [[frontmatter-block-editor]] setter.
- [ ] `--supersede` / `--relate` targets are checked to exist; bad references
      fail before any commit.
- [ ] Changing `clusters` warns if it would orphan a story whose `cluster` is no
      longer declared (the validator catches this; surface it early).
- [ ] Commits + pushes via `commitAndPush`, message `rfc <slug>: <change>`;
      `updated` is bumped.

## Notes

Depends on [[frontmatter-block-editor]] for the array flags. Scalar `--status`
could use the existing `editFrontmatter`, but route everything through one code
path for consistency.
