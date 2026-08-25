---
title: "tasks edit — $EDITOR body edits for stories AND RFC READMEs"
status: done
updated: 2026-06-13
rfc: "0024-tasks-cli-coverage"
cluster: story-fields
deps: []
deps-rfc: []
est-loc: 100
priority: 31
pr: 3200
claim: "2026-06-13T19:24:33Z"
assignee: "cli-edit-story-body"
blocked-by: null
---

## Context

`refine` commits arbitrary edited **story** content (body + arrays) from a
worktree, but there is **no path at all for editing an RFC README body** — the
Summary / Motivation / Design / Rollout prose. That is the gap that keeps the
RFC's "no hand-editing the tasks repo" goal from being literally true: today you
still open `rfcs/<slug>/README.md` in an editor to write or revise an RFC.

This story closes both the RFC-body gap and the human story-body case with one
editor-driven command that works on **stories and RFC READMEs alike**.

## Acceptance criteria

- [ ] `tasks edit <id-or-rfc-slug>` resolves either a story id or an RFC slug,
      copies the target `.md` to a temp file, opens `$EDITOR` (sensible fallback),
      and on save commits the new content via a `commitAndPush` mutator (the same
      full-content write path `refine` uses).
- [ ] Editing an RFC README is supported, not just stories — this is the
      load-bearing case for the RFC's stated scope.
- [ ] If the editor exits with no change, no commit is made (mirrors `refine`'s
      no-change short-circuit).
- [ ] Frontmatter edits made in the editor are preserved as-is; `updated` is
      bumped.
- [ ] Works on the canonical checkout without leaving uncommitted state (temp
      file + atomic mutator, never a dirty working tree).

## Notes

Pairs with [[cli-new-rfc]]'s `--body-file` for non-interactive RFC body
provisioning; together they make RFC-body authoring require no hand-edits.
Editing an already-merged RFC README is still PR-gated by repo rules — this
command produces the commit, the PR gate is unchanged.
