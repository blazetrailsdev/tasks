---
title: "Templates: Definition of done / Verification / Non-goals sections"
status: done
updated: 2026-06-22
rfc: "0024-tasks-cli-coverage"
cluster: story-fields
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: 3862
claim: "2026-06-22T03:07:56Z"
assignee: "template-quality-sections"
blocked-by: null
---

## Context

The best stories on `main` already invent sections the template lacks: the
0019 adapter story added an ad-hoc `## Definition of done` ("a blanket
eslint-disable does **not** close this story") — the single most useful
sentence in that file for an autonomous agent — and 0025 stories embed exact
verification commands inside acceptance criteria. Promote these patterns into
the templates so every author gets prompted for them. Likewise, RFC-level
descoping decisions currently have nowhere canonical to live (the 0025
descoping rationale ended up only in session memory).

Template changes (`rfcs/0000-template/`):

- **Story template**: add optional `## Definition of done` (the
  negative-space sentence: what does NOT close this story) and a
  `## Verification` line (the exact command(s) that prove the story —
  `pnpm vitest run …`, a grep count, an exclude-list size).
- **RFC template**: add `## Non-goals` (deliberately descoped, with one-line
  reasons) and `## Verification` (how we'll know the RFC worked — metric,
  count, burndown target). Note in the `## Open questions` comment that
  questions must be resolved or explicitly deferred before `status: active`.

## Acceptance criteria

- [x] `rfcs/0000-template/stories/template-story.md` gains
      `## Definition of done` and `## Verification` with one-line guidance
      comments; both marked optional (delete-if-empty, like `## Notes`).
- [x] `rfcs/0000-template/README.md` gains `## Non-goals` and
      `## Verification` sections with guidance, and the open-questions note.
- [x] `tasks new` scaffolding (`buildStoryContent` in trails
      `scripts/tasks/cli.ts`) stays in sync with the story template; its
      format test updated.
- [x] Top-level README's authoring section mentions the new sections in one
      sentence each.

## Notes

Docs/template-only plus the small `buildStoryContent` sync — no validator
changes here. If a later story wants to gate on these sections, it builds on
[[validate-story-body-quality]].
