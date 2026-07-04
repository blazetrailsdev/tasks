---
title: "Migrate parked/superseded stories to the new closed status"
status: claimed
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-04T18:19:28Z"
assignee: "migrate-parked-stories-to-closed-status"
blocked-by: null
closed-reason: null
---

## Context

The terminal `closed` story status + `pnpm tasks close <id> --reason "<text>"`
verb shipped in trails PR #4382 and tasks PR #57 (`STORY_STATUSES`, validation,
auto-close/rollup, reconcile, docs). That PR delivered only the _mechanism_ and
deliberately left the _data migration_ out of scope.

Several existing stories are parked in `blocked` forever, or were hacked as
`done` with a `pr:` pointing at an RFC/superseding-story instead of shipped
code, precisely because there was no terminal "won't ship code" state before
now. Example called out during the mechanism work: `pr-a-delete-adapter-barrel`.
These should now be moved to the real terminal state:
`pnpm tasks close <id> --reason "<superseded|abandoned|won't-do rationale>"`.

## Acceptance criteria

- [ ] Enumerate stories that are effectively superseded/abandoned: `blocked`
      stories whose blocker is "superseded by / will never happen", plus `done`
      stories whose `pr:` points at an RFC or a superseding story rather than a
      merged code PR.
- [ ] For each, run `pnpm tasks close <id> --reason "<text>"` with a reason that
      distinguishes superseded vs abandoned vs won't-do (that text is the only
      record of the sub-case).
- [ ] Do NOT close stories that are legitimately blocked on real pending work —
      those stay `blocked` with their `blocked-by`.
- [ ] Reindex and confirm `pnpm tasks validate` passes and the closed stories
      drop out of `ready` / `next-bundle`.

## Notes

Data-only change (frontmatter edits via the CLI, direct-to-main). No code.
