---
title: "tasks new-rfc — scaffold a placeholder RFC from the template"
status: done
updated: 2026-06-13
rfc: "0024-tasks-cli-coverage"
cluster: rfc-commands
deps: []
deps-rfc: []
est-loc: 110
priority: 31
pr: 3202
claim: "2026-06-13T19:36:33Z"
assignee: "cli-new-rfc"
blocked-by: null
---

## Context

Authoring an RFC today means hand-copying `rfcs/0000-template/` and editing the
frontmatter + H1 by hand. This story adds `tasks new-rfc` so the scaffold is a
single command, mirroring how `new` already creates stories via
`buildStoryContent()` + `commitAndPush()` in `cli.ts`.

## Acceptance criteria

- [ ] `tasks new-rfc <slug>` accepts `--title`, `--owner`, `--packages <csv>`,
      `--clusters <csv>`, and `--related <csv>`, and creates
      `rfcs/0000-<slug>/README.md` from the template with frontmatter filled
      (`rfc: "0000-<slug>"`, title, owner, created/updated = today, packages,
      clusters) and a number-free H1.
- [ ] Slug is validated (lowercase alphanumeric + hyphens); refuses if
      `rfcs/0000-<slug>` already exists.
- [ ] Commits + pushes via the existing `commitAndPush` retry path, message
      `new-rfc: 0000-<slug>`.
- [ ] A `buildRfcContent()` builder is added alongside `buildStoryContent()`.
- [ ] `--packages` / `--clusters` / `--related` arrays render correctly (reuse
      the block writer from [[frontmatter-block-editor]] if landed, else write the
      template arrays directly since this writes a whole new file).
- [ ] `--body-file <path>` (optional) seeds the README body from a file instead of
      the template's placeholder prose, so the full RFC (frontmatter + body) can be
      authored non-interactively without ever hand-editing the `.md`. Interactive
      body revision is covered by [[cli-edit-story-body]].

## Notes

New RFCs are always placeholders (`0000-`) numbered at merge by
[[cli-finalize-rfc]]; this command must not assign a number. Pairs well with
[[validate-as-library]] for fail-fast validation, but does not strictly depend on
it.
