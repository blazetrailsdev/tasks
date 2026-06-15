---
title: "ready() queue should exclude stories whose own RFC is not active"
status: draft
updated: 2026-06-15
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`ready()` (`scripts/tasks/cli.ts:165-175`) selects the claimable queue by
filtering on `s.status === "ready"`, story `deps` (all `done`), and `deps_rfc`
(all `closed`). It does **not** check the story's _own_ RFC status. So a story
explicitly set to `ready` under a `draft`/`postponed`/`superseded` RFC surfaces
in `pnpm tasks ready` and is claimable — contradicting the README invariant
that draft-RFC stories "should not be claimed" (`tasks/README.md` Lifecycle
table).

PR #3410 (default new stories to `ready`) closed this at the _creation default_
only: `newStory.effectiveStatus` gates the auto-`ready` default on
`readRfcStatus(...) === "active"` and otherwise falls back to `draft`. But an
explicit `--status ready`, or a hand-edited frontmatter, still bypasses the
invariant because the `ready()` queue itself does not enforce it. The
`readRfcStatus` helper added in that PR (`cli.ts:1602`) makes the RFC status
readable from the index already loaded by `ready()` (`index.rfcs`), so the
enforcement can move into the queue cheaply.

## Acceptance criteria

- [ ] `ready()` excludes any story whose own RFC status is not `active`
      (i.e. `draft`/`postponed`/`superseded`/`closed` RFCs do not contribute
      claimable stories), using `index.rfcs` status already in scope — no extra
      filesystem reads.
- [ ] Decide and document the `closed`-RFC case: a `ready` story under a
      `closed` RFC is almost certainly stale; excluding it from the queue is
      consistent with "only active RFCs feed pickup."
- [ ] Unit tests cover: `ready` story under active RFC (included), under draft
      RFC (excluded), under postponed/superseded/closed RFC (excluded).
- [ ] No change to `next-bundle`/`list` semantics beyond what flows from
      `ready()` (verify `bestBundle` still operates on the filtered set).
