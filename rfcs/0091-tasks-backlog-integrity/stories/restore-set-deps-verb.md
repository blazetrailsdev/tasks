---
title: "Restore tasks set-deps / set-deps-rfc (lost in the tasks-next rewrite)"
status: draft
updated: 2026-09-30
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`deps` and `deps-rfc` are markdown-owned fields, but the tasks CLI has no verb
to edit them, so every refine agent that needs to wire dependencies stops and
asks the operator for permission to hand-edit frontmatter and push to main.
This happens almost daily (e.g. the `0160-actionpack-test-harness-parity`
refine: three stories needing `deps:` edits, including a capstone that needed
six new drafts appended).

This is a regression, not a gap. `set-deps` / `set-deps-rfc` shipped in
trails#3204 (trails commit `9b91d6f161`, `scripts/tasks/cli.ts` +
`scripts/tasks/cli.test.ts`, story `0024-tasks-cli-coverage/cli-set-deps`,
with the cycle/reference check shared via `set-deps-share-validator`,
trails#3402). The `tasks-next` rewrite (tasks repo `a9a0eb28` onward) ported
the array-safe `setFrontmatterList` (`src/frontmatter.ts:101`) but not the
verb — see the `Mutate:` block in `src/cli.ts` usage.

The closest existing shapes in the tasks repo are the other markdown-owned
mutators: `rehome` (`src/rehome.ts` — authors into the MAIN working tree via
`mainWorktree`, validates all-or-nothing, commits, `pushMain`, then `ingest`)
and `rfc-status` (`src/rfc-status.ts`). Cycle and reference checks live in
`scripts/validate-lib.mjs` (exposed through `src/authoring.ts`'s
`loadAll` / `validateStoryFile`).

## Acceptance criteria

- [ ] `tasks set-deps <id> <csv>` replaces `deps`; `tasks set-deps-rfc <id> <csv>`
      replaces `deps-rfc`. Empty csv (`""`) clears the array to `[]`.
- [ ] `--add a,b` / `--remove a,b` edit the array incrementally (append
      de-duplicated, preserving existing order) so a caller does not have to
      re-read and re-type an existing list — the capstone case above.
- [ ] Writes go through `setFrontmatterList`; the file is authored in the main
      working tree exactly as `rehome` does, never the caller's worktree.
- [ ] Every referenced story (`deps`) / RFC (`deps-rfc`) must exist, and a
      change that introduces a dependency cycle is refused — both reusing the
      validator's existing checks, not a duplicate DFS. A refusal changes no file
      and makes no commit.
- [ ] Commits (message `set-deps: <id>` / `set-deps-rfc: <id>`), pushes via the
      same path `rehome` uses, then ingests so the DB reflects the new edges.
      `--no-commit` supported like `rehome`.
- [ ] Listed under `Mutate:` in the usage text.
- [ ] Tests in the tasks repo covering: replace, clear, `--add`, `--remove`,
      unknown reference refused, cycle refused, no commit on refusal.
- [ ] trails `CLAUDE.md` § "Task state vs. task prose" mentions `tasks set-deps`
      as the way to add a dependency (a follow-up trails PR is fine if the tasks
      PR lands first).
