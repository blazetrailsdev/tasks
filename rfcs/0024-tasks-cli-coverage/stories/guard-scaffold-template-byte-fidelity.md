---
title: "CI guard: scaffold generators stay byte-identical to 0000-template"
status: claimed
updated: 2026-06-23
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-06-23T14:49:50Z"
assignee: "guard-scaffold-template-byte-fidelity"
blocked-by: null
---

## Context

PR #3862 (template-quality-sections) added `## Definition of done` /
`## Verification` to the story template and `## Non-goals` / `## Verification`

- an open-questions note to the RFC template (`rfcs/0000-template/` in the
  tasks repo), and hand-synced the trails scaffold generators
  `buildStoryContent` and `buildRfcContent` (`scripts/tasks/cli.ts`) to match.

Review of #3862 flagged that the byte-fidelity between the trails scaffolds
and the tasks-repo source-of-truth templates is **unverifiable from CI**: the
templates live in the separate `tasks` repo, so trails CI cannot read them,
and the scaffold's own tests (`cli.test.ts`) only pin the scaffold against
itself. If `rfcs/0000-template/README.md` or `stories/template-story.md`
drift, the "every author is prompted for these sections" goal silently breaks
and nothing catches it. Today fidelity is maintained by hand (a reviewer
manually diffed via the worktree's `tasks/` symlink).

## Acceptance criteria

- [ ] A check (CI job or `pnpm validate` step, in whichever repo can see both
      trees — likely tasks, which has the templates, comparing against the
      published trails scaffold output) fails when the scaffold's default
      `buildRfcContent` / `buildStoryContent` body diverges from
      `rfcs/0000-template/README.md` / `stories/template-story.md`.
- [ ] The check compares the structural sections that must stay byte-identical
      (headings, ordering, placeholder prose) and tolerates the deliberate
      differences (story scaffold is headings-only; Stories/Changelog tables
      are regenerated).
- [ ] Decide and document which repo owns the guard (the symlink only exists
      in trails worktrees, not in CI runners for either repo).

## Notes

Builds on the byte-fidelity convention established in #3862. Lower priority —
this is defense against future drift, not a current bug.
